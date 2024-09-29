import { getRoomByUUID } from "./room-manager.js";

export class KplPlayer {
	public readonly uuid: string;
	public readonly username: string;

	private roomUUID: string | null = null;

	constructor(username: string, uuid: string) {
		console.log(`Player ${username} connected`);
		this.username = username;
		this.uuid = uuid;
	}

	onDisconnect() {
		console.log(`Player ${this.username} disconnected`);
		this.quitRoom();
	}

	private quitRoom() {
		if (this.roomUUID) {
			const room = getRoomByUUID(this.roomUUID);
			if (room) {
				room.removePlayer(this);
			}
			this.roomUUID = null;
		}
	}
}
