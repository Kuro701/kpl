<script>
  import LayoutFullscreen from "./LayoutFullscreen.svelte";

</script>
<LayoutFullscreen>
	<div class="layout-game">
		<div class="layout-game__board">
			<slot />
		</div>
		<div class="layout-game__sidebar">
			<slot name="sidebar" />
		</div>
	</div>
</LayoutFullscreen>

<style>
	.layout-game {
		display: flex;
		height: 100%;
		background-color: var(--blackish);
	}
	.layout-game__board {
		flex: 1;
		box-sizing: border-box;
		background-color: #f0eee6;
	}
	.layout-game__sidebar {
		width: 20rem;
		background-color: #222;
		box-sizing: border-box;
		color: white;
	}
</style>
