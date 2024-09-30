<script lang="ts">
	export let src: string;
	export let alt: string;
	export let text: string;
</script>

<div class="pictogram" aria-label={alt} data-balloon-pos="up">
	<div>
		<img src={src} alt={alt} draggable="false" />
	</div>
	<div class="pictogram__name">{text}</div>
</div>

<style>
	.pictogram {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: .254rem;
	}
	.pictogram img {
		height: 2.5rem;
		width: 2.5rem;
	}
</style>
