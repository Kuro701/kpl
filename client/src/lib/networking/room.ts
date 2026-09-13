import { derived, get, writable } from "svelte/store";
import { playSound } from "../sounds";
import { rpcCall } from "./req-res-manager";

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
	/** Only ever set on cards in your own hand — a blank you write yourself. */
	joker?: boolean;
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
	/** Only sent once the czar has decided — anonymous until then. */
	lastRoundWinner: { uuid: string; username: string } | null;
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

	/*
	 * Whether the free hand swap is open FOR YOU right now. Decided by the
	 * server per player — the czar and anyone who has already played this round
	 * do not get it — so the client never has to work out the rules itself.
	 */
	canReshuffle?: boolean;
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

/*
 * Seven players or more and the board is tight: the black card and the deck
 * both stand down a size together. One flag so they cannot drift apart.
 */
export const CrowdedTable = derived(IngameRoom, ($IngameRoom => ($IngameRoom?.players.length ?? 0) >= 7));

export const ServerResponseFn = writable<((data: unknown) => void) | null>(null);
export const SelectedCards = writable<number[]>([]);
export const LastGameResults = writable<GameResults | null>(null);

export const JOKER_MAX_LENGTH = 120;

/*
 * Blank cards waiting to be written on.
 *
 * A normal pick submits the moment you have chosen enough cards. A Žolík can't:
 * the card is empty until the player types something, so the selection is held
 * here and the submit waits for the text. Empty means nothing is pending.
 */
export const PendingJokers = writable<number[]>([]);

function submitSelectedCards(cards: number[], texts?: Record<string, string>) {
	const reponse = get(ServerResponseFn);
	if (!reponse) {
		console.error('No response function');
		return;
	}

	ServerResponseFn.set(null);
	PendingJokers.set([]);
	reponse(texts ? { cards, texts } : cards);
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
			const jokers = cards.filter(cardId =>
				ingameRoom.hand.cards.find(card => card.id === cardId)?.joker);

			if (jokers.length > 0) {
				// Hand off to the writing step instead of submitting a blank.
				PendingJokers.set(jokers);
				return cards;
			}

			submitSelectedCards(cards);
			return cards;
		}

		return cards;
	});
}

/*
 * Swap the whole hand for a fresh one. Fire and forget: the server answers by
 * pushing new state, and a refusal (already used, already played, czar) simply
 * leaves the hand alone — the button is gone by then anyway.
 */
export function reshuffleHand() {
	rpcCall('reshuffleHand').catch(() => {});
}

/** Called by the joker prompt once every blank in the selection has text. */
export function submitJokerTexts(texts: Record<string, string>) {
	submitSelectedCards(get(SelectedCards), texts);
}
