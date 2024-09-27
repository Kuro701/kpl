import { WebSocket } from "ws";
import { encodeNetworkMessage, MessageType, NetworkMessage } from "./encoder.js";
import { createNonce } from "./nonce.js";

const promises = new Map<string, { resolve: (value: unknown) => void, reject: (reason: any) => void }>();

export function createRequestResponseManager(wsClient: WebSocket) {
	return {
		sendRequest<TRes>(data: unknown, timeout: number): Promise<TRes> {
			const nonce = createNonce();
			const message = encodeNetworkMessage(nonce, MessageType.RPC_CALL, data);
			const responsePromise = new Promise<TRes>(async (resolve, reject) => {
				promises.set(nonce, {
					resolve: (value: unknown) => {
						resolve(value as TRes),
						promises.delete(nonce);
					},
					reject: (reason: any) => {
						reject(reason),
						promises.delete(nonce);
					}
				});

				setTimeout(() => {
					if (promises.has(nonce)) {
						promises.delete(nonce);
						reject('TIMEOUT');
					}
				}, timeout);

				wsClient.send(message);
			});
			return responsePromise;
		},

		processIncomingTrafic(msg: NetworkMessage<unknown>) {
			if (msg.type === MessageType.RPC_RESPONSE) {
				if (!promises.has(msg.nonce)) {
					wsClient.send(encodeNetworkMessage(msg.nonce, MessageType.ERROR, 'INVALID_NONCE'));
					return;
				}

				const promise = promises.get(msg.nonce);
				promise?.resolve(msg.data);
				return;
			}
		}
	}
}

export type AwaitResponse = ReturnType<typeof createRequestResponseManager>['sendRequest'];
