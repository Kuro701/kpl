import { cubicOut } from "svelte/easing";

/*
 * Cards are dealt out of the draw pile and sent back to it.
 *
 * The pile marks itself with data-deck-anchor and this reads that element's box
 * at the moment a transition starts. An earlier version had DeckPile publish
 * its rectangle into a store on mount — which meant the animation depended on
 * that store being non-null and up to date at exactly the right time, and when
 * it was not the cards fell back to a barely visible nudge and the whole thing
 * looked broken rather than absent. Asking the DOM has no such state to get
 * wrong.
 */
const DECK_SELECTOR = '[data-deck-anchor]';

/** Respect the system setting — this is decoration, not information. */
function motionAllowed(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) return true;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const DEAL_MS = 460;
const RETURN_MS = 340;
const STAGGER_MS = 38;
/** Never make the last card of a big hand wait more than this to be dealt. */
const MAX_STAGGER_MS = 380;

type CardMotionOptions = { index?: number; count?: number };

type Path = { dx: number; dy: number; scale: number; spin: number };

function pathToDeck(node: Element): Path | null {
	const card = node.getBoundingClientRect();
	if (!card.width || !card.height) return null;

	const deck = document.querySelector(DECK_SELECTOR)?.getBoundingClientRect();

	/*
	 * No deck on screen — a narrow window hides it. Fly in from well below the
	 * bottom edge instead. Deliberately a long way: a small nudge reads as a
	 * glitch, not as a card arriving.
	 */
	if (!deck || !deck.width || !deck.height) {
		return { dx: 0, dy: window.innerHeight - card.top, scale: .8, spin: 0 };
	}

	return {
		dx: (deck.x + deck.width / 2) - (card.left + card.width / 2),
		dy: (deck.y + deck.height / 2) - (card.top + card.height / 2),
		scale: deck.height / card.height,
		spin: -9,
	};
}

function stagger(index: number, count: number): number {
	if (count <= 1) return 0;
	const step = Math.min(STAGGER_MS, MAX_STAGGER_MS / (count - 1));
	return index * step;
}

function flight(path: Path) {
	// `u` is the distance still to travel: 1 at the deck, 0 in place.
	return (t: number, u: number) =>
		`transform: translate(${u * path.dx}px, ${u * path.dy}px)` +
		` rotate(${u * path.spin}deg) scale(${1 - u * (1 - path.scale)});` +
		`opacity: ${Math.min(1, t * 3)};`;
}

/** Deal: the card starts sitting on the deck and flies out to your hand. */
export function dealFromDeck(node: Element, { index = 0, count = 1 }: CardMotionOptions = {}) {
	if (!motionAllowed()) return { duration: 0 };

	const path = pathToDeck(node);
	if (!path) return { duration: 0 };

	return {
		delay: stagger(index, count),
		duration: DEAL_MS,
		easing: cubicOut,
		css: flight(path),
	};
}

/**
 * The other direction: whatever is left in your hand once you have played goes
 * back onto the pile. Quicker than the deal — nobody is waiting to read these.
 */
export function returnToDeck(node: Element, { index = 0, count = 1 }: CardMotionOptions = {}) {
	if (!motionAllowed()) return { duration: 0 };

	const path = pathToDeck(node);
	if (!path) return { duration: 0 };

	return {
		delay: stagger(index, count) * .6,
		duration: RETURN_MS,
		easing: cubicOut,
		css: flight(path),
	};
}
