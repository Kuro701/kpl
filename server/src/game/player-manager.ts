import { KplPlayer } from "./player.js";

const players: KplPlayer[] = [];

function createPlayer(username: string): KplPlayer {
	const player = new KplPlayer(username);
	players.push(player);
	return player;
}

function getPlayerById(uuid: string): KplPlayer | undefined {
	return players.find(player => player.uuid === uuid);
}

function getPlayerBySessionId(sessionId: string): KplPlayer | undefined {
	return players.find(player => player.sessionId === sessionId);
}

function destroyPlayer(player: KplPlayer): void {
	const index = players.indexOf(player);
	if (index !== -1) {
		players.splice(index, 1);
	}
}
