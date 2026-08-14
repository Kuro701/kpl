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
		background-color: var(--bg);

		--sidebar-size: 20rem;
	}
	.layout-game__board {
		width: calc(100% - var(--sidebar-size));
		box-sizing: border-box;
		color: var(--fg);
		background-color: #0d0918;
		background-image:
			radial-gradient(120% 90% at 12% 0%, rgba(84, 42, 150, .55), transparent 55%),
			radial-gradient(80% 70% at 95% 100%, rgba(236, 72, 153, .16), transparent 60%);
		background-repeat: no-repeat;
	}
	.layout-game__sidebar {
		width: var(--sidebar-size);
		background-color: var(--bg-deep);
		border-left: 1px solid var(--accent-dim);
		box-sizing: border-box;
		color: var(--fg);
	}

	@media screen and (max-width:1199px) {
		.layout-game {
			--sidebar-size: 4rem;
		}
	}
</style>
