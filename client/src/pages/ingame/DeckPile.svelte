<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import Card from "../../components/cards/Card.svelte";
	import { DeckAnchor } from "../../lib/deck-motion";

	/*
	 * The draw pile. On the table for the whole game — your hand is dealt out
	 * of it and the cards you do not play go back onto it.
	 *
	 * It also replaced the old hidden-hand state, which collapsed to zero
	 * height and left its cards poking out of the bottom edge of the board,
	 * sliced off. You could tell there were cards down there and nothing else.
	 */
	const LAYERS = [2, 1, 0];

	/*
	 * The hand deals cards out of here and sends them back, so the pile has to
	 * say where it is. Published rather than measured from the other side —
	 * only this component knows when its own box moves.
	 */
	let el: HTMLDivElement | undefined;

	function publish() {
		if (!el) return;
		const { x, y, width, height } = el.getBoundingClientRect();
		DeckAnchor.set({ x, y, width, height });
	}

	onMount(() => {
		publish();
		const observer = new ResizeObserver(publish);
		if (el) observer.observe(el);
		window.addEventListener('resize', publish);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', publish);
		};
	});

	onDestroy(() => DeckAnchor.set(null));
</script>

<div class="deck" aria-hidden="true" bind:this={el}>
	{#each LAYERS as layer (layer)}
		<div class="deck__layer" style={`--layer: ${layer}`}>
			<Card black={false} show={false} noMargin={true} />
		</div>
	{/each}
</div>

<style>
	.deck {
		position: relative;
		/* The card is 12em x 15em, so the font size is the card size. */
		font-size: 11px;
		width: 12em;
		height: 15em;
		/* Room for the offset of the deepest layer. */
		margin: .6em .6em 1.8em 1.8em;
		pointer-events: none;
		user-select: none;
	}

	.deck__layer {
		position: absolute;
		top: 0;
		left: 0;
		/* Each layer sits a little below and behind the one in front of it, so
		   the pile reads as a stack rather than a single card. */
		transform:
			translate(calc(var(--layer) * -.75em), calc(var(--layer) * .7em))
			rotate(calc(var(--layer) * -2.2deg));
		filter: brightness(calc(1 - var(--layer) * .3));
	}
	.deck__layer:first-child { z-index: 1; }
	.deck__layer:last-child  { z-index: 3; }
</style>
