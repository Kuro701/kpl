/* WebSocket server */
import { WebSocketServer } from 'ws';
import { initSocketConnection } from './socket-connection-client.js';
import chalk from 'chalk';

export function runServer(port: number) {
	const server = new WebSocketServer({
		port,
	});

	server.on('close', () => {

	});

	server.on('connection', initSocketConnection);

	server.on('error', (error) => {

	});

	server.on('listening', () => {

	});

	console.log(`Server started on port ${chalk.bold.greenBright( port)}`);
}




