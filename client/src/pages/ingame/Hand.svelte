<script lang="ts">
	import { onMount, tick } from "svelte";
	import Card from "../../components/cards/Card.svelte";
	import { HandCards, IngameRoom, pushSelectedCard, RoomState, SelectedCards, ServerResponseFn } from "../../lib/networking/room";
	import { flyCards } from "../../lib/deck-motion";

	export let hide = false;

	/*
	 * `hide` says whether you should have a hand. `showing` says whether the
	 * cards are still on screen — they lag behind on the way out, because they
	 * turn face down and then fly back to the deck before they can be taken
	 * away.
	 */
	let showing = !hide;
	let faceDown = false;
	let cardNodes: (HTMLElement | undefined)[] = [];
	let flightId = 0;

	/** Long enough for the turn to read before the cards start moving. */
	const FLIP_LEAD_MS = 320;
	const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	$: syncHand(hide);

	async function syncHand(hidden: boolean) {
		const flight = ++flightId;

		if (hidden) {
			if (!showing) return;

			// Turn first, then leave: they go back into a pile of face-down
			// cards, so they are face down by the time they get there.
			faceDown = true;
			await wait(FLIP_LEAD_MS);
			if (flight !== flightId) return;

			await flyCards(cardNodes, 'out');
			// A new round may have started while they were in the air.
			if (flight !== flightId) return;
			showing = false;
			faceDown = false;
			cardNodes = [];
			return;
		}

		showing = true;
		faceDown = false;
		/*
		 * Wait for the cards to exist before dealing them. This also covers the
		 * first render of a game: the reactive statement runs before there is
		 * any DOM, so without the tick the opening hand would appear with no
		 * deal at all.
		 */
		await tick();
		if (flight !== flightId) return;
		flyCards(cardNodes, 'in');
	}

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
	{#if showing}
	<div class="shrinkable">
		{#each $HandCards as card, i (card.id)}
			{#if i !== $HandCards.length - 1}
				<button
					class="card"
					class:selected={selectedCard === card.id}
					class:onBoard={$SelectedCards.includes(card.id)}
					on:click={() => onCardClick(card.id)}
					on:dblclick={() => onCardDoubleClick(card.id)}
					bind:this={cardNodes[i]}
				>
					<Card
						black={false}
						show={!faceDown}
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
				bind:this={cardNodes[$HandCards.length - 1]}
			>
				<Card
					black={false}
					show={!faceDown}
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
