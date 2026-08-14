<script lang="ts">
	export let name: string | undefined = undefined;
	export let image: string | undefined = undefined;
</script>

<div class="player-widget">
	{#if image}
		<img class="player-widget__image" src={image} alt={name} draggable="false" referrerpolicy="no-referrer" />
	{:else}
		<div class="player-widget__image player-widget__image--placeholder">{'?'}</div>
	{/if}
	{#if name}
		<div class="player-widget__name" class:long={name.length > 11}>{name}</div>
	{/if}
</div>

<style>
	.player-widget {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.player-widget__image {
		width: 5rem;
		height: 5rem;
		border-radius: 2rem;
		object-fit: cover;
		background-color: var(--avatar-bg);
		border: 1px solid var(--border);
		box-sizing: border-box;
	}
	.player-widget__image--placeholder {
		background-color: var(--avatar-bg);
		border: 1px dashed var(--border-strong);
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 2rem;
		color: var(--muted);
	}

	.player-widget__name {
		font-size: 1rem;
		color: var(--fg);
	}
	/* .player-widget__name.long {
		font-size: 0.8rem;
	} */
</style>


