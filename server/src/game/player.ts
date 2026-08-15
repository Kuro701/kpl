import chalk from "chalk";
import { NetworkKit } from "../networking/socket-connection-client.js";
import { safeAwait } from "../utils/safe-await.js";
import { getRoomByUUID } from "./room-manager.js";
import { KplRoom } from "./room.js";
import { GameErrors } from "../errors.js";

export class KplPlayer {
	public readonly uuid: string;
	public username: string;
	public image: string;

	private netkit: NetworkKit;

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
		console.log(`${chalk.bold.greenBright('+')} Player ${chalk.bold(username)} (${chalk.gray(uuid)}) ${chalk.greenBright('connected')}`);
		this.username = username;
		this.uuid = uuid;
		this.netkit = netkit;
		this.image = image;
	}

	onDisconnect() {
		console.log(`${chalk.bold.redBright('-')} Player ${chalk.bold(this.username)} (${chalk.gray(this.uuid)}) ${chalk.redBright('disconnected')}`);
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

	public disconnect(error?: string) {
		if (error) {
			this.netkit.sendError(error);
		}

		this.netkit.disconnect();
	}

	public sendRaw(message: string) {
		this.netkit.sendRaw(message);
	}

	public sendError(error: typeof GameErrors[keyof typeof GameErrors]) {
		this.netkit.sendError(error);
	}

	public rpc<T>(method: string, data: any, timeout?: number) {
		return this.netkit.rpcCall<T>(method, data, timeout);
	}

	/**
	 * Is this the connection the player is currently using? A socket that has
	 * been superseded must not tear the player down when it finally closes.
	 */
	public ownsConnection(netkit: NetworkKit): boolean {
		return this.netkit === netkit;
	}

	/*
	 * The same person opened the game again — another tab, a refresh, a phone.
	 * Move them onto the new connection instead of destroying them and building
	 * a stranger: they keep their seat, their points and their room. The old
	 * socket is closed, and because it no longer owns the player, its close
	 * handler leaves everything alone.
	 */
	public adoptConnection(netkit: NetworkKit, username: string, image: string) {
		const previous = this.netkit;
		this.netkit = netkit;
		this.username = username;
		this.image = image;

		console.log(`${chalk.bold.yellowBright('~')} Player ${chalk.bold(this.username)} (${chalk.gray(this.uuid)}) ${chalk.yellowBright('reconnected from another tab/device')}`);

		try {
			previous.disconnect();
		} catch {
			// already gone, nothing to do
		}
	}
}
