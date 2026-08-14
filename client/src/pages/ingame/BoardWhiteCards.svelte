<script lang="ts">
	import Card from "../../components/cards/Card.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { BoardCards, IngameRoom, RoomState, ServerResponseFn } from "../../lib/networking/room";
	import { phoneMode } from "../../lib/phone-mode";

	$: playerIsCzar = $IngameRoom?.players.some(p => p.isCzar && p.uuid === $PlayerIdentity?.uuid);
	function onCardGroupClick(id: string) {
		const isCzarRound = $IngameRoom?.state === RoomState.PICK_CZAR;
		const reply = $ServerResponseFn;
		const isClickable = playerIsCzar && isCzarRound && !!reply;
		if (!isClickable) return;

		reply(id);
	}

</script>

{#if $IngameRoom?.state === RoomState.PICK_CZAR}
	<div class="czar">
		{#if playerIsCzar}
			Vaše veličensto, <b>vyberte vítěznou kartu</b>
		{:else}
			Císař <b>{$IngameRoom?.players.find(x => x.isCzar)?.username || ''}</b> vybírá vítěznou kartu
		{/if}
	</div>
{/if}
<div class="cards" class:cards--touchmode={$phoneMode}>
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
						tip={card.tip}
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
		margin-top: 1rem;
		justify-content: center;
	}
	.cards--touchmode {
		flex-direction: column;
		align-items: center;
		height: auto;
		overflow: visible;
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
	.card-group:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: var(--radius);
	}

	.card {
		cursor: var(--cursor-pointer);
	}

	.czar {
		text-align: center;
		margin-top: 1rem;
		color: var(--fg);
	}
	.czar b {
		color: var(--accent-text);
	}
</style>
