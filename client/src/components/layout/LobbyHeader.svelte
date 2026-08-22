<div class="lobby-header">
	<div>
		<slot name="left" />
	</div>
	<div class="lobby-header__title">
		<span class="rule"></span>
		<slot />
		<span class="rule rule--r"></span>
	</div>
	<div>
		<slot name="right" />
	</div>
</div>

<style>
	.lobby-header {
		display: flex;
		justify-content: center;
		padding: 1rem;
		align-items: center;
		border-bottom: 1px solid var(--border);
		color: var(--fg);
	}
	.lobby-header > div {
		display: flex;
		align-items: center;
	}
	.lobby-header > div:first-child {
		justify-content: flex-start;
		flex: 1;
	}
	.lobby-header > div:nth-child(2) {
		justify-content: center;
	}
	.lobby-header > div:last-child {
		justify-content: flex-end;
		flex: 1;
	}

	.lobby-header :global(h1)  {
		margin: 0;
		color: var(--fg);
	}

	/* A hairline running out from each side of the title, tipped with a small
	   diamond — the divider motif from the frame artwork. */
	.lobby-header__title {
		gap: 1rem;
	}
	.rule {
		flex: 0 0 4.5rem;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgb(var(--accent-rgb) / .7));
		position: relative;
	}
	.rule--r {
		background: linear-gradient(90deg, rgb(var(--accent-rgb) / .7), transparent);
	}
	.rule::after {
		content: "";
		position: absolute;
		right: -3px;
		top: -2px;
		width: 5px;
		height: 5px;
		background: var(--accent);
		transform: rotate(45deg);
	}
	.rule--r::after {
		right: auto;
		left: -3px;
	}

	@media (max-width: 50rem) {
		.rule { display: none; }
	}
</style>
