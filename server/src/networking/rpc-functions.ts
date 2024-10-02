import { db, queryCardDeckCounts } from "../database.js";
import { KplPlayer } from "../game/player.js";
import { createRoom, getRandomJoinableRoom, getRoomByUUID, getRoomLobbyState } from "../game/room-manager.js";
import { RoomConstructorData } from "../game/room.js";
import { safeAwait } from "../utils/safe-await.js";

type ReplyFunction = (data: unknown) => void;
type RequestFunction = (player: KplPlayer, reply: ReplyFunction, data: unknown) => Promise<void>;

const OK = true;

export const rpcFunctions: Record<string, RequestFunction> = {
	createRoom: async (player: KplPlayer, reply: ReplyFunction, data) => {
		if (player.room) {
			reply(false);
			return;
		}

		// TODO: Validate data

		const room = createRoom({
			...data as RoomConstructorData,
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

		const roomId = (data as any).roomUUID;
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
	joinRandomRoom: async (player: KplPlayer, reply: ReplyFunction) => {
		if (player.room) {
			reply(false);
			return;
		}

		const room = getRandomJoinableRoom();
		if (room) {
			reply(room.uuid);
			player.joinRoom(room);
		} else {
			const defaultDecks = await db.cardDeck.findMany({
				where: { default: true },
				select: { id: true },
			});

			const newRoom = createRoom({
				goal: 10,
				isPublic: true,
				maxPlayers: 10,
				name: 'Veřejná místnost',
				host: undefined,
				decks: defaultDecks.map(deck => deck.id),
			});
			reply(newRoom.uuid);
			player.joinRoom(newRoom);
		}
	},

	// Returns lobby room info including private rooms
	getRoomInfo: async (player: KplPlayer, reply: ReplyFunction, data) => {
		const roomId = (data as any).roomUUID;

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
		const [decks, error] = await safeAwait(db.cardDeck.findMany({
			where: {
				OR: [
					{ public: true },
					{ ownerUUID: player.uuid },
				],
			},
		}));

		if (error) {
			reply([]);
			return
		}

		const [result, queryError] = await safeAwait(Promise.all(decks.map(queryCardDeckCounts)));

		if (queryError) {
			reply([]);
			return;
		}

		reply(result);
	}
}
