<script>
	export let value = false;
</script>

<label class="switch" class:active={value}>
	<input type="checkbox" bind:checked={value} />
	<span class="slider"></span>
</label>

<style>
	.switch {
		background-color: var(--surface-hover);
		border: 1px solid var(--border);
		box-sizing: border-box;
		width: 3em;
		height: 1.5em;
		border-radius: 1.5em;
		position: relative;
		cursor: var(--cursor-pointer);
		transition: background-color .2s ease-out, border-color .2s ease-out, box-shadow .2s ease-out;
	}

	.switch input {
		display: none;
	}

	.slider {
		display: block;
		position: absolute;
		top: .25em;
		left: .25em;
		width: 1em;
		height: 1em;
		border-radius: 1em;
		background: var(--fg);
		cursor: var(--cursor-pointer);

		transition: left .2s ease-out, background-color .2s ease-out;
	}

	.switch input:checked + .slider {
		left: 1.75em;
		background: var(--accent-contrast);
	}

	.switch.active {
		background-color: var(--accent);
		border-color: var(--accent);
		box-shadow: var(--accent-glow);
	}
</style>
