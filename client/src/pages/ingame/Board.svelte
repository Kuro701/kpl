<script>
	import BlackCardWidget from "./BlackCardWidget.svelte";
	import Hand from "./Hand.svelte";
	import Intermission from "./Intermission.svelte";
</script>
<div class="board">
	<Intermission />
	<BlackCardWidget />

	<div class="hand">
		<Hand />
	</div>
</div>

<style>
	.board {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 1rem;

	}
	.hand {
		display: flex;
		justify-content: center;
		margin-top: auto;
		margin-bottom: 2rem;
	}
</style>
