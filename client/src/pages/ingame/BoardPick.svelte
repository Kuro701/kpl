<script>
  import Card from "../../components/cards/Card.svelte";
  import { IngameRoom, SelectedCards } from "../../lib/networking/room";

</script>
<div class="picker">
	{#if $IngameRoom}
		{@const pickCount = $IngameRoom.table.black.pick}
		{#each Array($IngameRoom.table.black.pick) as _, i}
			{#if i < $SelectedCards.length}
				{@const card = $IngameRoom.hand.cards.find(c => c.id === $SelectedCards[i])}
				<Card
					black={false}
					show={!!card?.text}
					marked={false}
					text={card?.text ?? ''}
					tip={card?.tip ?? null}
				/>
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

	.card-shim {
		width: 12em;
		height: 15em;
		border: 2px dashed #888;
		border-radius: 5px;
		color: #888;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
