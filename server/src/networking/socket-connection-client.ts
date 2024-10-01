import { WebSocket } from "ws";
import { decodeNetworkMessage, encodeNetworkMessage, MessageType } from "./encoder.js";
import { createClientIdentity } from "./client-identity.js";
import { createRequestResponseManager } from "./req-res-manager.js";
import { NONCE_EMPTY } from "./nonce.js";
import { rpcFunctions } from "./rpc-functions.js";
import { safeAwait } from "../utils/safe-await.js";


export type NetworkKit = {
	sendError: (message: string) => void;
	sendRaw: (message: string) => void;
	rpcCall: (fnName: string, data: object, timeout?: number) => Promise<unknown>;
	disconnect: () => void;
};

export function initSocketConnection(wsClient: WebSocket) {
	const reqResMan = createRequestResponseManager(wsClient);
	const sendError = (message: string) => wsClient.send(encodeNetworkMessage(NONCE_EMPTY, MessageType.ERROR, message));

	const networkKit = {
		sendError,
		sendRaw: wsClient.send.bind(wsClient),
		rpcCall: reqResMan.rpcCall,
		disconnect: wsClient.close.bind(wsClient),
	}

	const identity = createClientIdentity(networkKit, reqResMan.sendRequest);

	wsClient.on('close', () => {
		console.log('Client disconnected');
		reqResMan.rejectAllPromises('DISCONNECTED');
		identity.onIdentityDisconnect();
	});

	wsClient.on('error', (error) => {
		console.error('Client error:', error);
	});

	wsClient.on('message', async (message) => {
		const data = decodeNetworkMessage(message.toString());
		if (!data) {
			sendError('INVALID_REQUEST');
			return;
		}

		reqResMan.processIncomingTrafic(data);

		if (!identity.authComplete) {
			return;
		}



		if (data.type === MessageType.RPC_CALL) {
			if (typeof data.data !== 'object' || !(data.data as any).f) {
				console.error('Invalid RPC call:', data.data);
				return;
			}

			const { f, ...rest } = data.data as any;
			const func = rpcFunctions[f];
			if (!func) {
				console.error('Unknown RPC function:', f);
				return;
			}

			const [_nothing, error] = await safeAwait(func(identity.player!, (responseData: unknown) => {
				if (data.nonce === NONCE_EMPTY) {
					return;
				}

				wsClient.send(encodeNetworkMessage(data.nonce, MessageType.RPC_RESPONSE, responseData))
			}, rest));
			if (error) {
				sendError('INTERNAL_SERVER_ERROR');
				console.error('RPC function error:', error);
			}

			return;
		}
	});

	const onOpen = () => {
		console.log(`Client connected`);
		identity.requestAuth();
	};

	if (wsClient.OPEN) {
		onOpen();
	} else {
		wsClient.on('open',  onOpen);
	}
}
