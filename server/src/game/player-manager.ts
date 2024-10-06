import { NetworkKit } from "../networking/socket-connection-client.js";
import { safeAwait } from "../utils/safe-await.js";
import { KplPlayer } from "./player.js";

const players: KplPlayer[] = [];

export function createPlayer(username: string, uuid: string, image: string, networkKit: NetworkKit): KplPlayer | null {
	const existingPlayer = getPlayerById(uuid);
	if (existingPlayer) {
		existingPlayer.disconnect('ANOTHER_DEVICE_LOGGED_IN');
	}

	const player = new KplPlayer(username, uuid, image, networkKit);
	players.push(player);
	return player;
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
}

export async function broadcastRawToAllPlayers(message: string): Promise<void> {
	await Promise.all(players.map(async (player) => {
		await player.sendRaw(message);
	}));
}
