import { createId as cuid } from "@paralleldrive/cuid2";
import { KplPlayer } from "./player.js";
import { randomBytes } from "crypto";
import { broadcastLobbyUpdate, destroyRoom, generateUniqueJoinCode } from "./room-manager.js";
import { safeAwait } from "../utils/safe-await.js";

enum RoomState {
	LOBBY = 'lobby',
}

type PlayerData = {
	points: number;
};
const MIN_PLAYERS = 3;
const TIME_TO_START = 30;

export type RoomConstructorData = {
	name: string;
	goal: number;
	maxPlayers: number;
	isPublic: boolean;
	host: KplPlayer | undefined;
};

export class KplRoom {
	public readonly uuid: string;
	public readonly name: string;

	public readonly maxPlayers: number;
	public readonly goal: number;
	public readonly isPublic: boolean;

	private hostUUID: string | null = null;
	private players: KplPlayer[] = [];  // TODO: Sync with clients
	private playerData: Record<string, PlayerData> = {}; // TODO: Sync with clients

	private _state: RoomState = RoomState.LOBBY;  // TODO: Sync with clients
	private intermissionStart: Date | null = null; // TODO: Sync with clients
	private intermissionEnd: Date | null = null; // TODO: Sync with clients
	private intermissionTimer: NodeJS.Timeout | null = null; // TODO: Sync with clients

	constructor({ name, goal, maxPlayers, isPublic, host }: RoomConstructorData) {
		this.uuid = generateUniqueJoinCode();
		this.name = name;
		this.goal = goal;
		this.maxPlayers = maxPlayers;
		this.isPublic = isPublic;

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

	private cancelIntermission(): void {
		if (this.intermissionTimer) {
			clearTimeout(this.intermissionTimer);
			this.intermissionTimer = null;
			this.intermissionStart = null;
			this.intermissionEnd = null;
			this.broadcastGameState();
		}
	}

	private setIntermission(duration: number, callback: () => void): void {
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
		};

		// If room doesn't have a host (automated room) and enough players, start game countdown
		if (this.players.length >= MIN_PLAYERS && !this.hostUUID) {
			this.setIntermission(TIME_TO_START * 1000, () => {
				// TODO: Start game
			});

		}

		this.broadcastGameState();
		broadcastLobbyUpdate();
		return true;
	}

	public onPlayerLeave(player: KplPlayer): void {
		console.log(`Player ${player.username} left room ${this.name}`);

		// Remove player from room
		this.players = this.players.filter(p => p !== player);
		safeAwait(player.rpc('room', null, -1));

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

		// If room is empty, destroy room
		if (this.players.length === 0) {
			destroyRoom(this);
		}
	}

	public onRoomDestroy(): void {
		console.log(`Room ${this.name} (${this.uuid}) destroyed`);
		this.players.forEach(player => player.quitRoom());
	}

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

			},
			table: {

			},

			players: this.players.map(p => ({
				uuid: p.uuid,
				username: p.username,
				points: this.playerData[p.uuid].points,
				isHost: this.hostUUID === p.uuid,
			})),
		};

		return await safeAwait(player.rpc('room', roomData, -1));
	}
}
