<script>

  import { ActiveTheme, Theme } from "../../lib/theme";

</script>
<div class="layout-fullscreen" class:dark-theme={$ActiveTheme === Theme.DARK}>
	<div class="layout-fullscreen__content">
		<slot />
	</div>
</div>

<style>
	.layout-fullscreen {
		background: var(--blackish);
		height: 100vh;
		gap: 1.5rem;
		padding: 2rem;
		box-sizing: border-box;
		color: black;
	}
	.layout-fullscreen.dark-theme {
		background: var(--black);
		color: rgb(255 255 255 / 93%);
	}

	.layout-fullscreen__content {
		width: 100%;
		height: 100%;
		background-color: #f0eee6;
		border-radius: 1rem;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}

	.dark-theme .layout-fullscreen__content {
		background-color: var(--blackish);
	}

	@media screen and (max-width:1199px) {
		.layout-fullscreen {
			padding: 0rem;
		}
		.layout-fullscreen__content {
			border-radius: 0;
		}
	}
</style>
