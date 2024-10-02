import { broadcastRawToAllPlayers } from "./game/player-manager.js";
import { encodeNetworkMessage, MessageType } from "./networking/encoder.js";
import { NONCE_EMPTY } from "./networking/nonce.js";

let systemMessage: string | null = null;

export function setSystemMessage(message: string | null) {
	systemMessage = message;
	broadcastRawToAllPlayers(encodeNetworkMessage(NONCE_EMPTY, MessageType.SYSTEM_MESSAGE, message));
}

export function getSystemMessage() {
	return systemMessage;
}
