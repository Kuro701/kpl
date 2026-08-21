import { get, writable } from "svelte/store";
import { cubicOut } from "svelte/easing";

/*
 * Where the draw pile is on screen, in viewport coordinates.
 *
 * DeckPile publishes its own box here and the hand reads it, so cards can be
 * dealt out of the deck and sent back to it without the two components knowing
 * anything about each other's layout.
 */
export type DeckBox = { x: number; y: number; width: number; height: number };

export const DeckAnchor = writable<DeckBox | null>(null);

/** Respect the system setting — this is decoration, not information. */
function motionAllowed(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return true;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const DEAL_MS = 420;
const STAGGER_MS = 38;
/** Never make the last card of a big hand wait more than this to be dealt. */
const MAX_STAGGER_MS = 380;

type CardMotionOptions = { index?: number; count?: number };

function travel(node: Element) {
	const deck = get(DeckAnchor);
	if (!deck) return null;

	const card = node.getBoundingClientRect();
	if (!card.width || !card.height) return null;

	return {
		dx: (deck.x + deck.width / 2) - (card.left + card.width / 2),
		dy: (deck.y + deck.height / 2) - (card.top + card.height / 2),
		scale: deck.height / card.height,
	};
}

function stagger(index: number, count: number): number {
	if (count <= 1) return 0;
	const step = Math.min(STAGGER_MS, MAX_STAGGER_MS / (count - 1));
	return index * step;
}

/**
 * Deal: the card starts sitting on the deck and flies out to its place in the
 * hand. `u` runs 1 -> 0, so it is the distance still to travel.
 */
export function dealFromDeck(node: Element, { index = 0, count = 1 }: CardMotionOptions = {}) {
	if (!motionAllowed()) return { duration: 0 };

	const path = travel(node);
	if (!path) {
		// No deck on screen (narrow window) — a short lift is enough.
		return {
			delay: stagger(index, count),
			duration: DEAL_MS,
			easing: cubicOut,
			css: (t: number, u: number) => `transform: translateY(${u * 40}px); opacity: ${t};`,
		};
	}

	return {
		delay: stagger(index, count),
		duration: DEAL_MS,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`transform: translate(${u * path.dx}px, ${u * path.dy}px) rotate(${u * -9}deg) scale(${1 - u * (1 - path.scale)});` +
			`opacity: ${Math.min(1, t * 3)};`,
	};
}

/**
 * The other direction: whatever is left in your hand once you have played goes
 * back onto the pile. Quicker than the deal — nobody is waiting to read these.
 */
export function returnToDeck(node: Element, { index = 0, count = 1 }: CardMotionOptions = {}) {
	if (!motionAllowed()) return { duration: 0 };

	const path = travel(node);
	if (!path) {
		return { duration: 220, easing: cubicOut, css: (t: number) => `opacity: ${t};` };
	}

	return {
		delay: stagger(index, count) * .6,
		duration: 320,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`transform: translate(${u * path.dx}px, ${u * path.dy}px) rotate(${u * -9}deg) scale(${1 - u * (1 - path.scale)});` +
			`opacity: ${Math.min(1, t * 3)};`,
	};
}
