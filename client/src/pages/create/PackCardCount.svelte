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
		border-radius: .5rem;
		border: 1px solid #000;
		display: flex;
		width: fit-content;
		overflow: hidden;
		font-size: .75em;
	}
	.card-count__black {
		padding: .25rem .7rem;
		background-color: #000;
		color: #fff;
	}
	.card-count__white {
		padding: .25rem .5rem;
	}

</style>
