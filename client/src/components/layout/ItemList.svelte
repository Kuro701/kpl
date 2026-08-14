<div class="item-list">
	<slot />
</div>

<style>
	.item-list {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: .5rem;
		align-items: center;
		color: var(--fg);
	}
</style>
