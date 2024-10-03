import { createId as cuid } from "@paralleldrive/cuid2";
import { KplPlayer } from "./player.js";
import { randomBytes } from "crypto";
import { broadcastLobbyUpdate, destroyRoom, generateUniqueJoinCode } from "./room-manager.js";
import { safeAwait } from "../utils/safe-await.js";
import { db } from "../database.js";
import { Card } from "@prisma/client";
import { smartArrayShuffleAtPlace } from "../utils/shuffle.js";
import { wait } from "../utils/wait.js";
import { randomElement } from "../utils/random.js";

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

	private deckIds: number[] = [];
	private decks = {
		white: [] as Card[],
		whiteUsed: [] as Card[],
		black: [] as Card[],
	}
	private table = {
		black: null as Card | null,
		lastRoundWinnerGroupId: null as string | null,
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

		console.log(`Room ${this.name} (${this.uuid}) created by ${host ? `${host.username} (${host.uuid})` : 'system'}`);
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

		while (true) {
			await this.nextRound();

			if (this.players.some(player => this.playerData[player.uuid].points >= this.goal)) {
				this.end();
				return;
			}
		}
	}

	private async end() {
		const results = {
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

		destroyRoom(this);
	}

	private async nextRound() {
		// Init round
		this.table.lastRoundWinnerGroupId = null;
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
				const pickedCards: Card[] = [];
				for (let i = 0; i < pickCount; i++) {
					pickedCards.push(randomElement(playerCards));
				}
				this.playerData[player.uuid].hand = playerCards.filter(card => !pickedCards.includes(card));
				this.table.white.push({
					id: cuid(),
					playerUUID: player.uuid,
					resource: pickedCards,
				});

				return;
			}

			//Validate card selection and add to table
			const pickedCards = playerCards.filter((card) => cardSelection.includes(card.id));
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
			this.sendGameState(player);
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

		if (error || !czarSelection) {
			// TODO: Czar didn't pick card in time (skip round and maybe give cards back to players)
			return;
		}

		const winningCardGroup = this.table.white.find(cardGroup => cardGroup.id === czarSelection);
		if (!winningCardGroup) {
			//TODO: Error, invalid card group
			return;
		}


		// Show winner and give points
		this.table.lastRoundWinnerGroupId = winningCardGroup.id;
		const winnerUUID = winningCardGroup.playerUUID;
		this.playerData[winnerUUID].points++;
		this.broadcastGameState();

		// Move used cards to used pile
		this.table.white.forEach(cardGroup => {
			this.decks.whiteUsed.push(...cardGroup.resource);
		});

		// Wait before starting next round
		await wait(5000);
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
		const [cards, error] = await safeAwait(db.card.findMany({
			where: {
				deckId: {
					in: this.deckIds,
				},
				deck: {
					OR: [
						{ public: true },
						{ ownerUUID: this.hostUUID || '' },
					],
				}
			},
		}));

		if (error || !cards) {
			// TODO: Send room initialization error
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
		if (this.decks.black.length === 0) {
			//TODO: Error, no black cards left
			return null;
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
		console.log(`Room ${this.name} (${this.uuid}) destroyed`);
		this.players.forEach(player => player.quitRoom());
	}

	// #region Player join/leave
	public onPlayerJoin(player: KplPlayer): boolean {
		// If room is full, refuse to join
		if (this.players.length >= this.maxPlayers) {
			// TODO: Send room is full error
			return false;
		}

		// If player already was in the room before but disconnected (reconnect)
		if (this.playerData[player.uuid]) {
			console.log(`Player ${player.username} (${player.uuid}) reconnected to room ${this.name} (${this.uuid})`);
			this.players.push(player);
			broadcastLobbyUpdate();
			this.broadcastGameState();
			return true;
		}

		// If player is new and game is already running, refuse to join
		if (this._state !== RoomState.LOBBY) {
			// TODO: Send game has already started error
			return false;
		}

		// Add player to room
		console.log(`Player ${player.username} (${player.uuid}) joined room ${this.name} (${this.uuid})`);
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
		return true;
	}

	public onPlayerLeave(player: KplPlayer): void {
		console.log(`Player ${player.username} (${player.uuid}) left room ${this.name} (${this.uuid})`);

		// Remove player from room
		this.players = this.players.filter(p => p !== player);

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

		if (this._state !== RoomState.LOBBY && this.players.length < MIN_PLAYERS) {
			// If game is running and not enough players, end game
			// TODO: Send message to players
			destroyRoom(this);
		} else if (this.players.length === 0) {
			// If room is empty, destroy room
			destroyRoom(this);
		}
	}
	//#endregion

	// #region Sync

	private async broadcastGameState(): Promise<void> {
		await Promise.all(this.players.map(player => this.sendGameState(player)));
	}

	private async sendGameState(player: KplPlayer) {
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
				cards: this.playerData[player.uuid].hand.map(card => ({
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
			},

			players: this.players.map(p => ({
				uuid: p.uuid,
				username: p.username,
				image: p.image,
				points: this.playerData[p.uuid].points,
				isHost: this.hostUUID === p.uuid,
				isCzar: this.czarUUID === p.uuid,
			})),
		};

		return await safeAwait(player.rpc('room', roomData, -1));
	}

	// #endregion
}
