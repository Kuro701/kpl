/*
 * In-memory card store.
 *
 * The original build kept cards in MySQL through Prisma, but the game only ever
 * READS them (three queries, all findMany). Nothing in the game writes a card or
 * a deck, and rooms/players live in memory already — so the database was pure
 * deployment weight. Cards are now loaded once at boot from the legacy JSON that
 * already ships in this repo.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

export type Card = {
	id: number;
	deckId: number;
	text: string;
	tip: string | null;
	/** 0 = white card. 1..3 = black card, value is how many white cards it takes. */
	pick: number;
};

export type CardDeck = {
	id: number;
	ownerUUID: string;
	name: string;
	description: string | null;
	public: boolean;
	default: boolean;
};

export type CardDeckWithCounts = CardDeck & {
	whiteCardCount: number;
	blackCardCount: number;
	totalCardCount: number;
};

type LegacyWhiteCard = { id: string | number; text: string; source?: string; tooltip?: string };
type LegacyBlackCard = { id: string | number; text: string; pick: number; source?: string };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = path.resolve(HERE, '..', 'cards');

const DECKS: CardDeck[] = [
	{
		id: 1,
		ownerUUID: 'system',
		name: 'KPL Online - Original (2018)',
		description: 'Původní balíček karet použitý při prvním spuštění KPL Online v roce 2018',
		public: true,
		default: true,
	},
	{
		id: 2,
		ownerUUID: 'system',
		name: 'KPL Online - Community (2021)',
		description: 'Rozšíření balíčku karet na základě návrhů komunity v roce 2021',
		public: true,
		default: true,
	},
];

const CARDS: Card[] = [];

function readJson<T>(file: string): T[] {
	const full = path.join(CARDS_DIR, file);
	if (!fs.existsSync(full)) {
		throw new Error(`Card file missing: ${full}`);
	}
	return JSON.parse(fs.readFileSync(full, 'utf8')) as T[];
}

function loadCards(): void {
	const white = readJson<LegacyWhiteCard>('white_cards.json');
	const black = readJson<LegacyBlackCard>('black_cards.json');

	let nextId = 1;

	// A card with a `source` came from the 2021 community round; everything else
	// is the original 2018 pack. Same split the old import script used.
	for (const card of white) {
		CARDS.push({
			id: nextId++,
			deckId: card.source ? 2 : 1,
			text: card.text,
			tip: card.tooltip ?? null,
			pick: 0,
		});
	}

	for (const card of black) {
		CARDS.push({
			id: nextId++,
			deckId: card.source ? 2 : 1,
			text: card.text,
			tip: null,
			pick: card.pick,
		});
	}

	if (CARDS.length === 0) {
		throw new Error('No cards loaded — the game cannot run without a deck.');
	}
}

loadCards();

for (const deck of DECKS) {
	const total = CARDS.filter(c => c.deckId === deck.id).length;
	const white = CARDS.filter(c => c.deckId === deck.id && c.pick === 0).length;
	console.log(
		`${chalk.bold.magentaBright('[cards]')} ${deck.name}: ` +
		`${chalk.bold(String(white))} bílých, ${chalk.bold(String(total - white))} černých`
	);
}

/** Deck ids used when nobody picked any decks explicitly. */
export function getDefaultDeckIds(): number[] {
	return DECKS.filter(deck => deck.default).map(deck => deck.id);
}

export function countDeck(deck: CardDeck): CardDeckWithCounts {
	const totalCardCount = CARDS.filter(card => card.deckId === deck.id).length;
	const whiteCardCount = CARDS.filter(card => card.deckId === deck.id && card.pick === 0).length;

	return {
		...deck,
		whiteCardCount,
		blackCardCount: totalCardCount - whiteCardCount,
		totalCardCount,
	};
}

/** Decks this player is allowed to pick from. */
export function getAvailableDecks(playerUUID: string): CardDeckWithCounts[] {
	return DECKS
		.filter(deck => deck.public || deck.ownerUUID === playerUUID)
		.map(countDeck);
}

/** Every card belonging to the requested decks, if the room may use them. */
export function getCardsForDecks(deckIds: number[], ownerUUID: string): Card[] {
	const allowed = new Set(
		DECKS
			.filter(deck => deckIds.includes(deck.id))
			.filter(deck => deck.public || deck.ownerUUID === ownerUUID)
			.map(deck => deck.id)
	);

	// Copy each card — a room shuffles and mutates its own deck arrays.
	return CARDS.filter(card => allowed.has(card.deckId)).map(card => ({ ...card }));
}
