export class KplPlayer {
	public readonly uuid: string;
	public readonly username: string;

	constructor(username: string, uuid: string) {
		console.log(`Player ${username} connected`);
		this.username = username;
		this.uuid = uuid;
	}

	onDisconnect() {
		console.log(`Player ${this.username} disconnected`);
		// TODO: Disconnect from room
	}
}
