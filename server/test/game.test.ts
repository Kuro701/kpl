/*
 * Headless end-to-end test.
 *
 * Three players connect, join a private room by code, chat, then play a full
 * game to completion. Needs a server already running — this does not start one.
 * Requires Node 22+ (uses the global WebSocket) or Bun.
 */
// Point this at a running server. Defaults to a local dev server.
//   npm run test         (server must already be running on :3000)
//   TEST_SERVER_URL=wss://kpl-server.onrender.com npm run test
const URL = process.env.TEST_SERVER_URL || 'ws://127.0.0.1:3000';
const log = (...a: unknown[]) => console.log(...a);

type Msg = [string, number, any];
const RPC_CALL = 1, RPC_RESPONSE = 2, ERROR = 99;

let nonceSeq = 0;

class TestClient {
	ws!: WebSocket;
	name: string;
	uuid = '';
	token = '';
	room: any = null;
	results: any = null;
	chat: any[] = [];
	errors: string[] = [];
	pending = new Map<string, (v: any) => void>();

	constructor(name: string) { this.name = name; }

	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.ws = new WebSocket(URL);
			const t = setTimeout(() => reject(new Error(`${this.name}: connect timeout`)), 8000);

			this.ws.onmessage = (ev) => this.onMessage(String(ev.data), resolve, t);
			this.ws.onerror = () => { clearTimeout(t); reject(new Error(`${this.name}: socket error`)); };
			this.ws.onclose = () => { /* server may close us at game end */ };
		});
	}

	private onMessage(raw: string, resolveConnect: () => void, connectTimer: any) {
		let msg: Msg;
		try { msg = JSON.parse(raw); } catch { return; }
		const [nonce, type, data] = msg;

		if (type === ERROR) { this.errors.push(String(data)); return; }

		if (type === RPC_RESPONSE) {
			const p = this.pending.get(nonce);
			if (p) { this.pending.delete(nonce); p(data); }
			return;
		}

		if (type !== RPC_CALL || typeof data !== 'object' || data === null) return;
		const reply = (payload: unknown) => this.ws.send(JSON.stringify([nonce, RPC_RESPONSE, payload]));

		switch (data.f) {
			case 'auth':
				reply({ provider: 'anonymous', username: this.name, user_id: this.uuid, user_token: this.token });
				return;

			case 'identity':
				this.uuid = data.uuid;
				this.token = data.token ?? '';
				clearTimeout(connectTimer);
				resolveConnect();
				return;

			case 'room':
				this.room = data;
				return;

			case 'pickWhiteCards': {
				const hand = this.room?.hand?.cards ?? [];
				const picked = hand.slice(0, data.count).map((c: any) => c.id);
				log(`   ${this.name} plays ${picked.length}: ${hand.slice(0, data.count).map((c: any) => c.text).join(' + ')}`);
				reply(picked);
				return;
			}

			case 'pickCzarCard': {
				// The czar receives the table as the raw request payload.
				const groups = Object.values(data).find(Array.isArray) as any[] | undefined;
				const table = groups ?? this.room?.table?.white ?? [];
				const winner = table[Math.floor(Math.random() * table.length)];
				log(`   ${this.name} (czar) picks group ${winner?.id}`);
				reply(winner?.id);
				return;
			}

			case 'chat':
				this.chat.push(data);
				return;

			case 'chatHistory':
				this.chat = [...(data.messages ?? [])];
				return;

			case 'gameResults':
				this.results = data;
				return;
		}
	}

	kill() {
		this.pending.forEach(() => {});
		this.pending.clear();
		this.ws.close();
	}

	rpc<T>(f: string, data: Record<string, unknown> = {}, timeoutMs = 8000): Promise<T> {
		const nonce = `t${++nonceSeq}`;
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => { this.pending.delete(nonce); reject(new Error(`${this.name}: ${f} timed out`)); }, timeoutMs);
			this.pending.set(nonce, (v) => { clearTimeout(timer); resolve(v as T); });
			this.ws.send(JSON.stringify([nonce, RPC_CALL, { f, ...data }]));
		});
	}
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function assert(cond: unknown, label: string) {
	if (!cond) { console.error(`\n❌ FAIL: ${label}`); process.exit(1); }
	log(`✅ ${label}`);
}

const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

async function main() {
	log('\n--- connecting three players ---');
	const host = new TestClient('Kuro');
	const b = new TestClient('Terka');
	const c = new TestClient('Marek');
	await host.connect(); await b.connect(); await c.connect();
	assert(host.uuid && b.uuid && c.uuid, 'all three players got an identity');

	log('\n--- host creates a room ---');
	const code = await host.rpc<string>('createRoom', {
		name: '  Pátek večer  ',
		goal: 2,
		maxPlayers: 8,
		decks: [1, 2],
	});
	log(`   room code: ${code}`);
	assert(typeof code === 'string' && code.length === 5, 'join code is 5 characters');
	assert([...code].every(ch => CODE_ALPHABET.includes(ch)), 'join code uses only unambiguous characters');

	log('\n--- input sanitising ---');
	await sleep(200);
	assert(host.room?.name === 'Pátek večer', 'room name was trimmed');
	assert(host.room?.isPublic === false, 'room is private (no public lobby in this build)');

	log('\n--- joining by mangled code (lowercase + dash) ---');
	const messy = (code.slice(0, 2) + '-' + code.slice(2)).toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l');
	log(`   typing: "${messy}"`);
	const joinedB = await b.rpc<string | false>('joinRoom', { roomUUID: messy });
	assert(joinedB === code, 'O/0 and I/L/1 mix-ups still find the room');

	log('\n--- chat ---');
	await sleep(250);
	assert(
		host.chat.some(m => m.kind === 'system' && m.text.includes('Terka')),
		'joining posts a system line into the chat'
	);

	const sent = await b.rpc<boolean>('sendChatMessage', { text: '   kdo to sem dal   ' });
	await sleep(250);
	assert(sent === true, 'a player can send a message');

	const seen = host.chat.find(m => m.kind === 'player' && m.text === 'kdo to sem dal');
	assert(seen, 'the message reached the other players, trimmed');
	assert(seen?.username === 'Terka' && seen?.uuid === b.uuid, 'the message is attributed to the sender');

	const flood = await b.rpc<boolean>('sendChatMessage', { text: 'spam' });
	assert(flood === false, 'the flood guard rejects a second message within half a second');

	const empty = await b.rpc<boolean>('sendChatMessage', { text: '     ' });
	assert(empty === false, 'an empty message is rejected');

	log('\n--- a later joiner gets the backlog ---');
	const joinedC = await c.rpc<string | false>('joinRoom', { roomUUID: code });
	assert(joinedC === code, 'third player joined');
	await sleep(300);
	assert(
		c.chat.some(m => m.text === 'kdo to sem dal'),
		'the player who joined last received the chat history'
	);

	log('\n--- a wrong code must not open anything ---');
	const nobody = new TestClient('Vetřelec');
	await nobody.connect();
	const bad = await nobody.rpc<string | false>('joinRoom', { roomUUID: 'ZZZZZ' });
	assert(bad === false, 'unknown code is refused');

	log('\n--- themed packs ---');
	const decks = await host.rpc<any[]>('getAvailableCardDecks');
	for (const d of decks) log(`   ${d.name}: ${d.whiteCardCount} white, ${d.blackCardCount} black`);
	assert(decks.length === 5, 'five themed packs are offered');
	assert(decks.every(d => d.whiteCardCount > 0 && d.blackCardCount > 0),
		'every pack has both white AND black cards, so it is playable alone');

	log('\n--- starting the game (first to 2 points) ---');
	const started = await host.rpc<boolean>('startGame');
	assert(started === true, 'host could start the game');

	const nonHostStart = await b.rpc<boolean>('startGame').catch(() => false);
	assert(nonHostStart === false, 'a non-host cannot start the game');

	const deadline = Date.now() + 90_000;
	while (Date.now() < deadline && !host.results && !b.results && !c.results) {
		await sleep(250);
	}

	const results = host.results ?? b.results ?? c.results;
	assert(results, 'game reached a result');

	log('\n--- final score ---');
	for (const p of results.score) log(`   ${p.username}: ${p.points}`);
	assert(results.score.length === 3, 'all three players are in the score');
	assert(results.score.some((p: any) => p.points >= 2), 'somebody actually reached the goal');

	const allErrors = [...host.errors, ...b.errors, ...c.errors];
	assert(allErrors.length === 0, `no server errors were sent (${allErrors.join(', ') || 'none'})`);

	// ---------------------------------------------------------------------
	// The smallest pack holds about a dozen black cards. A game past that
	// length used to run the pile dry and destroy the room mid-play, so play
	// a long game on one small pack and make sure it survives the wrap-around.
	// This is the slow part of the suite — roughly a minute.
	// ---------------------------------------------------------------------
	log('\n--- long game on the smallest pack (black-card recycling) ---');
	const smallest = decks.reduce((min, d) => d.blackCardCount < min.blackCardCount ? d : min, decks[0]);
	log(`   using "${smallest.name}" — only ${smallest.blackCardCount} black cards`);

	host.results = null; b.results = null; c.results = null;
	const goal = smallest.blackCardCount + 2;

	const code2 = await host.rpc<string>('createRoom', {
		name: 'Recyklace', goal, maxPlayers: 8, decks: [smallest.id],
	});
	await b.rpc('joinRoom', { roomUUID: code2 });
	await c.rpc('joinRoom', { roomUUID: code2 });
	await host.rpc<boolean>('startGame');

	log(`   playing to ${goal} points — must outlast the ${smallest.blackCardCount}-card black pile`);
	const deadline2 = Date.now() + 240_000;
	while (Date.now() < deadline2 && !host.results && !b.results && !c.results) {
		await sleep(500);
	}

	const results2 = host.results ?? b.results ?? c.results;
	assert(results2, 'the long game finished instead of dying when black cards ran out');
	assert(results2?.score.some((p: any) => p.points >= goal), `somebody reached ${goal} points`);

	const lateErrors = [...host.errors, ...b.errors, ...c.errors];
	assert(lateErrors.length === 0, `still no server errors (${lateErrors.join(', ') || 'none'})`);

	// ---------------------------------------------------------------------
	// A dropped player used to end the game for everyone: the client never
	// reconnected, and the server destroyed any running room that fell under
	// three players. Kill a socket mid-game and make sure the room survives and
	// the player comes back with their points.
	// ---------------------------------------------------------------------
	log('\n--- a player drops mid-game and comes back ---');
	host.results = null; b.results = null; c.results = null;

	const code3 = await host.rpc<string>('createRoom', { name: 'Výpadek', goal: 3, maxPlayers: 8, decks: [5] });
	await b.rpc('joinRoom', { roomUUID: code3 });
	await c.rpc('joinRoom', { roomUUID: code3 });
	await host.rpc<boolean>('startGame');
	await sleep(2500);
	assert(host.room?.state !== 'lobby', 'the game is running');

	const pointsBefore = host.room.players.find((p: any) => p.uuid === c.uuid)?.points ?? 0;
	log(`   killing ${c.name}'s socket (had ${pointsBefore} points)`);
	c.kill();
	await sleep(3000);

	assert(host.room && host.room.uuid === code3, 'the room survived the drop');
	assert(host.room.players.length === 2, 'the dropped player is gone from the list');
	const stillThere = await host.rpc<any>('getRoomInfo', { roomUUID: code3 });
	assert(stillThere && stillThere.uuid === code3, 'the server still has the room, not destroyed');

	log(`   ${c.name} reconnects and rejoins`);
	await c.connect();
	await c.rpc('joinRoom', { roomUUID: code3 });
	await sleep(1500);

	assert(host.room.players.length === 3, 'the returning player is back in the room');
	const back = host.room.players.find((p: any) => p.uuid === c.uuid);
	assert(back, 'they came back as the SAME player, not a new one');
	assert((back?.points ?? -1) >= pointsBefore, 'their points survived the round trip');

	const deadline3 = Date.now() + 200_000;
	while (Date.now() < deadline3 && !host.results && !b.results && !c.results) {
		await sleep(400);
	}
	assert(host.results ?? b.results ?? c.results, 'the game finished normally after the reconnect');

	log('\n🎉 everything passed: three games, a mid-game reconnect, themed packs, chat, no database.\n');
	process.exit(0);
}

main().catch((e) => { console.error('\n❌ ' + e.message); process.exit(1); });
