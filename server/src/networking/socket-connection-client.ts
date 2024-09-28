import { WebSocket } from "ws";
import { decodeNetworkMessage, encodeNetworkMessage, MessageType } from "./encoder.js";
import { createClientIdentity } from "./client-identity.js";
import { createRequestResponseManager } from "./req-res-manager.js";
import { NONCE_EMPTY } from "./nonce.js";



export function initSocketConnection(wsClient: WebSocket) {
	const reqResMan = createRequestResponseManager(wsClient);
	const identity = createClientIdentity(wsClient, reqResMan.sendRequest);

	const sendError = (message: string) => wsClient.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, message));

	wsClient.on('close', () => {
		console.log('Client disconnected');
		identity.onIdentityDisconnect();
	});

	wsClient.on('error', (error) => {
		console.error('Client error:', error);
	});

	wsClient.on('message', (message) => {
		const data = decodeNetworkMessage(message.toString());
		if (!data) {
			sendError('INVALID_REQUEST');
			return;
		}

		reqResMan.processIncomingTrafic(data);

		if (!identity.authComplete) {
			return;
		}
	});

	const onOpen = () => {
		console.log('Client connected');
		identity.requestAuth();
	};

	if (wsClient.OPEN) {
		onOpen();
	} else {
		wsClient.on('open',  onOpen);
	}
}
