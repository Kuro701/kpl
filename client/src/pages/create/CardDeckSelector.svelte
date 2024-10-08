<script lang="ts">
	import type { CardDeck } from "../../lib/networking/client";
	import CardDeckWidget from "./CardDeckWidget.svelte";

	export let value: number[];
	export let options: CardDeck[];


</script>

<div class="decks">
	<div class="decks-available">
		<h3>Dostupné balíčky</h3>
		{#each options.filter(o => !value.includes(o.id)) as deck}
			<CardDeckWidget value={deck} on:click={() => {
				value = [...value, deck.id];
			}} />
		{/each}
	</div>
	<div class="decks-selected">
		<h3>Aktivní balíčky</h3>
		{#each options.filter(o => value.includes(o.id)) as deck}
			<CardDeckWidget value={deck} isSelected={true} on:click={() => {
				value = value.filter(id => id !== deck.id);
			}} />
		{/each}
	</div>
</div>


<style>
	.decks {
		width: 100%;
		display: flex;
		gap: 1rem;
		height: 20rem;
	}
	.decks > div {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: .25rem;
		overflow: hidden auto;
		padding: 0 1rem 0 0;
	}
	.decks > div.decks-selected {
		padding: 0 0 0 1rem;
	}
</style>
