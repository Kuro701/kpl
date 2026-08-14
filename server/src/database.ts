/*
 * In-memory card store.
 *
 * The original build kept cards in MySQL through Prisma, but the game only ever
 * READS them (three queries, all findMany). Nothing writes a card or a deck, and
 * rooms/players already live in memory — so the database was pure deployment
 * weight. Cards now load once at boot from JSON in `server/cards/`.
 *
 * Packs are themes, and a card carries tags rather than belonging to one pack:
 * "Mikropenis" is both sex and absurd humour, and forcing it into one bucket
 * would gut whichever pack lost it. Selecting several packs takes the union and
 * de-duplicates, so a card never lands in a deck twice.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

export type Card = {
	id: number;
	text: string;
	tip: string | null;
	/** 0 = white card. 1..3 = black card, the value is how many white cards it takes. */
	pick: number;
	tags: string[];
};

export type CardDeck = {
	id: number;
	tag: string;
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

type CardFile = {
	id: number;
	text: string;
	pick?: number;
	tip?: string;
	tags?: string[];
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = path.resolve(HERE, '..', 'cards');

/** Cards with no usable tag fall in here, so nothing is ever unreachable. */
const FALLBACK_TAG = 'absurdni';

const DECKS: CardDeck[] = [
	{
		id: 1,
		tag: 'sex',
		ownerUUID: 'system',
		name: 'Sex a erotika',
		description: 'Všechno pod pásem.',
		public: true,
		default: true,
	},
	{
		id: 2,
		tag: 'hnus',
		ownerUUID: 'system',
		name: 'Hnus a tělesnosti',
		description: 'Výměšky, zápach, rozklad. Nehrát u jídla.',
		public: true,
		default: true,
	},
	{
		id: 3,
		tag: 'politika',
		ownerUUID: 'system',
		name: 'Politika a dějiny',
		description: 'Politici, války, náboženství a společenská témata.',
		public: true,
		default: true,
	},
	{
		id: 4,
		tag: 'popkultura',
		ownerUUID: 'system',
		name: 'Popkultura',
		description: 'Celebrity, filmy, značky a internet.',
		public: true,
		default: true,
	},
	{
		id: 5,
		tag: FALLBACK_TAG,
		ownerUUID: 'system',
		name: 'Absurdní humor',
		description: 'Nesmysly, náhoda a obyčejné věci ve špatnou chvíli.',
		public: true,
		default: true,
	},
];

const KNOWN_TAGS = new Set(DECKS.map(deck => deck.tag));

/** Keeps white and black card ids from colliding — they are numbered separately in the files. */
const BLACK_ID_OFFSET = 100_000;

const CARDS: Card[] = [];

function readJson(file: string): CardFile[] {
	const full = path.join(CARDS_DIR, file);

	if (!fs.existsSync(full)) {
		throw new Error(`Card file missing: ${full}`);
	}

	const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));

	if (!Array.isArray(parsed)) {
		throw new Error(`Card file is not a list: ${full}`);
	}

	return parsed as CardFile[];
}

function cleanTags(tags: unknown): string[] {
	if (!Array.isArray(tags)) {
		return [FALLBACK_TAG];
	}

	const clean = [...new Set(tags.filter((t): t is string => typeof t === 'string' && KNOWN_TAGS.has(t)))];
	return clean.length > 0 ? clean : [FALLBACK_TAG];
}

function loadCards(): void {
	for (const card of readJson('white_cards.json')) {
		CARDS.push({
			id: card.id,
			text: card.text,
			tip: card.tip ?? null,
			pick: 0,
			tags: cleanTags(card.tags),
		});
	}

	for (const card of readJson('black_cards.json')) {
		CARDS.push({
			id: card.id + BLACK_ID_OFFSET,
			text: card.text,
			tip: null,
			pick: card.pick && card.pick > 0 ? card.pick : 1,
			tags: cleanTags(card.tags),
		});
	}

	const ids = new Set(CARDS.map(card => card.id));
	if (ids.size !== CARDS.length) {
		throw new Error('Duplicate card ids after load — the game picks cards by id.');
	}

	if (CARDS.length === 0) {
		throw new Error('No cards loaded — the game cannot run without a deck.');
	}
}

loadCards();

for (const deck of DECKS) {
	const counts = countDeck(deck);
	console.log(
		`${chalk.bold.magentaBright('[cards]')} ${deck.name}: ` +
		`${chalk.bold(String(counts.whiteCardCount))} bílých, ${chalk.bold(String(counts.blackCardCount))} černých`
	);
}

/** Deck ids used when the player picked none. */
export function getDefaultDeckIds(): number[] {
	return DECKS.filter(deck => deck.default).map(deck => deck.id);
}

export function countDeck(deck: CardDeck): CardDeckWithCounts {
	const cards = CARDS.filter(card => card.tags.includes(deck.tag));
	const whiteCardCount = cards.filter(card => card.pick === 0).length;

	return {
		...deck,
		whiteCardCount,
		blackCardCount: cards.length - whiteCardCount,
		totalCardCount: cards.length,
	};
}

/** Decks this player is allowed to pick from. */
export function getAvailableDecks(playerUUID: string): CardDeckWithCounts[] {
	return DECKS
		.filter(deck => deck.public || deck.ownerUUID === playerUUID)
		.map(countDeck);
}

/**
 * Every card covered by the selected packs, de-duplicated.
 * A room shuffles and mutates its own arrays, so each card is copied.
 */
export function getCardsForDecks(deckIds: number[], ownerUUID: string): Card[] {
	const tags = new Set(
		DECKS
			.filter(deck => deckIds.includes(deck.id))
			.filter(deck => deck.public || deck.ownerUUID === ownerUUID)
			.map(deck => deck.tag)
	);

	if (tags.size === 0) {
		return [];
	}

	return CARDS
		.filter(card => card.tags.some(tag => tags.has(tag)))
		.map(card => ({ ...card, tags: [...card.tags] }));
}
