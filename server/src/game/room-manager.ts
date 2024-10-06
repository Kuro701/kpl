import { randomBytes } from "crypto";
import { KplRoom, RoomConstructorData } from "./room.js";
import { broadcastRawToAllPlayers } from "./player-manager.js";
import { encodeNetworkMessage, MessageType } from "../networking/encoder.js";
import { NONCE_EMPTY } from "../networking/nonce.js";

const rooms = new Map<string, KplRoom>();

export function generateUniqueJoinCode(): string {
	let joinCode: string;
	do {
		joinCode = randomBytes(4).toString('hex');
	} while (rooms.has(joinCode));
	return joinCode;
}

export function createRoom(data: RoomConstructorData) {
	const room = new KplRoom(data);
	rooms.set(room.uuid, room);
	if (room.isPublic) {
		broadcastLobbyUpdate();
	}
	return room;
}

export function getRoomByUUID(uuid: string): KplRoom | undefined {
	return rooms.get(uuid);
}

export function destroyRoom(room: KplRoom): void {
	rooms.delete(room.uuid);
	room.onRoomDestroy();

	if (room.isPublic) {
		broadcastLobbyUpdate();
	}
}

export function getRandomJoinableRoom(): KplRoom | undefined {
	return Array.from(rooms.values()).find(room => room.isPublic && room.playerCount < room.maxPlayers && room.state === 'lobby');
}

export function broadcastLobbyUpdate() {
	return broadcastRawToAllPlayers(getLobbyStateNetworkMessage());
}

export function getLobbyStateNetworkMessage() {
	const lobbyState = getLobbyState();
	return encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, {
		f: 'lobby',
		rooms: lobbyState,
		roomCount: rooms.size,
	});
}

export function getLobbyState() {
	return Array.from(rooms.values())
		.filter(room => room.isPublic)
		.map(getRoomLobbyState);
}

export function getRoomLobbyState(room: KplRoom) {
	return {
		uuid: room.uuid,
		name: room.name,
		playerCount: room.playerCount,
		maxPlayers: room.maxPlayers,
		goal: room.goal,
		isPublic: room.isPublic,
		state: room.state,
	};
}

export function getAllRooms() {
	return Array.from(rooms.values());
}
