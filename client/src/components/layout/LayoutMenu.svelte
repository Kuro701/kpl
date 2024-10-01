<script lang="ts">
  import { link } from "svelte-routing";
  import { ActiveTheme, Theme } from "../../lib/theme";

	const yearNow = new Date().getFullYear();
</script>

<div class="layout-menu" class:dark-theme={$ActiveTheme === Theme.DARK}>
	<a href="/" use:link>
		<div class="layout-menu__logo">
			<img src="/img/logo_white.png" alt="Logo" draggable="false" />
		</div>
	</a>
	<div class="layout-menu__content">
		<slot />
	</div>
	<div class="layout-menu__footer">
		<div>Hosted by <a href="https://link.helkor.eu/from-kpl" target="_blank">Helkor.eu</a></div>
		<div>By <a href="https://negix.eu/" target="_blank">Negix</a> with ❤️ and a lot of ☕</div>
		<div>2018 - {yearNow}</div>
	</div>
</div>

<style>
	.layout-menu {
		background: var(--blackish);
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}
	.layout-menu.dark-theme {
		background: var(--black);
		color: rgb(255 255 255 / 93%);
	}

	.layout-menu__content {
		background: white;
		border-radius: .5rem;
		width: 60rem;
		max-height: calc(100vh - 14.5rem); /* 2*1,5rem (gaps) 5rem (logo) 1,5rem (footer padding) 5ren (foorer) */
		overflow: hidden auto;
	}
	.layout-menu__logo img {
		height: 5rem;
	}
	.dark-theme .layout-menu__content {
		background: var(--blackish);
	}

	.layout-menu__footer {
		color: var(--white-transparency);
		font-size: .9rem;
		display: flex;
		gap: 1rem;
		padding-top: 1.5rem;
		cursor: var(--cursor-text);
	}
	.layout-menu__footer > div {
		border-right: 1px solid var(--white-transparency);
		padding-right: 1rem;
	}
	.layout-menu__footer > div:last-child {
		border-right: none;
		padding-right: 0;
	}

	.layout-menu__footer a {
		color: var(--white-transparency);
		text-decoration: underline;
	}
	.layout-menu__footer a:hover {
		color: var(--white);
	}
</style>
