export enum MessageType {
	PLAIN = 0,
	ERROR = 99,
}

export const NONCE_EMPTY = '';

export function encodeNetworkMessage<T>(nonce: string, type: MessageType, data: T) {
	return JSON.stringify([nonce, type, data]);
}

export function decodeNetworkMessage(message: string) {
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
