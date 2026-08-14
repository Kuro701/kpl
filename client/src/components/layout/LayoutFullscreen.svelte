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
		background-color: var(--bg);
		background-image: radial-gradient(70rem 44rem at 50% 0%, rgba(229, 50, 45, .13), transparent 70%);
		background-repeat: no-repeat;
		height: 100vh;
		gap: 1.5rem;
		padding: 2rem;
		box-sizing: border-box;
		color: var(--fg);
	}
	.layout-fullscreen.dark-theme {
		background-color: var(--bg-deep);
		color: var(--fg);
	}

	.layout-fullscreen__content {
		width: 100%;
		height: 100%;
		background-color: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: 0 1.5rem 3.5rem rgba(0, 0, 0, .5);
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}

	.dark-theme .layout-fullscreen__content {
		background-color: var(--panel);
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
