<div class="columns">
	<div>
		<slot name="left" />
	</div>
	<div>
		<slot name="right" />
	</div>
</div>

<style>
	.columns {
		width: 100%;
		display: flex;
		flex-direction: row;
		gap: 1rem;
		color: var(--fg);
	}
	.columns > div {
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 50rem) {
		.columns {
			flex-direction: column;
		}
	}
</style>
