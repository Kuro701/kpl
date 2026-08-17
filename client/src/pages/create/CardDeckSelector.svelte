<script lang="ts">
	import type { CardDeck } from "../../lib/networking/client";
	import CardDeckWidget from "./CardDeckWidget.svelte";

	export let value: number[];
	export let options: CardDeck[];

	$: available = options.filter(o => !value.includes(o.id));
	$: selected = options.filter(o => value.includes(o.id));

	function selectAll() {
		value = options.map(o => o.id);
	}

	function clearAll() {
		value = [];
	}
</script>

<div class="decks">
	<div class="decks-available">
		<div class="decks__head">
			<h3>Dostupné balíčky</h3>
			<button class="link" type="button" on:click={selectAll} disabled={available.length === 0}>
				Vybrat vše
			</button>
		</div>
		{#each available as deck}
			<CardDeckWidget value={deck} on:click={() => {
				value = [...value, deck.id];
			}} />
		{:else}
			<p class="info">Žádné další balíčky</p>
		{/each}
	</div>
	<div class="decks-selected">
		<div class="decks__head">
			<h3>Aktivní balíčky</h3>
			<button class="link" type="button" on:click={clearAll} disabled={selected.length === 0}>
				Zrušit vše
			</button>
		</div>
		{#each selected as deck}
			<CardDeckWidget value={deck} isSelected={true} on:click={() => {
				value = value.filter(id => id !== deck.id);
			}} />
		{:else}
			<p class="info">Vyberte alespoň jeden balíček</p>
		{/each}
	</div>
</div>


<style>
	.decks {
		width: 100%;
		display: flex;
		gap: 1rem;
		/*
		 * This was a hard 20rem with the columns scrolling inside it. With five
		 * packs the last one sat below the fold of a scroll area nested inside
		 * the page's own scroll area, so it was effectively unreachable — you
		 * could never move every pack across.
		 */
		align-items: flex-start;
	}
	.decks > div {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: .25rem;
		padding: 0 1rem 0 0;
	}

	.decks__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: .5rem;
	}

	.link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: .75rem;
		color: var(--accent-text);
		text-decoration: underline;
		text-underline-offset: .2em;
		cursor: var(--cursor-pointer);
		white-space: nowrap;
	}
	.link:hover:not(:disabled) {
		color: var(--accent-hover);
	}
	.link:disabled {
		color: var(--muted);
		text-decoration: none;
		cursor: var(--cursor-not-allowed);
		opacity: .6;
	}
	.decks > div.decks-selected {
		padding: 0 0 0 1rem;
	}

	.info {
		text-align: center;
		color: var(--muted);
		margin: .5rem 0;
	}

	@media (max-width: 50rem) {
		.decks {
			flex-direction: column-reverse;
		}
		.decks > div {
			padding: 0 !important;
		}
		.decks > div:first-child {
			padding-bottom: 1rem;
		}

		h3 {
			text-align: center;
		}
	}
</style>
