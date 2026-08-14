<script>
	import Card from "../../components/cards/Card.svelte";
	import { IngameRoom, SelectedCards } from "../../lib/networking/room";
	import { phoneMode } from "../../lib/phone-mode";

</script>
<div class="picker" class:touchscreen={$phoneMode}>
	{#if $IngameRoom}
		{@const pickCount = $IngameRoom.table.black.pick}
		{#each Array($IngameRoom.table.black.pick) as _, i}
			{#if i < $SelectedCards.length}
				{#if $phoneMode}
					<div class="card-shim">
						Karta vybrána
					</div>
				{:else}
					{@const card = $IngameRoom.hand.cards.find(c => c.id === $SelectedCards[i])}
					<Card
						black={false}
						show={!!card?.text}
						marked={false}
						text={card?.text ?? ''}
						tip={card?.tip ?? null}
					/>
				{/if}
			{:else}
				<div class="card-shim">
					Vyber kartu {i + 1}/{pickCount}
				</div>
			{/if}
		{/each}
	{/if}
</div>

<style>
	.picker {
		display: flex;
		justify-content: center;
		margin-top: .5rem;
		flex-direction: row;
		gap: .5rem;
	}
	.picker.touchscreen {
		flex-direction: column;
		padding-bottom: 1rem;
		align-items: center;
	}

	.card-shim {
		width: 12em;
		height: 15em;
		border: 2px dashed var(--accent-dim);
		border-radius: var(--radius);
		color: var(--accent-text);
		background-color: rgba(180, 108, 245, .06);
		box-sizing: border-box;
		text-align: center;
		padding: 0 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.picker.touchscreen .card-shim {
		height: fit-content;
		padding-top: 1rem;
		padding-bottom: 1rem;
	}
</style>
