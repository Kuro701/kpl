<script>
  import { PlayerIdentity } from "../../lib/networking/client";
	import { IngameRoom, RoomState } from "../../lib/networking/room";
	import BlackCardWidget from "./BlackCardWidget.svelte";
	import BoardCzar from "./BoardCzar.svelte";
  import BoardPick from "./BoardPick.svelte";
	import BoardWhiteCards from "./BoardWhiteCards.svelte";
	import Hand from "./Hand.svelte";
	import Intermission from "./Intermission.svelte";
  import LobbyState from "./LobbyState.svelte";
</script>
<div class="board">
	<Intermission />

	{#if $IngameRoom?.state === RoomState.LOBBY}
		<LobbyState />
	{:else}
		<BlackCardWidget />

		{#if $IngameRoom?.state === RoomState.PICK_WHITE && $IngameRoom.players.some(p => p.isCzar && p.uuid === $PlayerIdentity?.uuid)}
			<BoardCzar />
		{:else if $IngameRoom?.state === RoomState.PICK_WHITE}
			<BoardPick />
		{:else}
			<BoardWhiteCards />
		{/if}

		<div class="hand">
			<Hand hide={($IngameRoom?.state === RoomState.PICK_CZAR) || ($IngameRoom?.players.some(p => p.isCzar && p.uuid === $PlayerIdentity?.uuid))} />
		</div>
	{/if}
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;
		box-sizing: border-box;

	}
	.hand {
		display: flex;
		justify-content: center;
		margin-top: auto;
		margin-bottom: 1rem;
	}
</style>
