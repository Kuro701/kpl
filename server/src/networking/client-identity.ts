import { WebSocket } from "ws";
import { encodeNetworkMessage, MessageType, NetworkMessage } from "./encoder.js";
import { NONCE_EMPTY } from "./nonce.js";
import { KplPlayer } from "../game/player.js";
import { AwaitResponse } from "./req-res-manager.js";
import { safeAwait } from "../utils/safe-await.js";
import { createPlayer, destroyPlayer } from "../game/player-manager.js";
import { createAnonymousPlayer, tryReviveAnonymousPlayer } from "./anonymous-player-provider.js";

const LOGIN_TIMEOUT = 1000;

type AuthProvier = 'anonymous' | 'discord';
type AuthCredentials = {
	provider: AuthProvier;
	username: string;
	user_id: string;
	user_token: string;
};

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
			const [ data, error] = await safeAwait(sendRequest<AuthCredentials>({
				f: 'auth',
			}, LOGIN_TIMEOUT));

			if (error) {
				ws.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_TIMEOUT'));
				ws.close();
				return;
			}

			if (data.provider === 'anonymous') {
				const playerIndentity = tryReviveAnonymousPlayer(data.user_id, data.user_token) || createAnonymousPlayer();
				console.log(playerIndentity);
				player = createPlayer(data.username, playerIndentity.user_id);

				if (!player) {
					ws.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'ALREADY_LOGGED_IN'));
					ws.close();
					return;
				}

				safeAwait(sendRequest({
					f: 'identity',
					uuid: player.uuid,
					token: playerIndentity.token,
					username: player.username,
					anonymous: true,
				}));
				return;
			}

			if (!player) {
				ws.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_FAILED'));
				ws.close();
				return;
			}

			console.log('Auth complete', data);
		},

		onIdentityDisconnect() {
			if (player) {
				destroyPlayer(player);
				player = null;
			}
		}
	}
}
