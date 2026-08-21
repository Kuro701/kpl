<script lang="ts">
  import { link } from "svelte-routing";
  import { ActiveTheme, Theme } from "../../lib/theme";
  import { APP_VERSION } from "../../lib/version";

  /*
   * The server this deck belongs to. Drop the invite in here and the footer
   * turns the name into a link; leave it empty and it stays plain text.
   */
  const COMMUNITY_NAME = 'Mytheder';
  const COMMUNITY_DISCORD: string = '';
</script>

<div class="layout-menu" class:dark-theme={$ActiveTheme === Theme.DARK}>
	<a href="/" use:link>
		<div class="layout-menu__logo">
			<img src="/img/logo_white.png" alt="Mytheder" draggable="false" />
		</div>
	</a>
	<div class="layout-menu__content">
		<slot />
	</div>
	<div class="layout-menu__footer">
		<div>
			<div>Made by <span class="maker">Kuro Software</span></div>
			<div class="version">V:{APP_VERSION}</div>
		</div>
		<div>
			<a href="https://instagram.com/6Kuro_Labs9" target="_blank" rel="noopener noreferrer">
				@6Kuro_Labs9
			</a>
		</div>
		<div>
			{#if COMMUNITY_DISCORD}
				<a href={COMMUNITY_DISCORD} target="_blank" rel="noopener noreferrer">
					{COMMUNITY_NAME}
				</a>
			{:else}
				{COMMUNITY_NAME}
			{/if}
		</div>
	</div>
</div>

<style>
	.layout-menu {
		background-color: var(--bg);
		background-image:
			radial-gradient(60rem 38rem at 50% 30%, rgb(var(--accent-rgb) / .13), transparent 70%),
			radial-gradient(34rem 26rem at 84% 92%, rgb(var(--accent-2-rgb) / .10), transparent 72%),
			radial-gradient(30rem 24rem at 14% 88%, rgb(var(--ember-rgb) / .06), transparent 72%);
		background-repeat: no-repeat;
		color: var(--fg);
		height: 100vh;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}
	.layout-menu.dark-theme {
		background-color: var(--bg-deep);
		color: var(--fg);
	}

	.layout-menu__content {
		background: var(--panel);
		border: 1px solid var(--accent-dim);
		border-radius: var(--radius-lg);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, .35),
			0 1.5rem 3.5rem rgba(0, 0, 0, .55),
			var(--accent-glow);
		width: 60rem;
		max-width: calc(100% - 1rem);
		max-height: calc(100vh - 14.5rem); /* 2*1,5rem (gaps) 5rem (logo) 1,5rem (footer padding) 5ren (foorer) */
		overflow: hidden auto;
	}
	.layout-menu__logo {
		text-align: center;
	}
	.layout-menu__logo img {
		max-height: 5rem;
		max-width: calc(100% - 2rem);
		width: 100%;
		margin-top: 1rem;
		filter: drop-shadow(0 0 18px rgb(var(--accent-rgb) / .35));
	}
	.dark-theme .layout-menu__content {
		background: var(--panel);
	}

	.layout-menu__footer {
		color: var(--muted);
		font-size: .9rem;
		display: flex;
		gap: 1rem;
		padding-top: 1.5rem;
		cursor: var(--cursor-text);
		flex-wrap: wrap;
		/* The maker cell is two lines tall now; hang the dividers from the top
		   rather than letting them centre against it. */
		align-items: flex-start;
	}
	.layout-menu__footer > div {
		border-right: 1px solid var(--border);
		padding-right: 1rem;
	}
	.layout-menu__footer > div:last-child {
		border-right: none;
		padding-right: 0;
	}

	.layout-menu__footer .maker {
		color: var(--fg);
		font-weight: 500;
	}

	.layout-menu__footer .version {
		margin-top: .1rem;
		font-size: .72rem;
		letter-spacing: .06em;
		color: var(--muted);
		opacity: .75;
	}

	.layout-menu__footer a {
		color: var(--muted);
		text-decoration: underline;
		text-underline-offset: .18em;
		transition: color .16s ease;
	}
	.layout-menu__footer a:hover {
		color: var(--accent-text);
	}

	@media (max-width: 60rem) {
		.layout-menu {
			height: auto;
		}

		.layout-menu__content {
			height: fit-content;
			max-height: initial;
		}

		.layout-menu__footer {
			gap: .5rem;
			padding-top: 0rem;
			text-align: center;
			flex-direction: column;
		}
		.layout-menu__footer > div {
			border-right: none;
			padding-right: 0;
		}
	}
</style>
