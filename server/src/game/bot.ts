import { createId as cuid } from "@paralleldrive/cuid2";
import chalk from "chalk";
import { KplPlayer } from "./player.js";
import { KplRoom } from "./room.js";
import type { NetworkKit } from "../networking/socket-connection-client.js";
import { randomElement } from "../utils/random.js";
import { wait } from "../utils/wait.js";

/*
 * Solo mode.
 *
 * A bot is a completely ordinary KplPlayer holding a NetworkKit whose four
 * functions are fakes. Nothing in the room knows the difference, so MIN_PLAYERS
 * stays at 3 and the round loop needs no test-only branch — which matters,
 * because a branch you only take in testing is a branch you never really test.
 *
 * Off unless SOLO_CODE is set on the server. The code is never sent to the
 * client; the client sends what was typed and the server compares.
 */

export const SOLO_CODE = (process.env.SOLO_CODE ?? '').trim();
export const SOLO_ENABLED = SOLO_CODE.length > 0;

/** Constant-ish time compare so the code can't be guessed a character at a time. */
export function soloCodeMatches(given: unknown): boolean {
	if (!SOLO_ENABLED || typeof given !== 'string') return false;
	const a = given.trim();
	if (a.length !== SOLO_CODE.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ SOLO_CODE.charCodeAt(i);
	return diff === 0;
}

const BOT_NAMES = ['BOT Kostěj', 'BOT Meluzína', 'BOT Bubák', 'BOT Rarach', 'BOT Polednice'];

function botNetworkKit(name: string): NetworkKit {
	return {
		sendError: () => {},
		sendRaw: () => {},
		disconnect: () => {},
		rpcCall: async <T,>(fnName: string, data: any): Promise<T> => {
			// A pause, so the table fills in front of you instead of snapping
			// into place the instant the phase starts.
			await wait(600 + Math.floor(Math.random() * 1400));

			if (fnName === 'pickWhiteCards') {
				// Returning nothing hands off to the existing timeout path, which
				// already plays distinct random cards from this player's hand.
				// Reusing it means solo mode exercises real code.
				return [] as unknown as T;
			}

			if (fnName === 'pickCzarCard') {
				const groups = Array.isArray(data) ? data : [];
				const pick = randomElement(groups) as { id?: string } | undefined;
				return (pick?.id ?? null) as unknown as T;
			}

			return null as unknown as T;
		},
	};
}

export function addBotsToRoom(room: KplRoom, count: number): number {
	let added = 0;
	for (let i = 0; i < count; i++) {
		const name = BOT_NAMES[i % BOT_NAMES.length];
		const bot = new KplPlayer(name, `bot_${cuid()}`, '🤖', botNetworkKit(name));
		if (bot.joinRoom(room)) added++;
	}
	console.log(`${chalk.bold.magenta('*')} Solo mode: added ${chalk.bold(String(added))} bots to ${chalk.bold(room.name)}`);
	return added;
}
