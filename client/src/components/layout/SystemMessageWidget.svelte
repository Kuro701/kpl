<script lang="ts">
  import { SystemMessage } from "../../lib/networking/system-message";


</script>

{#if $SystemMessage}
	<div class="system-warning-message">
		{$SystemMessage}
	</div>
{/if}

<style>
	.system-warning-message {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		background-color: rgba(255, 107, 129, .14);
		border-bottom: 1px solid var(--danger);
		box-sizing: border-box;
		color: var(--danger);
		font-size: .85rem;
		font-weight: 500;
		text-align: center;
		padding: .35rem .25rem;
		backdrop-filter: blur(6px);
		z-index: 1000;
	}
</style>
