<script>
	import { PlayerIdentity } from "../../lib/networking/client";
	import { IngameRoom, RoomState } from "../../lib/networking/room";
	import { phoneMode } from "../../lib/phone-mode";
	import BlackCardWidget from "./BlackCardWidget.svelte";
	import BoardCzar from "./BoardCzar.svelte";
	import BoardPick from "./BoardPick.svelte";
	import BoardWhiteCards from "./BoardWhiteCards.svelte";
	import DeckPile from "./DeckPile.svelte";
	import Hand from "./Hand.svelte";
	import HandTouchscreen from "./HandTouchscreen.svelte";
	import Intermission from "./Intermission.svelte";
	import LobbyState from "./LobbyState.svelte";
</script>
<div class="board" class:board--touchscreen={$phoneMode}>
	<Intermission />

	{#if $IngameRoom?.state === RoomState.LOBBY}
		<LobbyState />
	{:else}
		{@const me = $IngameRoom?.players.find(p => p.uuid === $PlayerIdentity?.uuid)}
		{@const picking = $IngameRoom?.state === RoomState.PICK_WHITE}
		{@const iAmCzar = !!me?.isCzar}
		{@const iHavePlayed = picking && !!me?.hasPlayed}
		<!--
			You hold cards while you still have a play to make. The moment your
			cards are down — hasPlayed comes from the table itself, so it is the
			server's word, not a guess — the rest of the hand goes back on the
			pile rather than sitting there for the rest of the round with nothing
			left to do. The czar never gets a hand at all.
		-->
		{@const hideHand = !picking || iAmCzar || iHavePlayed}

		<BlackCardWidget />

		{#if picking && iAmCzar}
			<BoardCzar />
		{:else if picking}
			<BoardPick />
		{:else}
			<BoardWhiteCards />
		{/if}


		<!--
			The deck sits on the table for the whole game: it is where your hand
			is dealt from and where the cards you did not play go back to, so it
			has to be somewhere both ends of that journey can point at.

			The hand itself only exists when you have one. Without it — czar, or
			waiting on the czar — it used to collapse to zero height and leave a
			row of cards sliced off by the bottom of the screen. Now it is gone,
			and the board gets the space it was holding on to.
		-->
		<div class="deck-corner">
			<DeckPile />
		</div>

		{#if $phoneMode}
			{#if !hideHand}
				<div class="hand hand--flow">
					<HandTouchscreen hide={false} />
				</div>
			{/if}
		{:else}
			<!--
				Always mounted, and out of the flow, so that losing your hand is a
				thing the cards do rather than a hole the layout falls into: they
				fly back to the deck from exactly where they were sitting.
			-->
			<div class="hand">
				<Hand hide={hideHand} />
			</div>
		{/if}
	{/if}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		box-sizing: border-box;
		color: var(--fg);
		position: relative;
	}

	/* Out of the flow entirely, so the answers on the table keep the full width
	   of the board. It sits level with the black card, whose row is empty on
	   both sides at every width — the answers below it are never reached. */
	.deck-corner {
		position: absolute;
		/* Level with the black card: 1rem of board padding plus the 2rem the
		   timer occupies. The two of them are the same size and read as one
		   row. */
		top: 3rem;
		left: 1.5rem;
		z-index: 1;
	}

	/* Narrow enough that the deck would start crowding the middle. */
	@media (max-width: 68rem) {
		.deck-corner {
			display: none;
		}
	}
	.board--touchscreen {
		overflow: auto;
	}
	.hand {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 1rem;
		display: flex;
		justify-content: center;
		/* Clicks land on the cards, not on the empty width either side of them. */
		pointer-events: none;
	}
	.hand :global(.card) {
		pointer-events: auto;
	}

	.hand--flow {
		position: static;
		margin-top: auto;
		margin-bottom: 1rem;
		pointer-events: auto;
	}
</style>
