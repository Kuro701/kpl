<script lang="ts">
	import Card from "../../components/cards/Card.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { BoardCards, IngameRoom, RoomState, ServerResponseFn } from "../../lib/networking/room";

	function onCardGroupClick(id: string) {
		const playerIsCzar = $IngameRoom?.players.some(p => p.isCzar && p.uuid === $PlayerIdentity?.uuid);
		const isCzarRound = $IngameRoom?.state === RoomState.PICK_CZAR;
		const reply = $ServerResponseFn;
		const isClickable = playerIsCzar && isCzarRound && !!reply;
		if (!isClickable) return;

		console.log("Clicked on card group", id);

		reply(id);
	}

</script>

<div class="cards">
	{#each $BoardCards as cardGroup (cardGroup.id)}
		<button class="card-group" on:click={() => onCardGroupClick(cardGroup.id)}>
			{#each cardGroup.cards as card, i (card.id)}
				<div class="card">
					<Card
						black={false}
						show={true}
						text={card.text}
						shrink={i !== cardGroup.cards.length - 1}
						noMargin={true}
						marked={!!$IngameRoom && (cardGroup.id === $IngameRoom.table.lastRoundWinnerGroupId)}
					/>
				</div>
			{/each}
		</button>

	{/each}
</div>

<style>
	.cards {
		display: flex;
		flex-direction: row;
		overflow: auto;
		gap: .5rem;
		padding-bottom: .5rem;
		height: fit-content;
		margin-top: 2rem;
		justify-content: center;
	}

	.card-group {
		display: flex;
		flex-direction: column;
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

	.card {
		cursor: var(--cursor-pointer);
	}
</style>
