<script>

  import { ActiveTheme, Theme } from "../../lib/theme";

</script>
<div class="layout-game" class:dark-theme={$ActiveTheme === Theme.DARK}>
	<!-- <div class="layout-game__logo">
		<img src="/img/logo_white.png" alt="Logo" draggable="false" />
	</div> -->
	<div class="layout-game__content">
		<slot />
	</div>
</div>

<style>
	.layout-game {
		background: var(--blackish);
		height: 100vh;
		gap: 1.5rem;
		padding: 2rem;
		box-sizing: border-box;
		color: black;
	}
	.layout-game.dark-theme {
		background: var(--black);
		color: rgb(255 255 255 / 93%);
	}

	.layout-game__content {
		width: 100%;
		height: 100%;
		background-color: #f0eee6;
		border-radius: 1rem;
		box-sizing: border-box;
	}

	.dark-theme .layout-game__content {
		background-color: var(--blackish);
	}

</style>
