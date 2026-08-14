import { encodeNetworkMessage, MessageType } from "./encoder.js";
import { NONCE_EMPTY } from "./nonce.js";
import { KplPlayer } from "../game/player.js";
import { AwaitResponse } from "./req-res-manager.js";
import { safeAwait } from "../utils/safe-await.js";
import { createPlayer, destroyPlayer } from "../game/player-manager.js";
import { createAnonymousPlayer, tryReviveAnonymousPlayer } from "./anonymous-player-provider.js";
import { NetworkKit } from "./socket-connection-client.js";
import { getLobbyStateNetworkMessage } from "../game/room-manager.js";

const LOGIN_TIMEOUT = 1000;
const USERNAME_MAX_LENGTH = 24;

/*
 * Accounts are gone in this build. The old server also spoke Google and Discord
 * OAuth, which needed app registrations and secrets to work at all — every
 * login button was dead the moment the original site went down. A nickname and
 * a revive token is all this game ever needed.
 */
type AuthCredentials = {
	provider: 'anonymous';
	username: string;
	user_id: string;
	user_token: string;
};

function cleanUsername(raw: unknown): string {
	const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
	if (!name) return 'Hráč';
	return name.slice(0, USERNAME_MAX_LENGTH);
}

export function createClientIdentity(networkKit: NetworkKit, sendRequest: AwaitResponse) {
	let player: KplPlayer | null = null;

	return {
		get authComplete() {
			return player !== null;
		},

		get player() {
			return player;
		},

		async requestAuth() {
			const [data, error] = await safeAwait(sendRequest<AuthCredentials>({
				f: 'auth',
			}, LOGIN_TIMEOUT));

			if (error) {
				networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_TIMEOUT'));
				networkKit.disconnect();
				return;
			}

			const username = cleanUsername(data?.username);
			const identity = tryReviveAnonymousPlayer(data?.user_id ?? '', data?.user_token ?? '') || createAnonymousPlayer();
			const image = `https://api.dicebear.com/9.x/dylan/svg?mood=happy,hopeful,superHappy&seed=${encodeURIComponent(username)}`;

			player = createPlayer(username, identity.user_id, image, networkKit);

			if (!player) {
				networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'ALREADY_LOGGED_IN'));
				networkKit.disconnect();
				return;
			}

			safeAwait(sendRequest({
				f: 'identity',
				uuid: player.uuid,
				token: identity.token,
				username: player.username,
				anonymous: true,
			}, -1));

			networkKit.sendRaw(getLobbyStateNetworkMessage());
		},

		onIdentityDisconnect() {
			if (player) {
				destroyPlayer(player);
				player = null;
			}
		}
	};
}
