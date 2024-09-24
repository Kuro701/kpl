/* WebSocket server */
import { WebSocketServer } from 'ws';
import { initSocketConnection } from './socket-connection-client.js';

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

	console.log(`Server started on port ${port}`);
}




