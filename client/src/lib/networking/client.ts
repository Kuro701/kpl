import { writable } from "svelte/store";
import { handleNetworkMessage } from "./message-handler";
import { navigate } from "svelte-routing";
import { safeAwait } from "../../utils/safe-await";
import { getLoginCredentials } from "../auth/auth";
import { SystemMessage } from "./system-message";
import { encodeNetworkMessage, MessageType } from "./encoder";
import { NONCE_EMPTY } from "./nonce";
export type AuthProvier = 'anonymous' | 'discord';

export type AuthCredentials = {
	provider: AuthProvier;
	username: string;
	user_id: string;
	user_token: string;
};

const SERVER_URL = 'ws://localhost:8080'; // TODO: Load from env or let user specify

let connection: WebSocket | null = null;
let authCredentials: AuthCredentials | null = null;
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
	if (connection && (connection.readyState === WebSocket.OPEN  || connection.readyState === WebSocket.CONNECTING)) {
		connection.close();
	}

	PlayerIdentity.set(null);
}

export async function leaveRoom() {
	safeAwait(sendRaw(encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, {
		f: 'leaveRoom',
	})));
}


export function waitForIdentity(timeout: number = 2000): Promise<IPlayerIdentity> {
	return new Promise((resolve, reject) => {
		let rejected = false;
		let timeoutId: number | null = null;

		const unsubscribe = PlayerIdentity.subscribe((identity) => {
			if (identity) {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}

				if (!rejected) {
					unsubscribe();
					resolve(identity);
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
	authCredentials = credentials;

	if (connection && (connection.readyState === WebSocket.OPEN  || connection.readyState === WebSocket.CONNECTING)) {
		connection.close();
	}

	PlayerIdentity.set(null);

	connection = new WebSocket(SERVER_URL);
	if (!connection) {
		throw new Error('Failed to create WebSocket connection');
	}

	connection.addEventListener('open', () => {
		console.log('Connected to server');
	});

	connection.addEventListener('close', () => {
		console.log('Disconnected from server');
		SystemMessage.set(null);
		navigate('/');
	});

	connection.addEventListener('error', (error) => {
		console.error('WebSocket error:', error);
	});

	connection.addEventListener('message', (e) => {
		try {
			const message = e.data;
			console.log('Received message:', message);
			handleNetworkMessage(message);
		} catch (error) {
			console.error('Failed to handle message:', error);
		}
	});
}
