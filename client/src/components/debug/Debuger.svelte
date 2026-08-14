<script lang="ts">
	const isDebug = import.meta.env.MODE === 'development';
	let show = false;
</script>

<svelte:window on:keydown={e => {
	if (e.key === 'F1') {
		e.preventDefault();
		show = !show;
	}
}} />

{#if isDebug}
	<div class="debuger">
		{#if show}
			<slot />
		{:else}
			F1
		{/if}
	</div>
{/if}

<style>
	.debuger {
		position: fixed;
		top: 0;
		right: 0;
		background: rgba(8, 6, 14, .82);
		border-left: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		border-bottom-left-radius: var(--radius);
		color: var(--fg);
		font-family: var(--font-mono);
		font-size: .75rem;
		padding: .5rem;
		backdrop-filter: blur(6px);
		z-index: 1000;
		max-height: 100vh;
		overflow: auto;
	}
</style>
