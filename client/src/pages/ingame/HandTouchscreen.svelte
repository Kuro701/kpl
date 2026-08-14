<script lang="ts">
	import { onMount } from "svelte";
	import Card from "../../components/cards/Card.svelte";
	import { HandCards, IngameRoom, pushSelectedCard, RoomState, SelectedCards, ServerResponseFn } from "../../lib/networking/room";

	export let hide = false;

	let elementWidth = 0;
	let wrapperElement: HTMLElement | null = null;

	let selectedCard: number | null = null;

	let selectionEnabled = false;
	$: selectionEnabled = $IngameRoom?.state === RoomState.PICK_WHITE && !!$ServerResponseFn && $SelectedCards.length < $IngameRoom.table.black.pick;

	function updateElementWidth() {
		if (!wrapperElement) return;

		elementWidth = wrapperElement.clientWidth;
	}

	onMount(updateElementWidth);

	function onCardClick(id: number) {
		if (!selectionEnabled) {
			selectedCard = null;
			return;
		}

		if (selectedCard === id) {
			pushSelectedCard(id);
			selectedCard = null;
		} else {
			selectedCard = id;
		}
	}
</script>

<svelte:window on:resize={updateElementWidth} />
<div
	class="hand"
	class:hide={hide}
	style={`--card-count: ${$HandCards.length}; --hand-width: ${elementWidth}px`}
	bind:this={wrapperElement}
>
	{#each $HandCards as card, i (card.id)}
		<button
			class="card"
			class:onBoard={$SelectedCards.includes(card.id)}
			on:click={() => onCardClick(card.id)}
		>
			<Card
				black={false}
				show={!hide}
				text={card.text}
				tip={card.tip}
				shrink={i !== $HandCards.length - 1}
				noMargin={true}
				marked={selectedCard === card.id}
			/>
		</button>
	{/each}
</div>

{#if selectedCard !== null}
	{@const card = $HandCards.find(c => c.id === selectedCard)}
	{#if selectedCard}
		<div class="card-confirm">
			<Card
				black={false}
				show={true}
				text={card?.text}
				tip={card?.tip}
			/>
			<div class="card-confirm__actions">
				<button class="button" on:click={() => {
					selectedCard = null;
				}}>
					Zrušit výběr
				</button>
				<button class="button" on:click={() => {
					if (!card) return;
					selectedCard = null;
					pushSelectedCard(card.id);
				}}>
					Potvrdit výběr
				</button>
			</div>
		</div>
	{/if}
{/if}


<style>
	.hand {
		display: flex;
		flex-direction: column;
		width: 100%;
		transition: transform .2s ease-out, height .2s ease-out;
	}

	.card {
		display: flex;
		transition: width 0.175s ease-out, transform 0.1s ease-out, opacity 0.1s ease-out;
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
		align-items: center;
		justify-content: center;
	}

	.card.onBoard {
		display: none;
		animation: card-used 1s ease-out;
	}

	.hand.hide {
		/* transform: translateY(-2rem); */
		height: 0rem;
	}

	.card-confirm {
		position: fixed;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: .25rem;
		align-items: center;
		background-color: rgb(5, 4, 10, .78);
		backdrop-filter: blur(3px);
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		justify-content: center;
	}
	.card-confirm__actions {
		display: flex;
		flex-direction: column-reverse;
		gap: .5rem;
	}
</style>
