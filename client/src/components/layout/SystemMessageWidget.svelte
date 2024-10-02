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
		background-color: #f44336;
		color: white;
		text-align: center;
		padding: .25rem;
		z-index: 1000;
	}
</style>
