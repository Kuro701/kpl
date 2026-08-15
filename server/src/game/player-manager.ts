import { encodeNetworkMessage, MessageType } from "../networking/encoder.js";
import { NONCE_EMPTY } from "../networking/nonce.js";
import { NetworkKit } from "../networking/socket-connection-client.js";
import { safeAwait } from "../utils/safe-await.js";
import { KplPlayer } from "./player.js";

const players: KplPlayer[] = [];

export function createPlayer(username: string, uuid: string, image: string, networkKit: NetworkKit): KplPlayer | null {
	// Same identity already connected? Hand that player to the new socket rather
	// than kicking them out — otherwise opening a second tab evicts you from
	// your own room, and if you were alone in it the room is destroyed.
	const existingPlayer = getPlayerById(uuid);
	if (existingPlayer) {
		existingPlayer.adoptConnection(networkKit, username, image);
		return existingPlayer;
	}

	const player = new KplPlayer(username, uuid, image, networkKit);
	players.push(player);
	broadcastPlayerCount();
	return player;
}

export function getPlayerCount(): number {
	return players.length;
}

export function getPlayerById(uuid: string): KplPlayer | undefined {
	return players.find(player => player.uuid === uuid);
}

export function destroyPlayer(player: KplPlayer): void {
	player.onDisconnect();
	const index = players.indexOf(player);
	if (index !== -1) {
		players.splice(index, 1);
	}
	broadcastPlayerCount();
}

export async function broadcastRawToAllPlayers(message: string): Promise<void> {
	await Promise.all(players.map(async (player) => {
		await player.sendRaw(message);
	}));
}

export async function broadcastPlayerCount(): Promise<void> {
	await broadcastRawToAllPlayers(encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, {
		f: 'playerCount',
		count: players.length,
	}));
}
