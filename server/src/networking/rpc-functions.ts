import { getAvailableDecks, getDefaultDeckIds } from "../database.js";
import { KplPlayer } from "../game/player.js";
import { createRoom, getRoomByUUID, getRoomLobbyState, normalizeJoinCode } from "../game/room-manager.js";
import { RoomState } from "../game/room.js";

type ReplyFunction = (data: unknown) => void;
type RequestFunction = (player: KplPlayer, reply: ReplyFunction, data: unknown) => Promise<void>;

const OK = true;

const ROOM_LIMITS = {
	nameMaxLength: 40,
	goal: { min: 3, max: 20, fallback: 8 },
	maxPlayers: { min: 3, max: 12, fallback: 8 },
};

function clampInt(value: unknown, { min, max, fallback }: { min: number; max: number; fallback: number }): number {
	const n = Math.floor(Number(value));
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

function cleanRoomName(value: unknown): string {
	const name = typeof value === 'string' ? value.trim() : '';
	if (!name) return 'Místnost';
	return name.slice(0, ROOM_LIMITS.nameMaxLength);
}

function cleanDeckIds(value: unknown): number[] {
	if (!Array.isArray(value)) return getDefaultDeckIds();

	const ids = value
		.map(id => Math.floor(Number(id)))
		.filter(id => Number.isFinite(id));

	return ids.length > 0 ? ids : getDefaultDeckIds();
}

export const rpcFunctions: Record<string, RequestFunction> = {
	createRoom: async (player: KplPlayer, reply: ReplyFunction, data) => {
		if (player.room) {
			reply(false);
			return;
		}

		const input = (data ?? {}) as Record<string, unknown>;

		const room = createRoom({
			name: cleanRoomName(input.name),
			goal: clampInt(input.goal, ROOM_LIMITS.goal),
			maxPlayers: clampInt(input.maxPlayers, ROOM_LIMITS.maxPlayers),
			// Every room is private: this build has no public lobby, you get in
			// with the code or you don't get in.
			isPublic: false,
			decks: cleanDeckIds(input.decks),
			host: player,
		});

		player.joinRoom(room);
		reply(room.uuid);
	},

	joinRoom: async (player: KplPlayer, reply: ReplyFunction, data) => {
		if (player.room) {
			reply(false);
			return;
		}

		const roomId = normalizeJoinCode((data as any)?.roomUUID);
		if (!roomId) {
			reply(false);
			return;
		}

		const room = getRoomByUUID(roomId);
		if (!room) {
			reply(false);
			return;
		}

		const joined = player.joinRoom(room);
		reply(joined ? room.uuid : false);
	},

	leaveRoom: async (player: KplPlayer, reply: ReplyFunction) => {
		reply(OK);
		if (player.room) {
			player.quitRoom();
		}
	},

	startGame: async (player: KplPlayer, reply: ReplyFunction) => {
		if (!player.room) {
			reply(false);
			return;
		}

		if (player.room.hostId !== player.uuid) {
			reply(false);
			return;
		}

		if (player.room.state !== RoomState.LOBBY) {
			reply(false);
			return;
		}

		reply(OK);
		player.room.start();
	},

	// Room info for the join-by-code screen. Works for private rooms on purpose —
	// knowing the code is what grants you the preview.
	getRoomInfo: async (player: KplPlayer, reply: ReplyFunction, data) => {
		const roomId = normalizeJoinCode((data as any)?.roomUUID);

		if (!roomId) {
			reply(false);
			return;
		}

		const room = getRoomByUUID(roomId);
		if (!room) {
			reply(false);
			return;
		}

		reply(getRoomLobbyState(room));
	},

	getAvailableCardDecks: async (player: KplPlayer, reply: ReplyFunction) => {
		reply(getAvailableDecks(player.uuid));
	},
};
