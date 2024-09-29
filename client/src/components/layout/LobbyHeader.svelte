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
	}
	.lobby-header > div {
		flex: 1;
		display: flex;
		align-items: center;
	}
	.lobby-header > div:first-child {
		justify-content: flex-start;
	}
	.lobby-header > div:nth-child(2) {
		justify-content: center;
	}
	.lobby-header > div:last-child {
		justify-content: flex-end;
	}

	.lobby-header :global(h1)  {
		margin: 0;
	}
</style>
