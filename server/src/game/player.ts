import { randomBytes } from "crypto";
import cuid from "cuid";

export class KplPlayer {
	public readonly uuid: string;
	public readonly sessionId: string;
	public readonly username: string;

	constructor(username: string) {
		this.username = username;
		this.uuid = cuid();
		this.sessionId = randomBytes(48).toString('hex');
	}
}
