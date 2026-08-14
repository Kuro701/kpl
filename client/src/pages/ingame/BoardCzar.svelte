<script lang="ts">
	import { phoneMode } from "../../lib/phone-mode";
</script>
<div class="czar-board" class:touchscreen={$phoneMode}>
	<h2>Jsi karetní císař</h2>
	<p>
		Tví poddaní právě vybírají karty, o kterých za malou chvilku rozhodneš
	</p>
</div>

<style>
	.czar-board {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		transform: translateY(-15%);
		color: var(--fg);
		text-align: center;
	}
	.czar-board h2 {
		margin: 0 0 .5rem;
		color: var(--accent-text);
		text-shadow: var(--accent-glow);
	}
	.czar-board p {
		margin: 0;
		color: var(--muted);
	}

	.czar-board.touchscreen {
		transform: none;
		text-align: center;
		justify-content: flex-start;
	}
</style>
