import { encodeNetworkMessage, MessageType } from "./encoder.js";
import { NONCE_EMPTY } from "./nonce.js";
import { KplPlayer } from "../game/player.js";
import { AwaitResponse } from "./req-res-manager.js";
import { safeAwait } from "../utils/safe-await.js";
import { createPlayer, destroyPlayer } from "../game/player-manager.js";
import { createAnonymousPlayer, tryReviveAnonymousPlayer } from "./anonymous-player-provider.js";
import { NetworkKit } from "./socket-connection-client.js";
import { getLobbyStateNetworkMessage } from "../game/room-manager.js";

/*
 * How long the server waits for a client to answer the auth handshake.
 *
 * This was 1000ms, which is generous on localhost and far too tight across the
 * internet — a cold free-tier instance behind a proxy can take longer than that
 * for a single round trip, and the connection was dropped as AUTH_TIMEOUT
 * before the player ever saw the game.
 */
const LOGIN_TIMEOUT = 15000;
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
	image?: string;
};

const DEFAULT_AVATAR = '🐥';

/*
 * The avatar is picked in the browser, so it arrives as whatever the client
 * chose to send. It is rendered next to every player's name, so it gets
 * sanitised rather than trusted: short, no URLs, no markup. A player who edits
 * their storage can end up with an emoji that is not in our picker — harmless —
 * but not with a link, a script, or a wall of text.
 */
function cleanAvatar(raw: unknown): string {
	if (typeof raw !== 'string') return DEFAULT_AVATAR;

	const value = raw.trim();
	if (!value || value.length > 8) return DEFAULT_AVATAR;
	if (/[<>/\\:"'`\s]/.test(value)) return DEFAULT_AVATAR;

	return value;
}

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
			const image = cleanAvatar(data?.image);

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

			// If this identity was already sitting in a room, the new connection
			// needs the room on screen straight away.
			player.room?.syncPlayer(player);
		},

		onIdentityDisconnect() {
			if (!player) {
				return;
			}

			// A superseded socket closing must not destroy a player who has since
			// moved to a newer connection.
			if (!player.ownsConnection(networkKit)) {
				player = null;
				return;
			}

			destroyPlayer(player);
			player = null;
		}
	};
}
