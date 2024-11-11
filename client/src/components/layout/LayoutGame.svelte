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

		--sidebar-size: 20rem;
	}
	.layout-game__board {
		width: calc(100% - var(--sidebar-size));
		box-sizing: border-box;
		background-color: #f0eee6;
	}
	.layout-game__sidebar {
		width: var(--sidebar-size);
		background-color: #222;
		box-sizing: border-box;
		color: white;
	}

	@media screen and (max-width:1199px) {
		.layout-game {
			--sidebar-size: 4rem;
		}
	}
</style>
