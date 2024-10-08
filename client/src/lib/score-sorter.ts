import type { PlayerResults } from "./networking/room";

export const scoreSorter = (identityUUID: string) => (a: PlayerResults, b: PlayerResults) => {
	// If score is different, sort by score
	if (a.points !== b.points) {
		return b.points - a.points;
	}

	// If score is the same, prefer me :)
	if (a.uuid === identityUUID) {
		return -1;
	}
	if (b.uuid === identityUUID) {
		return 1;
	}

	// If score is the same and neither is me, sort by username
	return a.username.localeCompare(b.username);
}
