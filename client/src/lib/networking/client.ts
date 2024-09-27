import { handleNetworkMessage } from "./message-handler";

type AuthProvier = 'anonymous' | 'discord';

type AuthCredentials = {
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

export async function sendRaw(message: string) {
	if (!connection || connection.readyState !== WebSocket.OPEN) {
		throw new Error('Not connected to server');
	}

	connection.send(message);
}

export async function connect(credentials: AuthCredentials) {
	authCredentials = credentials;

	if (connection && (connection.readyState === WebSocket.OPEN  || connection.readyState === WebSocket.CONNECTING)) {
		connection.close();
	}

	connection = new WebSocket(SERVER_URL);
	if (!connection) {
		throw new Error('Failed to create WebSocket connection');
	}

	connection.addEventListener('open', () => {
		console.log('Connected to server');
	});

	connection.addEventListener('close', () => {
		console.log('Disconnected from server');
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
