<script lang="ts">
	import type { CardDeck } from "../../lib/networking/client";
	import PackCardCount from "./PackCardCount.svelte";

	export let value: CardDeck;
	export let isSelected: boolean = false;
</script>

<button class="deck" class:deck--selected={isSelected} on:click>
	<div class="deck__header">
		<div class="deck__name">
			{value.name}
		</div>
		<div class="deck__card-count">
			<PackCardCount white={value.whiteCardCount} black={value.blackCardCount} />
		</div>
	</div>

	<div class="deck__description">
		{value.description}
	</div>
</button>

<style>
	.deck {
		display: flex;
		justify-content: space-between;
		gap: .75rem;
		border: 1px solid var(--border);
		padding: .5rem;
		border-radius: var(--radius);
		background-color: var(--surface);
		font: inherit;
		text-rendering: inherit;
		color: var(--fg);
		letter-spacing: inherit;
		word-spacing: inherit;
		text-align: inherit;
		transition: transform .2s ease-out, background-color .16s ease, border-color .16s ease, box-shadow .16s ease;
		flex-direction: column;
	}

	.deck:hover {
		transform: translateX(.5rem);
		background-color: var(--surface-hover);
		border-color: var(--border-strong);
	}

	.deck.deck--selected {
		background-color: var(--chip-bg-hover);
		border-color: var(--accent);
		box-shadow: var(--accent-glow);
	}
	.deck.deck--selected:hover {
		transform: translateX(-.5rem);
		border-color: var(--accent-hover);
	}

	.deck__header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		gap: .5rem;
		width: 100%;
	}
	.deck__name {
		font-weight: 500;
		font-size: .9rem;
		flex: 1;
		color: var(--fg);
	}
	.deck.deck--selected .deck__name {
		color: var(--accent-text);
	}
	.deck__description {
		font-size: 0.9rem;
		font-weight: 300;
		color: var(--muted);
	}

	@media (max-width: 50rem) {
		.deck:hover, .deck.deck--selected {
			transform: none;
		}
	}
</style>
