import { WebSocket } from "ws";
import { encodeNetworkMessage, MessageType, NetworkMessage } from "./encoder.js";
import { NONCE_EMPTY } from "./nonce.js";
import { KplPlayer } from "../game/player.js";
import { AwaitResponse } from "./req-res-manager.js";
import { safeAwait } from "../utils/safe-await.js";

const LOGIN_TIMEOUT = 1000;

export function createClientIdentity(ws: WebSocket, sendRequest: AwaitResponse) {
	let player: KplPlayer | null = null;

	return {
		get authComplete() {
			return player !== null;
		},

		get player() {
			return player;
		},

		async requestAuth() {
			const [ data, error] = await safeAwait(sendRequest<string>({
				f: 'auth',
			}, LOGIN_TIMEOUT));

			if (error) {
				ws.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_TIMEOUT'));
				ws.close();
				return;
			}

			console.log('Auth complete', data);
		}
	}
}
