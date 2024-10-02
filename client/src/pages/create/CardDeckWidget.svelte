<script lang="ts">
	import Card from "../../components/cards/Card.svelte";
	import type { CardDeck } from "../../lib/networking/client";
  import PackCardCount from "./PackCardCount.svelte";

	export let value: CardDeck;
</script>

<Card>
	<div class="pack" slot="front">
		<b>{value.name}</b>
		<p>{value.description}</p>
		<p class="automatic">Automaticky zahrnuto</p>
		<div class="xoxo">
			<PackCardCount white={value.whiteCardCount} black={value.blackCardCount} />
		</div>
	</div>
</Card>

<style>
	.pack {
		font-size: .9rem;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.automatic {
		font-size: .75rem;
		color: #666;
		text-align: center;
		margin-top: auto;
	}
	.xoxo {
		display: flex;
		justify-content: center;
	}
</style>
