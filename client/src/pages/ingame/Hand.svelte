<script lang="ts">
	import { onMount } from "svelte";
	import Card from "../../components/cards/Card.svelte";
	import { HandCards } from "../../lib/networking/room";

	let elementWidth = 0;
	let wrapperElement: HTMLElement | null = null;

	function updateElementWidth() {
		if (!wrapperElement) return;

		elementWidth = wrapperElement.clientWidth;
	}

	onMount(updateElementWidth);
</script>

<svelte:window on:resize={updateElementWidth} />

<div class="hand" style={`--card-count: ${$HandCards.length}; --hand-width: ${elementWidth}px`} bind:this={wrapperElement}>
	<div class="shrinkable">
		{#each $HandCards as card, i (card.id)}
			{#if i !== $HandCards.length - 1}
				<button class="card">
					<Card
						black={false}
						show={true}
						text={card.text}
					/>
				</button>
			{/if}
		{/each}
	</div>
	{#if $HandCards.length > 0}
		<div class="not-shrinkable">
			<button class="card card--last">
				<Card
					black={false}
					show={true}
					text={$HandCards[$HandCards.length - 1].text}
				/>
			</button>
		</div>
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
		overflow: hidden;
		justify-content: center;
	}

	.card {
		display: inline-block;
		width: min(var(--other-card-width), var(--card-width));
		transition: width 0.175s ease-out;
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
	}

	.shrinkable, .not-shrinkable {
		display: contents;
	}

	.shrinkable:hover .card {
		width: min(var(--other-card-hover-width), var(--card-width));
	}

	.hand .card:hover {
		width: var(--card-width);
	}
	.card--last {
		width: var(--card-width);
		margin: 0;
		padding: 0;
	}
</style>
