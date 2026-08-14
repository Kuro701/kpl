<script lang="ts">
  import { getVolume, setVolume, SoundCategory } from "../../../lib/sounds";

	let volume: Record<SoundCategory, number> = {
		[SoundCategory.MUSIC]: getVolume(SoundCategory.MUSIC) * 100,
		[SoundCategory.SFX]: getVolume(SoundCategory.SFX) * 100,
	}

	$: setVolume(SoundCategory.SFX, volume[SoundCategory.SFX] / 100);
</script>

<div class="volume-settings">
	<div class="volume-category">
		<div class="volume-category__name">Hlasitost</div>
		<div class="volume-category__slider">
			<input type="range" min="0" max="100" bind:value={volume[SoundCategory.SFX]} />
			<!-- <div class="slider-skin" style="--p:{volume[SoundCategory.SFX]}%"></div> -->
		</div>
		<div class="volume-category__value">{volume[SoundCategory.SFX]}%</div>
	</div>
</div>

<style>
	.volume-settings {
		background-color: rgb(0, 0, 0, .25);
		padding: .5rem 1.5rem;
		color: var(--fg);
	}

	.volume-category {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	.volume-category__name {
		font-size: .7rem;
		text-transform: uppercase;
		letter-spacing: .1em;
		color: var(--muted);
	}
	.volume-category__slider {
		position: relative;
		flex: 1;
	}
	.volume-category__slider input {
		cursor: var(--cursor-pointer);
		opacity: 1;
		accent-color: var(--accent);
		height: auto;
		padding: 0;
		background: none;
		border: none;
	}
	.volume-category__slider input:focus {
		box-shadow: none;
	}
	.volume-category__value {
		width: 2rem;
		text-align: right;
		font-size: .8rem;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	.slider-skin {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		left: 0;
		width: 100%;
		height: .5rem;
		--c1: var(--accent);
		--c2: var(--surface);
		background: linear-gradient(to right, var(--c1) 0, var(--c1) var(--p), var(--c2) var(--p), var(--c2) 100%);
		pointer-events: none;
		border-radius: 1rem;
	}
</style>
