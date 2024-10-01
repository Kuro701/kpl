<script lang="ts">
	export let src: string;
	export let alt: string;
	export let text: string;
	export let horizontal: boolean = false;
</script>

<div
	class="pictogram"
	class:horizontal={horizontal}
	aria-label={alt}
	data-balloon-pos={horizontal ? 'left' : 'up'}
>
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
	.pictogram.horizontal {
		flex-direction: row;
		gap: 1rem;
	}

	.pictogram img {
		height: 2.5rem;
		width: 2.5rem;
	}
</style>
