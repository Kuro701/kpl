import { derived, get, writable } from "svelte/store";
import { playSound } from "../sounds";

export enum RoomState {
	LOBBY = 'lobby',
	WAITING = 'waiting',
	PICK_WHITE = 'pick_white',
	PICK_CZAR = 'pick_czar',
}

export type PlayerResults = {
	uuid: string;
	username: string;
	points: number;
	image: string;
}

export type OtherPlayerData = PlayerResults & {
	isHost: boolean;
	isCzar: boolean;
	/** Their cards are already on the table this round. */
	hasPlayed: boolean;
}

type WhiteCard = {
	id: number;
	text: string;
	tip: string | null;
}

type BlackCard = WhiteCard & {
	pick: number;
};

type CardGroup<T> = {
	id: string;
	cards: T[];
}

type TableData = {
	black: BlackCard;
	white: CardGroup<WhiteCard>[];
	lastRoundWinnerGroupId: string | null;
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

export type GameResults = {
	/** The room is still alive — this is where "play again" goes back to. */
	roomUUID?: string;
	score: PlayerResults[];
}

export type ChatMessage = {
	id: string;
	kind: 'player' | 'system';
	uuid: string | null;
	username: string | null;
	text: string;
	at: string;
}

/** Chat for the room the player is currently in. Cleared on leave. */
export const ChatMessages = writable<ChatMessage[]>([]);
export const CHAT_MAX_LENGTH = 300;

export const IngameRoom = writable<IngameRoom | null>(null);
export const HandCards = derived(IngameRoom, ($IngameRoom => {
	if (!$IngameRoom) return [];
	return $IngameRoom.hand.cards;
}));
export const BlackCard = derived(IngameRoom, ($IngameRoom => {
	if (!$IngameRoom) return null;

	return $IngameRoom.table.black;
}));
export const BoardCards = derived(IngameRoom, ($IngameRoom => {
	if (!$IngameRoom) return [];

	return $IngameRoom.table.white;
}));

export const ServerResponseFn = writable<((data: unknown) => void) | null>(null);
export const SelectedCards = writable<number[]>([]);
export const LastGameResults = writable<GameResults | null>(null);

function submitSelectedCards(cards: number[]) {
	const reponse = get(ServerResponseFn);
	if (!reponse) {
		console.error('No response function');
		return;
	}

	ServerResponseFn.set(null);
	reponse(cards);
}

export function pushSelectedCard(id: number) {
	playSound('pick');
	SelectedCards.update(cards => {
		if (cards.includes(id)) {
			return cards;
		}

		cards.push(id);

		const ingameRoom = get(IngameRoom);

		if (!ingameRoom) {
			return [];
		}

		if (cards.length >= ingameRoom.table.black.pick) {
			submitSelectedCards(cards);
			return cards;
		}

		return cards;
	});
}
