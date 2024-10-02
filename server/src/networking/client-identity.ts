import { WebSocket } from "ws";
import { encodeNetworkMessage, MessageType, NetworkMessage } from "./encoder.js";
import { NONCE_EMPTY } from "./nonce.js";
import { KplPlayer } from "../game/player.js";
import { AwaitResponse } from "./req-res-manager.js";
import { safeAwait } from "../utils/safe-await.js";
import { createPlayer, destroyPlayer } from "../game/player-manager.js";
import { createAnonymousPlayer, tryReviveAnonymousPlayer } from "./anonymous-player-provider.js";
import { NetworkKit } from "./socket-connection-client.js";
import { getLobbyStateNetworkMessage } from "../game/room-manager.js";
import { getDiscordUserInfo } from "../auth/discord.js";

const LOGIN_TIMEOUT = 1000;

type AuthProvier = 'anonymous' | 'discord';
type AuthCredentials = {
	provider: AuthProvier;
	username: string;
	user_id: string;
	user_token: string;
};

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
			const [ data, error] = await safeAwait(sendRequest<AuthCredentials>({
				f: 'auth',
			}, LOGIN_TIMEOUT));

			if (error) {
				networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_TIMEOUT'));
				networkKit.disconnect();
				return;
			}

			if (data.provider === 'anonymous') {
				const playerIndentity = tryReviveAnonymousPlayer(data.user_id, data.user_token) || createAnonymousPlayer();
				console.log(playerIndentity);
				const image = `https://api.dicebear.com/9.x/dylan/svg?mood=happy,hopeful,superHappy&seed=${data.username}`;
				player = createPlayer(data.username, playerIndentity.user_id, image, networkKit);

				if (!player) {
					networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'ALREADY_LOGGED_IN'));
					networkKit.disconnect();
					return;
				}

				safeAwait(sendRequest({
					f: 'identity',
					uuid: player.uuid,
					token: playerIndentity.token,
					username: player.username,
					anonymous: true,
				}, -1));

				networkKit.sendRaw(getLobbyStateNetworkMessage());

				return;
			} else if (data.provider === 'discord') {
				const [discordUser, error] = await safeAwait(getDiscordUserInfo(data.user_token));
				if (error) {
					networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_FAILED'));
					networkKit.disconnect();
					return;
				}

				const name = discordUser.global_name || discordUser.username || data.username;
				const playerUUID = `discord_${discordUser.id}`;
				const image = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`;
				player = createPlayer(name, playerUUID, image, networkKit);

				if (!player) {
					networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'ALREADY_LOGGED_IN'));
					networkKit.disconnect();
					return;
				}

				safeAwait(sendRequest({
					f: 'identity',
					uuid: player.uuid,
					token: data.user_token,
					username: player.username,
					anonymous: false,
				}, -1));

				networkKit.sendRaw(getLobbyStateNetworkMessage());

				return;

			}

			if (!player) {
				networkKit.sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'AUTH_FAILED'));
				networkKit.disconnect();
				return;
			}
		},

		onIdentityDisconnect() {
			if (player) {
				destroyPlayer(player);
				player = null;
			}
		}
	}
}
