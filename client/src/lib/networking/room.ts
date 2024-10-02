import { derived, writable } from "svelte/store";

export enum RoomState {
	LOBBY = 'lobby',
	WAITING = 'waiting',
	PICK_WHITE = 'pick_white',
}

type OtherPlayerData = {
	uuid: string;
	username: string;
	points: number;
	image: string;
	isHost: boolean;
	isCzar: boolean;
}

type WhiteCard = {
	id: number;
	text: string;
	tip: string | null;
}

type BlackCard = WhiteCard & {
	pick: number;
};

type TableData = {
	black: BlackCard;
};

type HandData = {
	cards: WhiteCard[];
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
export const ServerResponseFn = writable<((data: unknown) => void) | null>(null);
export const HandCards = derived(IngameRoom, ($IngameRoom => {
	if (!$IngameRoom) return [];
	return $IngameRoom.hand.cards;
}));
export const BlackCard = derived(IngameRoom, ($IngameRoom => {
	if (!$IngameRoom) return null;

	return $IngameRoom.table.black;
}));
