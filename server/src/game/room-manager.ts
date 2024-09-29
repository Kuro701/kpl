import { randomBytes } from "crypto";
import { KplRoom, RoomConstructorData } from "./room.js";

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
	return room;
}

export function getRoomByUUID(uuid: string): KplRoom | undefined {
	return rooms.get(uuid);
}

export function destroyRoom(room: KplRoom): void {
	rooms.delete(room.uuid);
}
