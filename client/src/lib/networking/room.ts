import { writable } from "svelte/store";

enum RoomState {
	LOBBY = 'lobby',
}

type OtherPlayerData = {
	uuid: string;
	username: string;
	points: number;
	isHost: boolean;
}

type TableData = {

};

type HandData = {

};

export type IngameRoom = {
	uuid: string;
	name: string;
	goal: number;
	maxPlayers: number;
	isPublic: boolean;

	state: RoomState;
	intermissionStart: Date | null;
	intermissionEnd: Date | null;

	players: OtherPlayerData[];
	table: TableData;
	hand: HandData;
}

export const IngameRoom = writable<IngameRoom | null>(null);
