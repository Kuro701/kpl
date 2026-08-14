<script lang="ts">
	export let white: number;
	export let black: number;
</script>

<div class="card-count">
	<div class="card-count__black">{black}</div>
	<div class="card-count__white">{white}</div>
</div>

<style>
	.card-count {
		border-radius: var(--radius);
		border: 1px solid var(--border-strong);
		display: flex;
		width: fit-content;
		overflow: hidden;
		font-size: .75em;
		font-family: var(--font-mono);
		font-weight: 600;
		line-height: 1;
	}
	.card-count__black {
		padding: .25rem .7rem;
		background-color: var(--black);
		color: var(--fg);
	}
	.card-count__white {
		padding: .25rem .5rem;
		background-color: var(--fg);
		color: var(--black);
	}

</style>
