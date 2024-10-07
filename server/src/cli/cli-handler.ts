import readline from 'readline';
import { setSystemMessage } from '../system-message.js';
import { destroyRoom, getAllRooms, getRoomByUUID } from '../game/room-manager.js';
import { getPlayerById } from '../game/player-manager.js';

const commands = {
	motd: (message: string) => {
		setSystemMessage(message ? message : null);
	},
	room: {
		remove: (roomId: string) => {
			const room = getRoomByUUID(roomId);
			if (!room) {
				console.log(`Room ${roomId} not found.`);
				return;
			}

			destroyRoom(room);
		},
		list: () => {
			const rooms = getAllRooms();
			console.log(`\nRooms (${rooms.length}):\n${rooms.map(room => `  ${room.uuid} - ${room.name} (${room.playerCount}/${room.maxPlayers})`).join('\n')}\n`);

		},
	},
	player: {
		kick: (playerId: string) => {
			const player = getPlayerById(playerId);
			if (!player) {
				console.log(`Player ${playerId} not found.`);
				return;
			}

			console.log(`Kicking player ${player.username} (${playerId})...`);
			player.disconnect();
		},
	}
};

export async function runCLI() {
	const rl = readline.createInterface({
		input: process.stdin,
	});

	rl.on("line", (line) => {
		const trimmed = line.trim();
		const parts = trimmed.split(' ');

		let cmdPointer = commands;
		while (true) {
			const part = parts.shift();

			// @ts-ignore
			if (!part || !cmdPointer[part]) {
				console.log(`Command not found`);
				break;
			}

			// @ts-ignore
			cmdPointer = cmdPointer[part];

			if (typeof cmdPointer === 'function') {
				// @ts-ignore
				cmdPointer(parts.join(' '));
				break;
			}
		}

	});
}



