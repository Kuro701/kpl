import { KplRoom, RoomConstructorData } from "./room.js";
import { broadcastRawToAllPlayers } from "./player-manager.js";
import { encodeNetworkMessage, MessageType } from "../networking/encoder.js";
import { NONCE_EMPTY } from "../networking/nonce.js";
import { randomInt } from "crypto";

const rooms = new Map<string, KplRoom>();

/*
 * Join codes are what a player types or shares, so they are built to survive
 * being read aloud, written on a napkin and typed back in.
 *
 * Crockford base32: no U (keeps accidental words out), and I / L / O are absent
 * from the alphabet but folded into 1 / 1 / 0 on input, so "IO" and "10" open
 * the same room. 5 characters = ~33.5 million codes, plenty for a game where a
 * handful of rooms exist at a time.
 */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 5;

export function generateUniqueJoinCode(): string {
	let joinCode: string;
	let attempts = 0;

	do {
		joinCode = '';
		for (let i = 0; i < CODE_LENGTH; i++) {
			joinCode += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
		}
		attempts++;
	} while (rooms.has(joinCode) && attempts < 100);

	return joinCode;
}

/**
 * Turn whatever the player typed into a code we can look up.
 * Handles lowercase, spaces, dashes, and the classic O/0 and I/1 mix-ups.
 */
export function normalizeJoinCode(input: unknown): string | null {
	if (typeof input !== 'string') return null;

	const code = input
		.toUpperCase()
		.replace(/[\s\-_]/g, '')
		.replace(/O/g, '0')
		.replace(/[IL]/g, '1');

	if (code.length !== CODE_LENGTH) return null;
	if (![...code].every(char => CODE_ALPHABET.includes(char))) return null;

	return code;
}

export function createRoom(data: RoomConstructorData) {
	const room = new KplRoom(data);
	rooms.set(room.uuid, room);
	broadcastLobbyUpdate();
	return room;
}

export function getRoomByUUID(uuid: string): KplRoom | undefined {
	return rooms.get(uuid);
}

/**
 * The running game this identity still has a seat in, if any. Used to put a
 * player who closed their tab straight back at the table when they come back,
 * without anyone having to restart the game around them.
 */
export function findHeldSeat(uuid: string): KplRoom | undefined {
	if (!uuid) return undefined;

	for (const room of rooms.values()) {
		if (room.holdsSeatFor(uuid)) {
			return room;
		}
	}

	return undefined;
}

export function destroyRoom(room: KplRoom): void {
	rooms.delete(room.uuid);
	room.onRoomDestroy();

	broadcastLobbyUpdate();
}

export function broadcastLobbyUpdate() {
	return broadcastRawToAllPlayers(getLobbyStateNetworkMessage());
}

export function getLobbyStateNetworkMessage() {
	return encodeNetworkMessage(NONCE_EMPTY, MessageType.RPC_CALL, {
		f: 'lobby',
		// Every room in this build is private, so there is no public list to send.
		// The count is honest: how many games are running right now.
		rooms: [],
		roomCount: rooms.size,
	});
}

export function getRoomLobbyState(room: KplRoom) {
	return {
		uuid: room.uuid,
		name: room.name,
		playerCount: room.playerCount,
		maxPlayers: room.maxPlayers,
		goal: room.goal,
		isPublic: room.isPublic,
		state: room.state,
	};
}

export function getAllRooms() {
	return Array.from(rooms.values());
}
