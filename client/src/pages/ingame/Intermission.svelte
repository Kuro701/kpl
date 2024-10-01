<script lang="ts">
	import { onDestroy } from "svelte";
	import { IngameRoom } from "../../lib/networking/room";


	let intermissionProgress = 0;
	let intermissionInterval: number | null = null;

	onDestroy(() => {
		if (intermissionInterval) {
			clearInterval(intermissionInterval);
		}
	});

	function updateIntermission(start: Date | null, end: Date | null) {
		if (intermissionInterval) {
			clearInterval(intermissionInterval);
		}

		if (!start || !end) {
			intermissionProgress = 0;
			return;
		}

		const total = end.getTime() - start.getTime();
		intermissionInterval = setInterval(() => {
			const now = Date.now();
			intermissionProgress = Math.min(1, (now - start.getTime()) / total);

			if (now >= end.getTime() && intermissionInterval) {
				intermissionProgress = 0;
				clearInterval(intermissionInterval);
			}
		}, 20);
	}
	$: updateIntermission($IngameRoom?.intermissionStart ?? null, $IngameRoom?.intermissionEnd ?? null);
</script>

<div class="intermission">
	{#if intermissionProgress > 0}
		<div class="intermission-bar" style={`--progress: ${100 - (intermissionProgress*100)}%`}>
			<div class="intermission-bar__progress"></div>
		</div>
	{/if}
</div>

<style>
	.intermission {
		padding: .5rem 1rem;
		height: 2rem;
	}

	.intermission-bar {
		border-radius: 1rem;
		background-color: #ccc;
		width: 100%;
		height: 0.375rem;
		overflow: hidden;
	}
	.intermission-bar__progress {
		height: 100%;
		width: var(--progress, 0%);
		background-color: #03a9f4;
	}
</style>
