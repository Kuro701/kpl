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
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}
	.columns > div {
		flex: 1;
	}
</style>
