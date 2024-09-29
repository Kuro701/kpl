<script lang="ts">
	export let action: () => void;
</script>

<button class="button button--social" on:click={action} aria-label="Zpět" data-balloon-pos="down">
	<img src="/img/icons/back.png" alt="Zpět" draggable="false" />
</button>


