<script>
	import { IngameRoom } from "../../lib/networking/room";
	import BlackCardWidget from "./BlackCardWidget.svelte";
	import Hand from "./Hand.svelte";
	import Intermission from "./Intermission.svelte";
  import LobbyState from "./LobbyState.svelte";
</script>
<div class="board">
	<Intermission />

	{#if $IngameRoom?.state === 'lobby'}
		<LobbyState />
	{:else}
		<BlackCardWidget />

		<div class="hand">
			<Hand />
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
