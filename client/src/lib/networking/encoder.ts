export enum MessageType {
	PLAIN = 0,
	RPC_CALL = 1,
	RPC_RESPONSE = 2,
	ERROR = 99,
}

export type NetworkMessage<T> = {
	nonce: string;
	type: MessageType;
	data: T;
}

export function encodeNetworkMessage<T>(nonce: string, type: MessageType, data: T) {
	return JSON.stringify([nonce, type, data]);
}

export function decodeNetworkMessage<T>(message: string): NetworkMessage<T> | null {
	try {
		const [nonce, type, data] = JSON.parse(message);
		return {
			nonce,
			type,
			data,
		}
	} catch (error) {
		return null;
	}
}
