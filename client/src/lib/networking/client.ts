import { get, writable } from "svelte/store";
import { handleNetworkMessage } from "./message-handler";
import { navigate } from "svelte-routing";
import { safeAwait } from "../../utils/safe-await";
import { getLoginCredentials } from "../auth/auth";
import { SystemMessage } from "./system-message";
import { encodeNetworkMessage, MessageType } from "./encoder";
import { NONCE_EMPTY } from "./nonce";
import cookie from 'cookiejs';
import { IngameRoom } from "./room";
export type AuthProvier = 'anonymous';

export type AuthCredentials = {
	provider: AuthProvier;
	username: string;
	user_id: string;
	user_token: string;
};

/*
 * Where the game server lives. Set VITE_SERVER_URL at build time (e.g.
 * wss://your-backend.onrender.com) so the same source can be pointed at any
 * host. The `server-ip` cookie still wins, which is handy for debugging against
 * a local server from the deployed site.
 */
const SERVER_URL = (cookie.get('server-ip') as string | undefined)
	|| import.meta.env.VITE_SERVER_URL
	|| 'ws://localhost:3000';

if (!import.meta.env.VITE_SERVER_URL && import.meta.env.MODE !== 'development') {
	console.error('VITE_SERVER_URL is not set — this build has no game server to talk to.');
}

let connection: WebSocket | null = null;
let authCredentials: AuthCredentials | null = null;

/*
 * Reconnection.
 *
 * The original client treated a closed socket as the end of the session and
 * bounced you to the home page. In practice sockets close for boring reasons —
 * a hibernated background tab, wifi dropping for two seconds, a laptop lid —
 * and on a three-player game that ended everyone's round.
 *
 * The server already supports coming back: it revives the anonymous identity
 * from the uuid+token in localStorage and rejoins you to your room with your
 * points intact. Nothing was asking it to.
 */
const RECONNECT_DELAYS_MS = [400, 1000, 2000, 4000, 8000, 12000];
const RECONNECT_MAX_ATTEMPTS = 12;

let lastUsername = '';
let closingOnPurpose = false;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
export function getAuthCredentials() {
	return { ...authCredentials };
}

type IPlayerIdentity = {
	uuid: string;
	username: string;
	anonymous: boolean;
}

export type LobbyRoom = {
	uuid: string,
	name: string,
	playerCount: number,
	maxPlayers: number,
	goal: number,
	isPublic: boolean,
	state: string,
}

export type CardDeck = {
	id: number;
	ownerUUID: string;
	name: string;
	description: string;
	public: boolean;
	default: boolean;
	whiteCardCount: number;
	blackCardCount: number;
	totalCardCount: number;
}

export const PlayerIdentity = writable<IPlayerIdentity | null>(null);
export const LobbyRooms = writable<LobbyRoom[]>([]);
export const RoomCount = writable(0);
export const PlayerCount = writable(0);

export async function sendRaw(message: string) {
	if (!connection || connection.readyState !== WebSocket.OPEN) {
		throw new Error('Not connected to server');
	}

	connection.send(message);
}

let _connecting = false;
export async function connectToServer(username: string): Promise<boolean> {
	if (_connecting) return false;

	_connecting = true;
	const [_, connectionError] = await safeAwait(connect(getLoginCredentials(username)));

	if (connectionError) {
	  _connecting = false;
	  console.error('Failed to connect:', connectionError);
	  return false;
	}

	const [_identity, identityError] = await safeAwait(waitForIdentity())

	if (identityError) {
	  _connecting = false;
	  console.error('Failed to get identity:', identityError);
	  return false;
	}

	_connecting = false;
	return true;
}

export async function disconnect() {
	closingOnPurpose = true;
	cancelReconnect();

	if (connection && (connection.readyState === WebSocket.OPEN  || connection.readyState === WebSocket.CONNECTING)) {
		connection.close();
	}

	PlayerIdentity.set(null);
}

function cancelReconnect() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	reconnectAttempt = 0;
}

function scheduleReconnect() {
	if (reconnectTimer) {
		return;
	}

	if (reconnectAttempt >= RECONNECT_MAX_ATTEMPTS) {
		SystemMessage.set('Nepodařilo se připojit zpátky k serveru.');
		navigate('/');
		return;
	}

	const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
	reconnectAttempt++;

	SystemMessage.set('Spojení vypadlo — zkouším se připojit zpátky…');

	reconnectTimer = setTimeout(async () => {
		reconnectTimer = null;

		// Remember the room before reconnecting; the socket carries no state.
		const roomUUID = get(IngameRoom)?.uuid ?? null;

		const [, connectionError] = await safeAwait(connect(getLoginCredentials(lastUsername)));
		if (connectionError) {
			scheduleReconnect();
			return;
		}

		const [, identityError] = await safeAwait(waitForIdentity(6000));
		if (identityError) {
			scheduleReconnect();
			return;
		}

		reconnectAttempt = 0;
		SystemMessage.set(null);

		// Fire-and-forget: the server answers by pushing the room state back.
		if (roomUUID) {
			safeAwait(sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, {
				f: 'joinRoom',
				roomUUID,
			})));
		}
	}, delay);
}

// A tab that was hibernated wakes up here — retry at once instead of sitting
// out the backoff the user never saw.
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState !== 'visible') {
			return;
		}

		if (!closingOnPurpose && connection && connection.readyState === WebSocket.CLOSED) {
			cancelReconnect();
			scheduleReconnect();
		}
	});
}

export async function leaveRoom() {
	safeAwait(sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, {
		f: 'leaveRoom',
	})));
}




export function waitForIdentity(timeout: number = 10000): Promise<IPlayerIdentity> {

	const identity = get(PlayerIdentity);
	if (identity) {
		return Promise.resolve(identity);
	}

	return new Promise((resolve, reject) => {
		let rejected = false;
		let timeoutId: number | null = null;

		const unsubscribe = PlayerIdentity.subscribe((identity) => {
			if (identity) {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}

				if (!rejected) {
					resolve(identity);
					unsubscribe();
				}
			}
		});

		timeoutId = setTimeout(() => {
			rejected = true;
			unsubscribe();
			reject(new Error('Timeout waiting for identity'));
		}, timeout);
	});
}

export async function connect(credentials: AuthCredentials): Promise<void> {
	const canReuseOldIdentity = authCredentials && authCredentials.provider === credentials.provider && authCredentials.user_id === credentials.user_id && authCredentials.username === credentials.username;
	const canReuseOldConnection = connection && (connection.readyState === WebSocket.OPEN || connection.readyState === WebSocket.CONNECTING);
	const oldIdentity = get(PlayerIdentity);
	const canSkipAuth = canReuseOldIdentity && canReuseOldConnection && oldIdentity;
	if (canSkipAuth) {
		PlayerIdentity.set(oldIdentity);
		return;
	}

	authCredentials = credentials;
	lastUsername = credentials.username;

	if (connection && (connection.readyState === WebSocket.OPEN  || connection.readyState === WebSocket.CONNECTING)) {
		connection.close();
	}

	PlayerIdentity.set(null);

	connection = new WebSocket(SERVER_URL);
	if (!connection) {
		throw new Error('Failed to create WebSocket connection');
	}

	// Captured so a superseded socket's events cannot act on the live one.
	const socket = connection;

	socket.addEventListener('open', () => {
		console.log('Connected to server');
	});

	socket.addEventListener('close', () => {
		// This socket was already replaced by a newer one — its death is noise.
		if (socket !== connection) {
			return;
		}

		console.log('Disconnected from server');

		if (closingOnPurpose) {
			closingOnPurpose = false;
			SystemMessage.set(null);
			navigate('/');
			return;
		}

		scheduleReconnect();
	});

	socket.addEventListener('error', (error) => {
		console.error('WebSocket error:', error);
	});

	socket.addEventListener('message', (e) => {
		try {
			const message = e.data;
			handleNetworkMessage(message);
		} catch (error) {
			console.error('Failed to handle message:', error);
		}
	});
}
