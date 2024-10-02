<script>
  import Card from "../../components/cards/Card.svelte";
  import { BlackCard } from "../../lib/networking/room";

</script>
<div class="black-card">
	<Card
		black={true}
		show={$BlackCard !== null}
		text={$BlackCard?.text ?? ""}
	/>
</div>

<style>
	.black-card {
		display: flex;
		justify-content: center;
	}
</style>
