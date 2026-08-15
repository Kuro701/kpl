<script lang="ts">
	import Card from "../../components/cards/Card.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { BoardCards, IngameRoom, RoomState, ServerResponseFn } from "../../lib/networking/room";
	import { phoneMode } from "../../lib/phone-mode";

	$: playerIsCzar = $IngameRoom?.players.some(p => p.isCzar && p.uuid === $PlayerIdentity?.uuid);

	/*
	 * The reveal. Once the czar has decided, every losing card flips face down
	 * so the winner is the only thing left on the table, with the name of
	 * whoever played it underneath — until now nobody ever learned who wrote
	 * the line that won.
	 */
	$: winnerGroupId = $IngameRoom?.table.lastRoundWinnerGroupId ?? null;
	$: revealing = !!winnerGroupId;
	$: winnerName = $IngameRoom?.table.lastRoundWinner?.username ?? '';
	function onCardGroupClick(id: string) {
		const isCzarRound = $IngameRoom?.state === RoomState.PICK_CZAR;
		const reply = $ServerResponseFn;
		const isClickable = playerIsCzar && isCzarRound && !!reply;
		if (!isClickable) return;

		reply(id);
	}

</script>

<!-- Once the winner is out, the 'czar is deciding' line is stale noise. -->
{#if $IngameRoom?.state === RoomState.PICK_CZAR && !revealing}
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
		{@const isWinner = cardGroup.id === winnerGroupId}
		<button
			class="card-group"
			class:card-group--faded={revealing && !isWinner}
			class:card-group--winner={revealing && isWinner}
			on:click={() => onCardGroupClick(cardGroup.id)}
		>
			{#each cardGroup.cards as card, i (card.id)}
				<div class="card">
					<Card
						black={false}
						show={!revealing || isWinner}
						text={card.text}
						shrink={i !== cardGroup.cards.length - 1}
						noMargin={true}
						marked={isWinner}
						tip={card.tip}
					/>
				</div>
			{/each}

			{#if revealing && isWinner && winnerName}
				<div class="winner-name">{winnerName}</div>
			{/if}
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

	.card-group {
		transition: opacity .3s ease, transform .3s ease;
	}
	.card-group--faded {
		opacity: .45;
		transform: scale(.94);
	}
	.card-group--winner {
		transform: translateY(-.5rem);
	}

	.winner-name {
		margin-top: .6rem;
		text-align: center;
		font-weight: 600;
		color: var(--accent-text);
		text-shadow: var(--accent-glow);
		animation: winner-in .3s ease-out;
	}

	@keyframes winner-in {
		from { opacity: 0; transform: translateY(-.4rem); }
		to   { opacity: 1; transform: translateY(0); }
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
