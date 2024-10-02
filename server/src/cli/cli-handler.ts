import readline from 'readline';
import { setSystemMessage } from '../system-message.js';

export async function runCLI() {
	const rl = readline.createInterface({
		input: process.stdin,
	});

	rl.on("line", (line) => {
		const trimmed = line.trim();

		if (trimmed.startsWith('motd')) {
			const message = trimmed.slice(4).trim();
			setSystemMessage(message ? message : null);
		}

	});
}



