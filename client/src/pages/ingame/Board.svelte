<script>
  import { PlayerIdentity } from "../../lib/networking/client";
	import { IngameRoom, RoomState } from "../../lib/networking/room";
	import BlackCardWidget from "./BlackCardWidget.svelte";
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
		<BoardWhiteCards />

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
