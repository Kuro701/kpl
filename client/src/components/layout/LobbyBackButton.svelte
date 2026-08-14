<script lang="ts">
	export let action: () => void;
</script>

<button class="button button--social" on:click={action} aria-label="Zpět" data-balloon-pos="down">
	<img src="/img/icons/back.png" alt="Zpět" draggable="false" />
</button>

<style>
	.button--social img {
		filter: invert(1);
		transition: transform .16s ease;
	}
	.button--social:hover img {
		transform: translateX(-.15rem);
	}
</style>

