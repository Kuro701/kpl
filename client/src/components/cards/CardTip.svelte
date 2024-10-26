<script lang="ts">
  import { onDestroy } from "svelte";
	import { tooltip } from "../../lib/tooltip";

	export let tip: string | null;

	function showTooltip() {
		tooltip.set(tip);
	}
	function hideTooltip() {
		tooltip.set(null);
	}

	onDestroy(() => {
		if ($tooltip === tip) {
			tooltip.set(null);
		}
	});
</script>

<button class="tooltip" on:click|stopPropagation={showTooltip} on:mouseenter={showTooltip} on:mouseleave={hideTooltip}></button>

<style>
	.tooltip {
		background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KCiA8Zz4KICA8dGl0bGU+YmFja2dyb3VuZDwvdGl0bGU+CiAgPHJlY3QgZmlsbD0ibm9uZSIgaWQ9ImNhbnZhc19iYWNrZ3JvdW5kIiBoZWlnaHQ9IjQwMiIgd2lkdGg9IjU4MiIgeT0iLTEiIHg9Ii0xIi8+CiA8L2c+CiA8Zz4KICA8dGl0bGU+TGF5ZXIgMTwvdGl0bGU+CiAgPHBhdGggZmlsbD0iIzk5OTk5OSIgaWQ9InN2Z18yIiBkPSJtMjU2LDMyYy0xMjMuNywwIC0yMjQsMTAwLjMgLTIyNCwyMjRzMTAwLjMsMjI0IDIyNCwyMjRjMTIzLjcsMCAyMjQsLTEwMC4zIDIyNCwtMjI0cy0xMDAuMywtMjI0IC0yMjQsLTIyNHptMjAuMiwzMjYuN2MtMC41LDE3LjggLTEzLjcsMjguOCAtMzAuOCwyOC4zYy0xNi40LC0wLjUgLTI5LjMsLTEyLjIgLTI4LjgsLTMwLjFjMC41LC0xNy44IDE0LjEsLTI5LjEgMzAuNSwtMjguNmMxNy4yLDAuNSAyOS43LDEyLjYgMjkuMSwzMC40em00OC43LC0xMjcuM2MtNC4yLDUuOSAtMTMuNiwxMy41IC0yNS40LDIyLjdsLTEzLjEsOWMtNi40LDQuOSAtMTAuNCwxMC43IC0xMi41LDE3LjNjLTEuMSwzLjUgLTEuOSwxMi42IC0yLjEsMTguN2MtMC4xLDEuMiAtMC44LDMuOSAtNC41LDMuOWMtMy43LDAgLTM1LDAgLTM5LjEsMGMtNC4xLDAgLTQuNiwtMi40IC00LjUsLTMuNmMwLjYsLTE2LjYgMywtMzAuMyA5LjksLTQxLjNjOS4zLC0xNC44IDM1LjUsLTMwLjQgMzUuNSwtMzAuNGM0LC0zIDcuMSwtNi4yIDkuNSwtOS43YzQuNCwtNiA4LC0xMi43IDgsLTE5LjljMCwtOC4zIC0yLC0xNi4yIC03LjMsLTIyLjhjLTYuMiwtNy43IC0xMi45LC0xMS40IC0yNS44LC0xMS40Yy0xMi43LDAgLTIwLjEsNi40IC0yNS40LDE0LjhjLTUuMyw4LjQgLTQuNCwxOC4zIC00LjQsMjcuM2wtNDguNywwYzAsLTM0IDguOSwtNTUuNyAyNy43LC02OC41YzEyLjcsLTguNyAyOC45LC0xMi41IDQ3LjgsLTEyLjVjMjQuOCwwIDQ0LjUsNC42IDYxLjksMTcuOGMxNi4xLDEyLjIgMjQuNiwyOS40IDI0LjYsNTIuNmMwLDE0LjMgLTUsMjYuMyAtMTIuMSwzNnoiLz4KIDwvZz4KPC9zdmc+');
		background-size: 100%;
		width: 15px;
		height: 15px;
		position: absolute;
		top: 3px;
		border: none;
		right: 3px;
	}
</style>
