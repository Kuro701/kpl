import { createId as cuid } from "@paralleldrive/cuid2";
import { KplPlayer } from "./player.js";
import { randomBytes } from "crypto";
import { destroyRoom, generateUniqueJoinCode } from "./room-manager.js";

enum RoomState {
	LOBBY,
}

type PlayerData = {};
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
	private spectators: KplPlayer[] = []; // TODO: Sync with clients

	private state: RoomState = RoomState.LOBBY;  // TODO: Sync with clients
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
	}

	public addPlayer(player: KplPlayer): void {
		// If player already was in the room before but disconnected (reconnect)
		if (this.playerData[player.uuid]) {
			this.players.push(player);
			this.broadcastGameState();
			return;
		}

		// If player is new and game is already running, refuse to join
		if (this.state !== RoomState.LOBBY) {
			// TODO: Send game has already started error
			return;
		}

		// If room is full, refuse to join
		if (this.players.length >= this.maxPlayers) {
			// TODO: Send room is full error
			return;
		}

		// Add player to room
		this.players.push(player);
		this.playerData[player.uuid] = {};
		this.broadcastGameState();

		// If room doesn't have a host (automated room) and enough players, start game countdown
		if (this.players.length >= MIN_PLAYERS && !this.hostUUID) {
			this.intermissionEnd = new Date(Date.now() + TIME_TO_START * 1000);
			this.intermissionTimer = setTimeout(() => {
				// TODO: Start game
			}, TIME_TO_START * 1000);

			this.broadcastGameState();
		}
	}

	public removePlayer(player: KplPlayer): void {
		// Remove player from room
		this.players = this.players.filter(p => p !== player);

		// If game is not running, remove player data entirely
		if (this.state === RoomState.LOBBY) {
			delete this.playerData[player.uuid];
		}

		// If player was host, assign new host
		if (this.hostUUID === player.uuid) {
			this.hostUUID = this.players[0]?.uuid ?? null;
			this.broadcastGameState();
		}

		// If room doesn't have a host (automated room) and not enough players, stop game countdown
		if (this.players.length < MIN_PLAYERS && !this.hostUUID && this.intermissionTimer) {
			clearTimeout(this.intermissionTimer);
			this.intermissionEnd = null;
			this.broadcastGameState();
		}

		// If room is empty, destroy room
		if (this.players.length === 0) {
			destroyRoom(this);
		}
	}

	private broadcastGameState(): void {
		// TODO: Broadcast game state
	}
}
