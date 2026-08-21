<script lang="ts">
	import Card from "../../components/cards/Card.svelte";
	import { CrowdedTable } from "../../lib/networking/room";

	/*
	 * The draw pile. On the table for the whole game — your hand is dealt out
	 * of it and the cards you do not play go back onto it.
	 *
	 * It also replaced the old hidden-hand state, which collapsed to zero
	 * height and left its cards poking out of the bottom edge of the board,
	 * sliced off. You could tell there were cards down there and nothing else.
	 *
	 * data-deck-anchor is how the hand finds it: the deal reads this element's
	 * box when a card starts moving. Nothing is published or cached, so there
	 * is no stale rectangle to get wrong after a resize or a re-layout.
	 */
	const LAYERS = [2, 1, 0];
</script>

<div
	class="deck"
	class:deck--compact={$CrowdedTable}
	aria-hidden="true"
	data-deck-anchor
>
	{#each LAYERS as layer (layer)}
		<div class="deck__layer" style={`--layer: ${layer}`}>
			<Card black={false} show={false} noMargin={true} />
		</div>
	{/each}
</div>

<style>
	.deck {
		position: relative;
		/*
		 * A card is 12em x 15em, so the font size *is* the card size. 1rem makes
		 * the pile exactly as big as the black card, which is the other thing
		 * sitting on this row — they should read as the same deck.
		 */
		font-size: 1rem;
		width: 12em;
		height: 15em;
		/* Room for the layers that sit down and to the left of the top card. */
		margin: 0 0 1.4em 1.4em;
		pointer-events: none;
		user-select: none;
	}

	/* Matches BlackCardWidget: at seven players the whole row stands down. */
	.deck--compact {
		font-size: .74rem;
	}

	.deck__layer {
		position: absolute;
		top: 0;
		left: 0;
		/* Each layer sits a little below and behind the one in front of it, so
		   the pile reads as a stack rather than a single card. */
		transform:
			translate(calc(var(--layer) * -.7em), calc(var(--layer) * .65em))
			rotate(calc(var(--layer) * -2deg));
		filter: brightness(calc(1 - var(--layer) * .3));
	}
	.deck__layer:first-child { z-index: 1; }
	.deck__layer:last-child  { z-index: 3; }
</style>
