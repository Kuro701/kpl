import { sendRaw } from "./client";
import { decodeNetworkMessage, encodeNetworkMessage, MessageType } from "./encoder";
import { NONCE_EMPTY } from "./nonce";
import { processIncomingRPCTrafic } from "./req-res-manager";
import { rpcFunctions } from "./rpc-functions";
import { SystemMessage } from "./system-message";

export async function handleNetworkMessage(message: string) {
	const decoded = decodeNetworkMessage(message);
	if (!decoded) {
		console.error('Failed to decode message:', message);
		return;
	}

	if (decoded.type === MessageType.ERROR) {
		console.error('Server error message:', decoded.data);
		return;
	}

	if (decoded.type === MessageType.RPC_CALL) {
		if (typeof decoded.data !== 'object' || !(decoded.data as any).f) {
			console.error('Invalid RPC call:', decoded.data);
			return;
		}

		const { f, ...rest } = decoded.data as any;
		const func = rpcFunctions[f];
		if (!func) {
			console.error('Unknown RPC function:', f);
			return;
		}

		await func((data: unknown) => {
			if (decoded.nonce === NONCE_EMPTY) {
				return;
			}
			sendRaw(encodeNetworkMessage(decoded.nonce, MessageType.RPC_RESPONSE, data))
		}, rest);

		return;
	}

	if (decoded.type === MessageType.RPC_RESPONSE) {
		processIncomingRPCTrafic(decoded);
		return;
	}

	if (decoded.type === MessageType.SYSTEM_MESSAGE) {
		SystemMessage.set(decoded.data as string | null);
		return;
	}
}
