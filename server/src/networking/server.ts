/* HTTP + WebSocket server */
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { initSocketConnection } from './socket-connection-client.js';
import { getAllRooms } from '../game/room-manager.js';
import { getPlayerCount } from '../game/player-manager.js';
import chalk from 'chalk';

/*
 * The original build opened a bare WebSocketServer on a port. Hosting platforms
 * want plain HTTP on $PORT — for port detection, for health checks, and so a
 * human opening the backend URL in a browser gets something other than a hang.
 * So: one HTTP server, with the WebSocket server attached to it.
 */

// Proxies in front of the app close connections that look idle. A game sitting
// in the lobby can be quiet for minutes, so we ping and drop anything that
// stops answering.
const HEARTBEAT_INTERVAL = 30_000;

type AliveSocket = WebSocket & { isAlive?: boolean };

export function runServer(port: number) {
	const httpServer = http.createServer((req, res) => {
		if (req.url === '/health' || req.url === '/') {
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'no-store',
			});
			res.end(JSON.stringify({
				status: 'ok',
				service: 'kpl-server',
				rooms: getAllRooms().length,
				players: getPlayerCount(),
				uptimeSeconds: Math.floor(process.uptime()),
			}));
			return;
		}

		res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end('Not found');
	});

	const wss = new WebSocketServer({ server: httpServer });

	wss.on('connection', (socket: AliveSocket) => {
		socket.isAlive = true;
		socket.on('pong', () => { socket.isAlive = true; });
		initSocketConnection(socket);
	});

	wss.on('error', (error) => {
		console.error(`${chalk.bold.red('[server]')} websocket error:`, error);
	});

	const heartbeat = setInterval(() => {
		wss.clients.forEach((client) => {
			const socket = client as AliveSocket;
			if (socket.isAlive === false) {
				socket.terminate();
				return;
			}
			socket.isAlive = false;
			socket.ping();
		});
	}, HEARTBEAT_INTERVAL);

	wss.on('close', () => clearInterval(heartbeat));

	httpServer.listen(port, () => {
		console.log(`${chalk.bold.greenBright('[server]')} poslouchám na portu ${chalk.bold.greenBright(port)}`);
	});

	httpServer.on('error', (error) => {
		console.error(`${chalk.bold.red('[server]')} http error:`, error);
	});
}
