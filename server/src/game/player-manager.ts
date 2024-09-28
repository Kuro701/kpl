import { KplPlayer } from "./player.js";

const players: KplPlayer[] = [];

export function createPlayer(username: string, uuid: string): KplPlayer | null {
	const existingPlayer = getPlayerById(uuid);
	if (existingPlayer) {
		return null;
	}

	const player = new KplPlayer(username, uuid);
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
