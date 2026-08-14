<script lang="ts">
  import { tooltip } from "../../lib/tooltip";

	let x = 0;
	let y = 0;
</script>

<svelte:window on:mousemove={({clientX, clientY}) => {x = clientX; y = clientY}} />

{#if $tooltip}
	<div class="tooltip" style={`top:${y + 1}px;left:${x}px`}>
		{$tooltip}
	</div>
{/if}

<style>
	.tooltip {
		background-color: var(--panel-raised);
		border: 1px solid var(--border-strong);
		color: var(--fg);
		padding: 0.75em;
		border-radius: var(--radius);
		box-shadow: 0 .5rem 1.5rem rgba(0, 0, 0, .55);
		position: absolute;
		font-size: 0.75rem;
		line-height: 1.35;
		max-width: 15rem;
		pointer-events: none;
		transform: translate(-50%, calc(-100% - .5rem));
	}
</style>
