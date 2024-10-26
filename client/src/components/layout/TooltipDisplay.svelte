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
		background-color: rgb(32, 32, 32);
		color: white;
		padding: 0.75em;
		border-radius: .75rem;
		position: absolute;
		font-size: 0.75rem;
		max-width: 15rem;
		transform: translate(-50%, calc(-100% - .5rem));
	}
</style>
