<script>
	import Card from "../../components/cards/Card.svelte";
	import { IngameRoom, SelectedCards, reshuffleHand } from "../../lib/networking/room";
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

<!--
	The free swap. Only here when the server says so — after everyone has been
	czar once, before you have played, and not for the czar. It disappears the
	moment you use it, so there is nothing to explain about how many are left.
-->
{#if $IngameRoom?.canReshuffle}
	<div class="swap">
		<button class="swap__btn" on:click={reshuffleHand}>
			Vyměnit karty
		</button>
		<span class="swap__note">jednou za kolo</span>
	</div>
{/if}

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

	.swap {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: .6rem;
		margin-top: .6rem;
	}
	.swap__btn {
		padding: .42rem 1rem;
		border-radius: calc(var(--radius) / 2);
		border: 1px solid rgb(var(--accent-rgb) / .5);
		background: rgb(var(--accent-rgb) / .1);
		color: var(--accent-text);
		font: inherit;
		font-size: .82rem;
		letter-spacing: .04em;
		cursor: pointer;
		transition: background .18s, border-color .18s;
	}
	.swap__btn:hover {
		background: rgb(var(--accent-rgb) / .22);
		border-color: rgb(var(--accent-rgb) / .85);
	}
	.swap__note {
		font-size: .72rem;
		opacity: .5;
	}

	.card-shim {
		width: 12em;
		height: 15em;
		border: 2px dashed var(--accent-dim);
		border-radius: var(--radius);
		color: var(--accent-text);
		background-color: rgb(var(--accent-rgb) / .06);
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
