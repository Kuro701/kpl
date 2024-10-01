import { WebSocket } from "ws";
import { encodeNetworkMessage, MessageType, NetworkMessage } from "./encoder.js";
import { createNonce, NONCE_EMPTY } from "./nonce.js";

const DEFAULT_TIMEOUT = 2000;
const NO_WAIT = -1;
const promises = new Map<string, { resolve: (value: unknown) => void, reject: (reason: any) => void }>();

export function createRequestResponseManager(wsClient: WebSocket) {

	const sendRequest = <TRes>(data: unknown, timeout: number = DEFAULT_TIMEOUT): Promise<TRes> => {
		if (timeout < 0) {
			const message = encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, data);
			wsClient.send(message);
			return Promise.resolve() as Promise<TRes>;
		}

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
	}

	return {
		sendRequest,
		rpcCall(fnName: string, data: object = {}, timeout?: number) {
			return sendRequest({
				f: fnName,
				...data,
			}, timeout);
		},

		processIncomingTrafic(msg: NetworkMessage<unknown>) {
			if (msg.type === MessageType.RPC_RESPONSE) {
				if (!promises.has(msg.nonce)) {
					wsClient.send(encodeNetworkMessage(msg.nonce, MessageType.ERROR, 'INVALID_NONCE'));
					return;
				}

				const promise = promises.get(msg.nonce);
				promises.delete(msg.nonce);
				promise?.resolve(msg.data);
				return;
			}
		},

		rejectAllPromises(reason: string) {
			for (const promise of promises.values()) {
				promise.reject(reason);
			}
			promises.clear();
		}
	}
}

export type AwaitResponse = ReturnType<typeof createRequestResponseManager>['sendRequest'];
