<script lang="ts">
	import { onMount } from "svelte";
	import Card from "../../components/cards/Card.svelte";
	import { HandCards, IngameRoom, pushSelectedCard, RoomState, SelectedCards, ServerResponseFn } from "../../lib/networking/room";
	import { dealFromDeck, returnToDeck } from "../../lib/deck-motion";

	export let hide = false;

	let elementWidth = 0;
	let wrapperElement: HTMLElement | null = null;

	let selectedCard: number | null = null;

	let selectionEnabled = false;
	$: selectionEnabled = $IngameRoom?.state === RoomState.PICK_WHITE && !!$ServerResponseFn && $SelectedCards.length < $IngameRoom.table.black.pick;

	function updateElementWidth() {
		if (!wrapperElement) return;

		elementWidth = wrapperElement.clientWidth;
	}

	onMount(updateElementWidth);

	function onCardClick(id: number) {
		if (!selectionEnabled) {
			selectedCard = null;
			return;
		}

		if (selectedCard === id) {
			pushSelectedCard(id);
			selectedCard = null;
		} else {
			selectedCard = id;
		}
	}
	function onCardDoubleClick(id: number) {
		selectedCard = null;
		if (!selectionEnabled) {
			return;
		}

		pushSelectedCard(id);
	}
</script>

<svelte:window on:resize={updateElementWidth} />
<div
	class="hand"
	style={`--card-count: ${$HandCards.length}; --hand-width: ${elementWidth}px`}
	bind:this={wrapperElement}
>
	{#if !hide}
	<div class="shrinkable">
		{#each $HandCards as card, i (card.id)}
			{#if i !== $HandCards.length - 1}
				<button
					class="card"
					class:selected={selectedCard === card.id}
					class:onBoard={$SelectedCards.includes(card.id)}
					on:click={() => onCardClick(card.id)}
					on:dblclick={() => onCardDoubleClick(card.id)}
					in:dealFromDeck={{ index: i, count: $HandCards.length }}
					out:returnToDeck={{ index: i, count: $HandCards.length }}
				>
					<Card
						black={false}
						show={!hide}
						text={card.text}
						tip={card.tip}
					/>
				</button>
			{/if}
		{/each}
	</div>
	{#if $HandCards.length > 0}
		{@const card = $HandCards[$HandCards.length - 1]}
		<div class="not-shrinkable">
			<button
				class="card card--last"
				class:selected={selectedCard === card.id}
				class:onBoard={$SelectedCards.includes(card.id)}
				on:click={() => onCardClick(card.id)}
				on:dblclick={() => onCardDoubleClick(card.id)}
				in:dealFromDeck={{ index: $HandCards.length - 1, count: $HandCards.length }}
				out:returnToDeck={{ index: $HandCards.length - 1, count: $HandCards.length }}
			>
				<Card
					black={false}
					show={!hide}
					text={card.text}
					tip={card.tip}
				/>
			</button>
		</div>
	{/if}
	{/if}
</div>

<style>
	.hand {
		--card-width: calc(12rem + 12px);

		--other-card-space: calc(var(--hand-width) - var(--card-width));
		--other-card-width: calc(var(--other-card-space) / (var(--card-count) - 1));

		--other-card-hover-space: calc(var(--other-card-space) - var(--card-width));
		--other-card-hover-width: calc(var(--other-card-hover-space) / (var(--card-count) - 2));

		display: flex;
		width: 100%;
		justify-content: center;
		height: 15rem;
		pointer-events: none;
	}

	.card {
		display: inline-block;
		/* The hand spans the full width of the board so the cards can centre in
		   it, but only the cards themselves may take a click — otherwise the
		   empty width either side of them sits over the board and swallows it. */
		pointer-events: auto;
		width: min(var(--other-card-width), var(--card-width));
		transition: width 0.175s ease-out, transform 0.1s ease-out, opacity 0.1s ease-out;
		font: inherit;
		text-rendering: inherit;
		color: inherit;
		letter-spacing: inherit;
		word-spacing: inherit;
		text-transform: inherit;
		text-indent: inherit;
		text-shadow: inherit;
		padding: 0;
		margin: 0;
		border: none;
		text-align: inherit;
		background-color: transparent;
	}

	.shrinkable, .not-shrinkable {
		display: contents;
	}

	.shrinkable:hover .card {
		width: min(var(--other-card-hover-width), var(--card-width));
	}

	.hand .card:hover {
		width: var(--card-width);
		filter: drop-shadow(0 0 26px rgb(var(--accent-rgb) / .45));
	}
	.card--last {
		width: var(--card-width);
		margin: 0;
		padding: 0;
	}

	.card.selected {
		transform: translateY(-1.5rem);
	}
	.card.selected {
		filter: drop-shadow(0 0 30px rgb(var(--accent-rgb) / .6));
	}
	.card.selected::before {
		content: "Kliknutím znovu potvrdíš výběr";
		position: absolute;
		top: 0;
		left: 0;
		transform: translateY(-100%);
		font-size: .7rem;
		width: var(--card-width);
		text-align: center;
		opacity: .5;
	}
	.card.onBoard {
		display: none;
		animation: card-used 1s ease-out;
	}

	@keyframes card-used {
		0% {
			transform: translateY(-1.5rem);
			opacity: 1;
			width: var(--card-width);
			display: block;
		}
		50% {
			transform: translateY(-3rem);
			opacity: 0;
			width: var(--card-width);
			display: block;
		}
		100% {
			transform: translateY(-3rem);
			opacity: 0;
			width: 0;
			display: block;
		}
	}

	/* `hide` used to squash this to nothing and let the cards spill out of the
	   bottom of the screen. It now empties the hand instead, and each card
	   leaves by flying back to the deck. */
</style>
