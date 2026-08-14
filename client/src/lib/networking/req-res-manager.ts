import { sendRaw } from "./client.js";
import { encodeNetworkMessage, MessageType, type NetworkMessage } from "./encoder.js";
import { createNonce, NONCE_EMPTY } from "./nonce.js";

// Sized for a real network with a possibly-sleeping free-tier server on the
// other end, not for localhost.
const DEFAULT_TIMEOUT = 10000;
const promises = new Map<string, { resolve: (value: unknown) => void, reject: (reason: any) => void }>();


export async function rpcCall<T>(fnName: string, data: object = {}) {
	return await sendRequestAwaitResponse<T>({
		f: fnName,
		...data,
	});
}

function sendRequestAwaitResponse<TRes>(data: unknown, timeout: number = DEFAULT_TIMEOUT): Promise<TRes> {
	if (timeout < 0) {
		const message = encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, data);
		sendRaw(message);
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

		sendRaw(message);
	});
	return responsePromise;
}

export function processIncomingRPCTrafic(msg: NetworkMessage<unknown>) {
	if (msg.type === MessageType.RPC_RESPONSE) {
		if (!promises.has(msg.nonce)) {
			sendRaw(encodeNetworkMessage(msg.nonce, MessageType.ERROR, 'INVALID_NONCE'));
			return;
		}

		const promise = promises.get(msg.nonce);
		promise?.resolve(msg.data);
		return;
	}
}
