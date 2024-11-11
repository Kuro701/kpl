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
	}
	.czar-board p {
		margin: 0;
	}

	.czar-board.touchscreen {
		transform: none;
		text-align: center;
		justify-content: flex-start;
	}
</style>
