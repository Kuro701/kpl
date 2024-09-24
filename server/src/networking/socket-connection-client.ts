import { WebSocket } from "ws";
import { decodeNetworkMessage, encodeNetworkMessage, MessageType, NONCE_EMPTY } from "./encoder.js";



export function initSocketConnection(wsClient: WebSocket) {
	wsClient.on('close', () => {

	});

	wsClient.on('error', (error) => {

	});



	wsClient.on('message', (message) => {
		const data = decodeNetworkMessage(message.toString());
		if (!data) {
			wsClient.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, 'INVALID_REQUEST'));
			return;
		}
	});

	wsClient.on('open', () => {

	});
}
