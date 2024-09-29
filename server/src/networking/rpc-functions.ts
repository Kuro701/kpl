import { KplPlayer } from "../game/player.js";
import { createRoom, getRandomJoinableRoom, getRoomByUUID } from "../game/room-manager.js";
import { RoomConstructorData } from "../game/room.js";

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
			const newRoom = createRoom({
				goal: 10,
				isPublic: true,
				maxPlayers: 10,
				name: 'Veřejná místnost',
				host: undefined,
			});
			reply(newRoom.uuid);
			player.joinRoom(newRoom);
		}
	}
}
