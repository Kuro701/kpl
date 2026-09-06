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

export const JOKER_TAG = 'joker';

/*
 * How many blanks the Žolík pack holds, and where their ids live.
 *
 * 24 against 783 real white cards is about 3% with every pack enabled — often
 * enough that everyone gets a couple over a game to eight points, rare enough
 * that drawing one still feels like something. The ids sit in their own range
 * so they can never collide with a card from the JSON files, which are numbered
 * from 1 and are edited by hand.
 */
const JOKER_COUNT = 24;
const JOKER_ID_BASE = 900_000;

/*
 * Longest a written answer may be. The longest real white card is 132
 * characters, so this keeps a joker inside what a printed card could have said
 * and, more practically, inside what the card layout can render.
 */
export const JOKER_MAX_LENGTH = 120;

/** Blank cards are identified by id range, not by empty text — text gets filled in. */
export function isJokerCardId(id: number): boolean {
	return id >= JOKER_ID_BASE && id < JOKER_ID_BASE + JOKER_COUNT;
}

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
	/*
	 * Žolíci are blank cards the player fills in when they play one. They are a
	 * pack rather than a separate mechanic so the host turns them on exactly
	 * like any other deck, and they shuffle into the white pile like any other
	 * card — nobody gets a guaranteed joker, you draw one or you don't.
	 *
	 * Off by default: a blank card is a surprise, and a group that did not ask
	 * for one should not be handed one mid-game.
	 */
	{
		id: 6,
		tag: JOKER_TAG,
		ownerUUID: 'system',
		name: 'Žolíci',
		description: 'Prázdné karty — vlastní odpověď si napíšeš sám.',
		public: true,
		default: false,
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

	// The blanks carry no text of their own — the player supplies it at the
	// moment they play one, and the server writes it onto a copy.
	for (let i = 0; i < JOKER_COUNT; i++) {
		CARDS.push({
			id: JOKER_ID_BASE + i,
			text: '',
			tip: null,
			pick: 0,
			tags: [JOKER_TAG],
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
