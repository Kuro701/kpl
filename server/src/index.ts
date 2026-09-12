import dotenv from 'dotenv';
import { runServer } from './networking/server.js';
import { runCLI } from './cli/cli-handler.js';
import chalk from 'chalk';
dotenv.config();

/*
 * Stay up.
 *
 * Node kills the process on an unhandled rejection, and this server fires a
 * lot of work without awaiting it: broadcastGameState() from join/leave,
 * room.start() from the RPC handler, the per-player sends inside a round. A
 * single throw in any of those used to take the whole instance down — every
 * room, every game, everyone — and free hosting then needs about a minute to
 * come back, by which time every client has given up retrying and bounced its
 * player to the home screen.
 *
 * One bad round is not worth everybody else's evening. Log it loudly enough to
 * fix properly, and keep serving.
 *
 * uncaughtException is the harsher case: the process state after one is not
 * guaranteed. It is still better to keep going than to drop every live game,
 * but anything landing here is a real bug and the log is the place to find it.
 */
process.on('unhandledRejection', (reason) => {
	console.error(`${chalk.bold.red('[unhandled rejection]')}`, reason);
});

process.on('uncaughtException', (error) => {
	console.error(`${chalk.bold.red('[uncaught exception]')}`, error);
});

let port = parseInt(process.env.SERVER_PORT || '') || parseInt(process.env.PORT || '') || 3000;


runServer(port);
runCLI();
