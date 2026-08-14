<div class="lobby-header">
	<div>
		<slot name="left" />
	</div>
	<div>
		<slot />
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
</style>
