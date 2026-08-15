import { createId as cuid } from "@paralleldrive/cuid2";
import { KplPlayer } from "./player.js";
import { randomBytes } from "crypto";
import { broadcastLobbyUpdate, destroyRoom, generateUniqueJoinCode } from "./room-manager.js";
import { safeAwait } from "../utils/safe-await.js";
import { Card, getCardsForDecks } from "../database.js";
import { smartArrayShuffleAtPlace } from "../utils/shuffle.js";
import { wait } from "../utils/wait.js";
import { randomElement } from "../utils/random.js";
import chalk from "chalk";
import { GameErrors } from "../errors.js";

export enum RoomState {
	LOBBY = 'lobby',
	WAITING = 'waiting',
	PICK_WHITE = 'pick_white',
	PICK_CZAR = 'pick_czar',
}

type PlayerData = {
	points: number;
	czarCounter: number;
	hand: Card[];
};
const MIN_PLAYERS = 3;
const TIME_TO_START = 45;

/*
 * How long a running game waits for a dropped player before giving up. The
 * client reconnects and rejoins automatically, so a tab that got hibernated or
 * a few seconds of bad wifi should not end everyone's game — which is what
 * happened before, the moment a drop took the room under MIN_PLAYERS.
 */
const RECONNECT_GRACE_SECONDS = 90;

/** How long the winning card is left on the table before the next round. */
const WINNER_REVEAL_MS = 3500;

export type ChatMessage = {
	id: string;
	kind: 'player' | 'system';
	uuid: string | null;
	username: string | null;
	text: string;
	at: string;
};

/** Enough backlog that someone joining mid-game sees the last few jokes. */
const CHAT_HISTORY_LIMIT = 60;
const CHAT_MAX_LENGTH = 300;
const CHAT_MIN_INTERVAL_MS = 500;

export type RoomConstructorData = {
	name: string;
	goal: number;
	maxPlayers: number;
	isPublic: boolean;
	host: KplPlayer | undefined;
	decks: number[];
};

type IdentifiedResource<T> = {
	id: string;
	playerUUID: string;
	resource: T;
}

export class KplRoom {
	public readonly uuid: string;
	public readonly name: string;

	public readonly maxPlayers: number;
	public readonly goal: number;
	public readonly isPublic: boolean;

	private hostUUID: string | null = null;
	private czarUUID: string | null = null;
	private players: KplPlayer[] = [];
	private playerData: Record<string, PlayerData> = {};

	private _state: RoomState = RoomState.LOBBY;
	private intermissionStart: Date | null = null;
	private intermissionEnd: Date | null = null;
	private intermissionTimer: NodeJS.Timeout | null = null;

	private isDestroyed = false;

	private chatLog: ChatMessage[] = [];
	private lastChatAt: Record<string, number> = {};

	private deckIds: number[] = [];
	private decks = {
		white: [] as Card[],
		whiteUsed: [] as Card[],
		blackUsed: [] as Card[],
		black: [] as Card[],
	}
	private table = {
		black: null as Card | null,
		lastRoundWinnerGroupId: null as string | null,
		lastRoundWinnerUUID: null as string | null,
		white: [] as IdentifiedResource<Card[]>[],
	}

	private timings = {
		whitePick: 2 * 60,
		czarPick: 3 * 60,
	}

	constructor({ name, goal, maxPlayers, isPublic, host, decks }: RoomConstructorData) {
		this.uuid = generateUniqueJoinCode();
		this.name = name;
		this.goal = goal;
		this.maxPlayers = maxPlayers;
		this.isPublic = isPublic;
		this.deckIds = decks;

		if (host) {
			this.hostUUID = host.uuid;
		}

		console.log(`${chalk.bold.greenBright('+')} New room ${chalk.bold( this.name)} (${chalk.gray(this.uuid)}) ${chalk.greenBright('created by')} ${host ? `${chalk.bold(host.username)} (${chalk.gray(host.uuid)})` : 'system'}`);
	}

	public get playerCount(): number {
		return this.players.length;
	}

	public get state(): RoomState {
		return this._state;
	}

	public get hostId(): string | null {
		return this.hostUUID;
	}


	// #region Game logic
	public async start() {
		if (this._state !== RoomState.LOBBY) {
			return;
		}

		// Remove room from lobby
		this._state = RoomState.WAITING;
		broadcastLobbyUpdate();

		await this.loadDecks();

		while (!this.isDestroyed) {
			if (this.players.length < MIN_PLAYERS) {
				const recovered = await this.waitForPlayers();

				if (!recovered) {
					this.players.forEach(player => player.sendError(GameErrors.ROOM_DESTROYED_PLAYER_QUIT));
					destroyRoom(this);
					return;
				}
			}

			await this.nextRound();

			if (this.isDestroyed) {
				return;
			}

			if (this.players.some(player => this.playerData[player.uuid]?.points >= this.goal)) {
				this.end();
				return;
			}
		}
	}

	private async end() {
		const results = {
			roomUUID: this.uuid,
			score: this.players.map(player => ({
				uuid: player.uuid,
				username: player.username,
				image: player.image,
				points: this.playerData[player.uuid].points,
			})),
		}

		this.players.forEach(player => {
			player.rpc('gameResults', results, -1);
		});

		// The room used to be destroyed here, so playing again meant making a new
		// one and re-sharing the code with everybody. The same group nearly always
		// wants another round, so the room stays and resets instead.
		this.resetForNewGame();
	}

	/** Back to the lobby with the same seats: scores, hands and decks cleared. */
	private resetForNewGame(): void {
		if (this.isDestroyed) {
			return;
		}

		this.cancelIntermission();
		this._state = RoomState.LOBBY;
		this.czarUUID = null;

		this.table = {
			black: null,
			lastRoundWinnerGroupId: null,
			lastRoundWinnerUUID: null,
			white: [],
		};

		// loadDecks() appends, so these have to be empty before the next start.
		this.decks = {
			white: [],
			whiteUsed: [],
			black: [],
			blackUsed: [],
		};

		for (const uuid of Object.keys(this.playerData)) {
			this.playerData[uuid] = { points: 0, hand: [], czarCounter: 0 };
		}

		this.postSystemMessage('Konec hry. Hostitel může rovnou spustit další.');
		this.broadcastGameState();
		broadcastLobbyUpdate();
	}

	/** Hold the game open while a dropped player reconnects. */
	private async waitForPlayers(): Promise<boolean> {
		this.postSystemMessage(
			`Čekám na návrat hráče — hra pokračuje, jakmile vás bude zase ${MIN_PLAYERS}.`
		);

		const deadline = Date.now() + RECONNECT_GRACE_SECONDS * 1000;

		while (Date.now() < deadline) {
			if (this.isDestroyed) {
				return false;
			}

			if (this.players.length >= MIN_PLAYERS) {
				this.postSystemMessage('Jsme zpátky v plném počtu, pokračujeme.');
				return true;
			}

			await wait(1000);
		}

		return false;
	}

	private async nextRound() {
		// Init round
		this.table.lastRoundWinnerGroupId = null;
		this.table.lastRoundWinnerUUID = null;
		this.table.white = [];
		this.fillHandForAllPlayers();
		this.pickNextCzar();
		this.broadcastGameState();

		this.table.black = this.drawBlackCard();
		if (!this.table.black) {
			// TODO: Send error, no black cards left
			destroyRoom(this);
			return;
		}

		// Let players play cards
		this._state = RoomState.PICK_WHITE;
		this.broadcastGameState();
		this.setIntermission(this.timings.whitePick, this.cancelIntermission);
		await Promise.all(this.players.map(async (player) => {
			// Skip czar
			if (this.czarUUID === player.uuid) {
				return;
			}

			const pickCount = this.table.black!.pick;
			const playerCards = this.playerData[player.uuid].hand;

			// Wait for player to pick cards or timeout
			const [ cardSelection, error ] = await safeAwait(player.rpc<number[]>('pickWhiteCards', {
				count: pickCount,
			}, this.timings.whitePick * 1000));

			if (error || !cardSelection || Array.isArray(cardSelection) && cardSelection.length === 0) {
				// Player didn't pick cards in time, pick random cards
				// Out of time, or gone. Play for them from their own hand so the
				// round is not held up — picking DISTINCT cards, because drawing at
				// random twice could otherwise put the same card down twice.
				const remaining = [...playerCards];
				const pickedCards: Card[] = [];
				for (let i = 0; i < pickCount && remaining.length > 0; i++) {
					const card = randomElement(remaining);
					pickedCards.push(card);
					remaining.splice(remaining.indexOf(card), 1);
				}
				this.playerData[player.uuid].hand = remaining;
				this.table.white.push({
					id: cuid(),
					playerUUID: player.uuid,
					resource: pickedCards,
				});

				// Everyone is watching to see who they are still waiting for.
				this.broadcastGameState();
				return;
			}

			//Validate card selection and add to table
			const pickedCards: Card[] = [];
			cardSelection.forEach(cardId => {
				const card = playerCards.find(card => card.id === cardId);
				if (card) {
					pickedCards.push(card);
				}
			});
			if (pickedCards.length !== pickCount) {
				//Invalid card selection, skip player round
				//TODO: Send error to player
				return;
			}

			this.table.white.push({
				id: cuid(),
				playerUUID: player.uuid,
				resource: pickedCards,
			});

			// Wait for card animations to finish and remove cards from player hands
			await wait(1000);
			this.playerData[player.uuid].hand = playerCards.filter(card => !pickedCards.includes(card));
			// Not just this player: the others need to see that they are done.
			this.broadcastGameState();
		}));

		// End player move
		this.cancelIntermission();

		// Prepare czar move
		this._state = RoomState.PICK_CZAR;
		smartArrayShuffleAtPlace(this.table.white);
		this.setIntermission(this.timings.czarPick, this.cancelIntermission);
		this.broadcastGameState();
		const czar = this.players.find(player => player.uuid === this.czarUUID);
		if (!czar) {
			//TODO: Error, czar left (skip round and maybe give cards back to players)
			return;
		}

		if (this.table.white.length === 0) {
			//TODO: Error, no white cards to pick from
		}

		const [ czarSelection, error ] = await safeAwait(czar.rpc('pickCzarCard', this.table.white, this.timings.czarPick * 1000));
		this.cancelIntermission();

		// A czar who never answers used to end the round with no winner and no
		// points — everyone had played for nothing. Decide it for them instead.
		let chosenGroupId = czarSelection;
		if (error || !chosenGroupId) {
			const fallback = randomElement(this.table.white);
			if (!fallback) {
				return;
			}
			chosenGroupId = fallback.id;
			this.postSystemMessage(`${czar.username} nerozhodl včas — vítěze vybral los.`);
		}

		const winningCardGroup = this.table.white.find(cardGroup => cardGroup.id === chosenGroupId);
		if (!winningCardGroup) {
			//TODO: Error, invalid card group
			return;
		}


		// Show winner and give points
		this.table.lastRoundWinnerGroupId = winningCardGroup.id;
		this.table.lastRoundWinnerUUID = winningCardGroup.playerUUID;
		const winnerUUID = winningCardGroup.playerUUID;
		this.playerData[winnerUUID].points++;
		this.broadcastGameState();

		const winner = this.players.find(p => p.uuid === winnerUUID);
		if (winner) {
			this.postSystemMessage(`${winner.username} bere bod.`);
		}

		// Move used cards to used pile
		this.table.white.forEach(cardGroup => {
			this.decks.whiteUsed.push(...cardGroup.resource);
		});

		// The reveal: losing cards flip back, the winner stays face up with the
		// name of whoever played it. Long enough to read, short enough not to drag.
		await wait(WINNER_REVEAL_MS);
	}

	private pickNextCzar(): void {
		// TODO: Prevent player who was offline to go on czar spree

		this.czarUUID = this.players.reduce((candidate, player) => {
			const candidateCzarCounter = this.playerData[candidate].czarCounter;
			const playerCzarCounter = this.playerData[player.uuid].czarCounter;

			if (playerCzarCounter < candidateCzarCounter) {
				return player.uuid;
			}
			return candidate;
		}, this.players[0].uuid);
		this.playerData[this.czarUUID].czarCounter++;
	}

	// #endregion

	// #region Intermission
	private cancelIntermission(): void {
		if (this.intermissionTimer) {
			clearTimeout(this.intermissionTimer);
			this.intermissionTimer = null;
			this.intermissionStart = null;
			this.intermissionEnd = null;
			this.broadcastGameState();
		}
	}

	// #region Chat
	private pushChat(message: ChatMessage): void {
		this.chatLog.push(message);

		if (this.chatLog.length > CHAT_HISTORY_LIMIT) {
			this.chatLog.splice(0, this.chatLog.length - CHAT_HISTORY_LIMIT);
		}

		this.players.forEach(player => safeAwait(player.rpc('chat', message, -1)));
	}

	/** A line from the room itself: joins, leaves, who took the point. */
	public postSystemMessage(text: string): void {
		if (this.isDestroyed) {
			return;
		}

		this.pushChat({
			id: cuid(),
			kind: 'system',
			uuid: null,
			username: null,
			text,
			at: new Date().toISOString(),
		});
	}

	/** Returns false when the message was rejected (empty, too fast, wrong type). */
	public postPlayerMessage(player: KplPlayer, rawText: unknown): boolean {
		if (this.isDestroyed || typeof rawText !== 'string') {
			return false;
		}

		const text = rawText.replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LENGTH);
		if (!text) {
			return false;
		}

		// Cheap flood guard — one message per half second per player.
		const now = Date.now();
		if (now - (this.lastChatAt[player.uuid] ?? 0) < CHAT_MIN_INTERVAL_MS) {
			return false;
		}
		this.lastChatAt[player.uuid] = now;

		this.pushChat({
			id: cuid(),
			kind: 'player',
			uuid: player.uuid,
			username: player.username,
			text,
			at: new Date().toISOString(),
		});

		return true;
	}

	/** Bring one player's screen up to date — used when a tab takes over. */
	public syncPlayer(player: KplPlayer): void {
		this.sendGameState(player);
		this.sendChatHistory(player);
	}

	public sendChatHistory(player: KplPlayer): void {
		safeAwait(player.rpc('chatHistory', { messages: this.chatLog }, -1));
	}
	// #endregion

	private setIntermission(duration: number, callback: () => void = () => {}): void {
		if (this.intermissionTimer) {
			clearTimeout(this.intermissionTimer);
			this.intermissionTimer = null;
			this.intermissionEnd = null;
		}

		this.intermissionStart = new Date();
		this.intermissionEnd = new Date(Date.now() + duration * 1000);
		this.intermissionTimer = setTimeout(callback, duration * 1000);
		this.broadcastGameState();
	}
	// #endregion


	// #region Decks
	private async loadDecks(): Promise<void> {
		const [cards, error] = await safeAwait(
			Promise.resolve(getCardsForDecks(this.deckIds, this.hostUUID || ''))
		);

		if (error || !cards || cards.length === 0) {
			this.players.forEach(player => player.sendError(GameErrors.ROOM_NOT_INITED));
			destroyRoom(this);
			return;
		}

		cards.forEach(card => {
			this.decks[card.pick === 0 ? 'white' : 'black'].push(card);
		});

		smartArrayShuffleAtPlace(this.decks.white);
		smartArrayShuffleAtPlace(this.decks.black);
	}

	private drawWhiteCard(): Card | null {
		if (this.decks.white.length === 0) {
			this.decks.white = this.decks.whiteUsed;
			this.decks.whiteUsed = [];
			smartArrayShuffleAtPlace(this.decks.white);
		}

		if (this.decks.white.length === 0) {
			//TODO: Error, no white cards left
			return null;
		}

		return this.decks.white.pop() ?? null;
	}

	private drawBlackCard(): Card | null {
		// Retire the card the previous round was played on.
		if (this.table.black) {
			this.decks.blackUsed.push(this.table.black);
		}

		// Small themed packs hold as few as a dozen black cards, so a long game
		// will empty the pile. Reshuffle what has been played rather than
		// killing the room mid-game — the same thing the white deck already does.
		if (this.decks.black.length === 0) {
			if (this.decks.blackUsed.length === 0) {
				return null;
			}

			this.decks.black = this.decks.blackUsed;
			this.decks.blackUsed = [];
			smartArrayShuffleAtPlace(this.decks.black);
		}

		return this.decks.black.pop() ?? null;
	}

	private fillHand(player: KplPlayer): void {
		const hand = this.playerData[player.uuid].hand;
		while (hand.length < 10) {
			const card = this.drawWhiteCard();
			if (!card) {
				break;
			}
			hand.push(card);
		}
		this.sendGameState(player);
	}

	private fillHandForAllPlayers(): void {
		this.players.forEach(player => this.fillHand(player));
	}

	// #endregion

	public onRoomDestroy(): void {
		if (this.isDestroyed) {
			return;
		}

		this.isDestroyed = true;
		console.log(`${chalk.bold.redBright('-')} Room ${chalk.bold(this.name)} (${chalk.gray(this.uuid)}) ${chalk.redBright('destroyed')}`);
		this.cancelIntermission();
		this.players.forEach(player => player.quitRoom());
	}

	// #region Player join/leave
	public onPlayerJoin(player: KplPlayer): boolean {
		if (this.isDestroyed) {
			player.sendError(GameErrors.ROOM_NOT_FOUND);
			return false;
		}

		// If room is full, refuse to join
		if (this.players.length >= this.maxPlayers) {
			player.sendError(GameErrors.ROOM_FULL);
			return false;
		}

		// If player already was in the room before but disconnected (reconnect)
		if (this.playerData[player.uuid]) {
			console.log(`Player ${chalk.bold(player.username)} (${chalk.gray(player.uuid)}) ${chalk.yellowBright('rejoined room')} ${chalk.bold(this.name)} (${chalk.gray(this.uuid)})`);
			this.players.push(player);
			broadcastLobbyUpdate();
			this.broadcastGameState();
			this.sendChatHistory(player);
			this.postSystemMessage(`${player.username} se vrátil do hry.`);
			return true;
		}

		// If player is new and game is already running, refuse to join
		if (this._state !== RoomState.LOBBY) {
			player.sendError(GameErrors.ROOM_ALREADY_STARTED);
			return false;
		}

		// Add player to room
		console.log(`Player ${chalk.bold(player.username)} (${chalk.gray(player.uuid)}) ${chalk.greenBright('joined room')} ${chalk.bold(this.name)} (${chalk.gray(this.uuid)})`);
		this.players.push(player);
		this.playerData[player.uuid] = {
			points: 0,
			hand: [],
			czarCounter: 0,
		};

		// If room doesn't have a host (automated room) and enough players, start game countdown
		if (this.players.length >= MIN_PLAYERS && !this.hostUUID && !this.intermissionTimer) {
			this.setIntermission(TIME_TO_START, () => {
				this.start();
			});

		}

		this.broadcastGameState();
		broadcastLobbyUpdate();
		this.sendChatHistory(player);
		this.postSystemMessage(`${player.username} se připojil.`);
		return true;
	}

	public onPlayerLeave(player: KplPlayer): void {
		console.log(`Player ${chalk.bold(player.username)} (${chalk.gray(player.uuid)}) ${chalk.red('left room')} ${chalk.bold(this.name)} (${chalk.gray(this.uuid)})`);

		// Remove player from room
		this.players = this.players.filter(p => p !== player);

		if (this.isDestroyed) {
			return;
		}

		this.postSystemMessage(`${player.username} odešel.`);

		// If game is not running, remove player data entirely
		if (this._state === RoomState.LOBBY) {
			delete this.playerData[player.uuid];
		}

		// If player was host, assign new host
		if (this.hostUUID === player.uuid) {
			this.hostUUID = this.players[0]?.uuid ?? null;
		}

		// If room doesn't have a host (automated room) and not enough players, stop game countdown
		if (this.players.length < MIN_PLAYERS && !this.hostUUID && this.intermissionTimer) {
			this.cancelIntermission();
		}

		this.broadcastGameState();

		// An empty room is over, no question.
		if (this.players.length === 0) {
			destroyRoom(this);
			return;
		}

		// Otherwise a running game holds itself open — the loop in start() waits
		// out RECONNECT_GRACE_SECONDS and only then gives up.
		if (this._state !== RoomState.LOBBY && this.players.length < MIN_PLAYERS) {
			this.postSystemMessage(
				`${player.username} vypadl ze hry — držím místnost ${RECONNECT_GRACE_SECONDS} s, ať se stihne vrátit.`
			);
		}
	}
	//#endregion

	// #region Sync

	private async broadcastGameState(): Promise<void> {
		await Promise.all(this.players.map(player => this.sendGameState(player)));
	}

	private async sendGameState(player: KplPlayer) {
		const playerData = this.playerData[player.uuid];

		const roomData = {
			uuid: this.uuid,
			name: this.name,
			goal: this.goal,
			maxPlayers: this.maxPlayers,
			isPublic: this.isPublic,

			state: this._state,
			intermissionStart: this.intermissionStart,
			intermissionEnd: this.intermissionEnd,

			hand: {
				cards: (playerData?.hand ?? []).map(card => ({
					id: card.id,
					text: card.text,
					tip: card.tip,
				})),
			},
			table: {
				black: this.table.black ? {
					id: this.table.black.id,
					text: this.table.black.text,
					tip: this.table.black.tip,
					pick: this.table.black.pick,
				} : null,

				white: this.state === RoomState.PICK_CZAR ? this.table.white.map(cardGroup => {
					return {
						id: cardGroup.id,
						cards: cardGroup.resource.map(card => ({
							id: card.id,
							text: card.text,
							tip: card.tip,
						})),
					}
				}) : [],


				lastRoundWinnerGroupId: this.table.lastRoundWinnerGroupId,

				// Who played it. Deliberately only after the czar has decided —
				// during judging the cards must stay anonymous.
				lastRoundWinner: this.table.lastRoundWinnerUUID
					? {
						uuid: this.table.lastRoundWinnerUUID,
						username: this.players.find(p => p.uuid === this.table.lastRoundWinnerUUID)?.username ?? 'Hráč',
					}
					: null,
			},

			players: this.players.map(p => ({
				uuid: p.uuid,
				username: p.username,
				image: p.image,
				points: this.playerData[p.uuid].points,
				isHost: this.hostUUID === p.uuid,
				isCzar: this.czarUUID === p.uuid,
				// Who is everyone still waiting for? The table already knows — a
				// player is done the moment their cards are on it.
				hasPlayed: this.table.white.some(group => group.playerUUID === p.uuid),
			})),
		};

		return await safeAwait(player.rpc('room', roomData, -1));
	}

	// #endregion
}
