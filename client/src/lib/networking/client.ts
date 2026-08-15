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
 * Where the game server lives. Set VITE_SERVER_URL at build time. The
 * `server-ip` cookie still wins, which is handy for pointing the deployed site
 * at a local server while debugging.
 *
 * Anything sensible is accepted, because "did you write wss:// and not https://"
 * was the single easiest way to break a deploy: a page served over https cannot
 * open an insecure socket, and the failure looks like the site simply not
 * working. All of these end up in the right place:
 *
 *   kpl-server.onrender.com          -> wss://kpl-server.onrender.com
 *   https://kpl-server.onrender.com  -> wss://kpl-server.onrender.com
 *   http://localhost:3000            -> ws://localhost:3000
 *   wss://kpl-server.onrender.com    -> unchanged
 */
function toWebSocketUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const trimmed = value.trim().replace(/\/+$/, '');
	if (!trimmed) return null;

	if (/^wss?:\/\//i.test(trimmed)) return trimmed;
	if (/^https:\/\//i.test(trimmed)) return `wss://${trimmed.slice(8)}`;
	if (/^http:\/\//i.test(trimmed)) return `ws://${trimmed.slice(7)}`;

	// A bare host. Loopback is the only case that can't be encrypted.
	const insecure = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/i.test(trimmed);
	return `${insecure ? 'ws' : 'wss'}://${trimmed}`;
}

/*
 * Fallback so a deployed build still works if VITE_SERVER_URL was never set —
 * forgetting a build variable would otherwise ship a site that loads and then
 * silently never connects. Change this if the server ever moves.
 */
const DEFAULT_SERVER_HOST = 'kpl-server.onrender.com';

const SERVER_URL = toWebSocketUrl(cookie.get('server-ip'))
	|| toWebSocketUrl(import.meta.env.VITE_SERVER_URL)
	|| (import.meta.env.MODE === 'development'
		? 'ws://localhost:3000'
		: toWebSocketUrl(DEFAULT_SERVER_HOST)!);

if (!import.meta.env.VITE_SERVER_URL && import.meta.env.MODE !== 'development') {
	console.warn(`VITE_SERVER_URL is not set — falling back to ${DEFAULT_SERVER_HOST}`);
}

/*
 * Free hosting sleeps after 15 minutes idle and takes up to a minute to wake.
 * The first player to arrive would click "create room", wait, and get a timeout
 * that looks exactly like the game being broken.
 *
 * So knock on the door as soon as the page loads. By the time somebody has read
 * the screen, picked a nickname and clicked, the server is usually already up —
 * and the wait happens while they are busy rather than while they are staring at
 * a dead button.
 */
function httpOrigin(wsUrl: string): string | null {
	if (wsUrl.startsWith('wss://')) return `https://${wsUrl.slice(6)}`;
	if (wsUrl.startsWith('ws://')) return `http://${wsUrl.slice(5)}`;
	return null;
}

if (typeof fetch === 'function') {
	const origin = httpOrigin(SERVER_URL);
	if (origin) {
		// Failure is fine and expected while the server is still booting; the
		// point is that the request lands and starts the wake-up.
		fetch(`${origin}/health`, { cache: 'no-store' }).catch(() => {});
	}
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
	  SystemMessage.set('Server se probouzí — zkus to prosím ještě jednou za chvilku.');
	  return false;
	}

	const [_identity, identityError] = await safeAwait(waitForIdentity())

	if (identityError) {
	  _connecting = false;
	  console.error('Failed to get identity:', identityError);
	  SystemMessage.set('Server se probouzí — zkus to prosím ještě jednou za chvilku.');
	  return false;
	}

	_connecting = false;
	SystemMessage.set(null);
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
