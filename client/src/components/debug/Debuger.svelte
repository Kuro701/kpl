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
		background: rgba(0, 0, 0, .5);
		color: white;
		padding: .5rem;
		z-index: 1000;
		max-height: 100vh;
		overflow: auto;
	}
</style>
