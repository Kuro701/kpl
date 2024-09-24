import { KplRoom } from "./room.js";

const rooms: KplRoom[] = [];

export function destroyRoom(room: KplRoom): void {
	const index = rooms.indexOf(room);
	if (index !== -1) {
		rooms.splice(index, 1);
	}
}
