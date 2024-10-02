import { NetworkKit } from "../networking/socket-connection-client.js";
import { safeAwait } from "../utils/safe-await.js";
import { getRoomByUUID } from "./room-manager.js";
import { KplRoom } from "./room.js";

export class KplPlayer {
	public readonly uuid: string;
	public readonly username: string;
	public readonly image: string;

	private readonly netkit: NetworkKit;

	private roomUUID: string | null = null;
	get room() {
		if (!this.roomUUID) {
			return null;
		}

		const _room = getRoomByUUID(this.roomUUID);
		if (!_room) {
			this.roomUUID = null;
		}
		return _room;
	}

	constructor(username: string, uuid: string, image: string, netkit: NetworkKit) {
		console.log(`Player ${username} (${uuid}) logged in`);
		this.username = username;
		this.uuid = uuid;
		this.netkit = netkit;
		this.image = image;
	}

	onDisconnect() {
		console.log(`Player ${this.username} (${this.uuid}) logged out`);
		this.quitRoom();
	}

	public quitRoom() {
		if (this.roomUUID) {
			const room = getRoomByUUID(this.roomUUID);
			if (room) {
				room.onPlayerLeave(this);
			}
			this.roomUUID = null;
			safeAwait(this.netkit.rpcCall('room', null, -1));
		}
	}

	public joinRoom(room: KplRoom) {
		this.quitRoom();
		const joined = room.onPlayerJoin(this);
		if (joined) {
			this.roomUUID = room.uuid;
		}
		return joined;
	}

	public disconnect() {
		this.netkit.disconnect();
	}

	public sendRaw(message: string) {
		this.netkit.sendRaw(message);
	}

	public rpc<T>(method: string, data: any, timeout?: number) {
		return this.netkit.rpcCall<T>(method, data, timeout);
	}
}
