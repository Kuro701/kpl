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
		border: 1px solid #ccc;
		padding: .5rem;
		border-radius: .5rem;
		background-color: transparent;
		font: inherit;
		text-rendering: inherit;
		color: inherit;
		letter-spacing: inherit;
		word-spacing: inherit;
		text-align: inherit;
		transition: transform .2s ease-out;
		flex-direction: column;
	}

	.deck:hover {
		transform: translateX(.5rem);
	}
	.deck.deck--selected:hover {
		transform: translateX(-.5rem);
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
	}
	.deck__description {
		font-size: 0.9rem;
		font-weight: 300;
	}

	@media (max-width: 50rem) {
		.deck:hover, .deck.deck--selected {
			transform: none;
		}
	}
</style>
