/*
 * Cards flying between your hand and the draw pile.
 *
 * This is done with element.animate() rather than a Svelte transition. The
 * transition version looked right on paper and did nothing on screen: the
 * cards sat out the duration — long enough to flip — and then vanished without
 * ever moving. Rather than keep guessing at why the generated keyframes were
 * not taking, this drives the animation itself, where the only things that can
 * go wrong are visible in this file.
 *
 * The pile marks itself with data-deck-anchor and we read its box at the moment
 * the cards start moving, so there is no cached rectangle to go stale.
 */
const DECK_SELECTOR = '[data-deck-anchor]';

const DEAL_MS = 460;
const RETURN_MS = 340;
const STAGGER_MS = 38;
/** Never make the last card of a big hand wait more than this. */
const MAX_STAGGER_MS = 380;
const EASE = 'cubic-bezier(.22,.61,.36,1)';

/** Respect the system setting — this is decoration, not information. */
function motionAllowed(): boolean {
	if (typeof window === 'undefined') return false;
	if (typeof Element === 'undefined' || !Element.prototype.animate) return false;
	if (!window.matchMedia) return true;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stagger(index: number, count: number): number {
	if (count <= 1) return 0;
	return index * Math.min(STAGGER_MS, MAX_STAGGER_MS / (count - 1));
}

/** Where a card has to go to be sitting on the deck, from where it is now. */
function deckKeyframe(node: HTMLElement): Keyframe | null {
	const card = node.getBoundingClientRect();
	if (!card.width || !card.height) return null;

	const deck = document.querySelector(DECK_SELECTOR)?.getBoundingClientRect();

	// No deck on screen — a narrow window hides it. Off the bottom edge instead.
	if (!deck || !deck.width || !deck.height) {
		return {
			transform: `translate(0px, ${Math.round(window.innerHeight - card.top + 40)}px) scale(.85)`,
			opacity: 0,
		};
	}

	const dx = (deck.x + deck.width / 2) - (card.left + card.width / 2);
	const dy = (deck.y + deck.height / 2) - (card.top + card.height / 2);

	return {
		transform: `translate(${Math.round(dx)}px, ${Math.round(dy)}px) rotate(-9deg) scale(${(deck.height / card.height).toFixed(3)})`,
		opacity: .25,
	};
}

const HOME: Keyframe = { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 };

/**
 * Fly a set of cards to or from the deck. Resolves once every card has landed,
 * so the caller can wait before taking the cards out of the DOM.
 */
export function flyCards(nodes: (HTMLElement | null | undefined)[], direction: 'in' | 'out'): Promise<void> {
	const cards = nodes.filter((n): n is HTMLElement => !!n && n.isConnected);
	if (!cards.length || !motionAllowed()) return Promise.resolve();

	const dealing = direction === 'in';
	const running: Animation[] = [];

	cards.forEach((node, index) => {
		const atDeck = deckKeyframe(node);
		if (!atDeck) return;

		const animation = node.animate(
			dealing ? [atDeck, HOME] : [HOME, atDeck],
			{
				duration: dealing ? DEAL_MS : RETURN_MS,
				delay: stagger(index, cards.length) * (dealing ? 1 : .6),
				easing: EASE,
				fill: 'both',
			},
		);
		running.push(animation);
	});

	if (!running.length) return Promise.resolve();

	return Promise.all(running.map(a => a.finished.catch(() => undefined))).then(() => {
		// Dealt cards are home; drop the animation so nothing is left pinned by
		// fill: both. Returning cards keep theirs — they are about to be removed
		// and must not snap back to the hand first.
		if (dealing) running.forEach(a => { try { a.cancel(); } catch { /* already gone */ } });
	});
}
