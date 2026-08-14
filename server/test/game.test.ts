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
				reply({ provider: 'anonymous', username: this.name, user_id: '', user_token: '' });
				return;

			case 'identity':
				this.uuid = data.uuid;
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

	log('\n--- decks ---');
	const decks = await host.rpc<any[]>('getAvailableCardDecks');
	const totalCards = decks.reduce((n, d) => n + d.totalCardCount, 0);
	log(`   ${decks.length} decks, ${totalCards} cards total`);
	assert(decks.length === 2 && totalCards === 1016, 'both card decks loaded (1016 cards, no database)');

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

	log('\n🎉 full game played end to end, no database involved.\n');
	process.exit(0);
}

main().catch((e) => { console.error('\n❌ ' + e.message); process.exit(1); });
