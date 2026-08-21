<script>
  import Card from "../../components/cards/Card.svelte";
  import { BlackCard, CrowdedTable } from "../../lib/networking/room";

  /*
   * At a full table the answers need two rows and the prompt is competing with
   * them for the same screen. The prompt is one card and everyone has already
   * read it by the time the czar is choosing, so it is the one that gives way.
   * The deck stands down with it — same flag, so they stay the same size.
   */
</script>
<div class="black-card" class:black-card--compact={$CrowdedTable}>
	<Card
		black={true}
		show={$BlackCard !== null}
		text={$BlackCard?.text ?? ""}
		tip={$BlackCard?.tip ?? null}
	/>
</div>

<style>
	.black-card {
		display: flex;
		justify-content: center;
	}
	.black-card--compact {
		font-size: .74rem;
	}
</style>
