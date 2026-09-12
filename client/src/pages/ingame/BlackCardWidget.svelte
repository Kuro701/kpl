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
	/*
	 * The prompt is the one card everybody at the table reads, and it was
	 * rendering in the same 12em box as a card in your own hand. Measuring the
	 * deck settled the argument: 233 black cards, median 45 characters, and
	 * only four long enough to reach the smallest text step — so the text
	 * shrinking was never the problem, the card being small was.
	 *
	 * The card's whole geometry is em-based, so font-size IS the card size:
	 * this scales the box and the text together and keeps the four long ones
	 * legible instead of special-casing them.
	 *
	 * Tied to viewport height rather than a fixed rem, because 15em of card
	 * must not swallow a short laptop screen. At 2vh the card lands at roughly
	 * 30% of the viewport whatever the display, with a floor and a ceiling so
	 * it stays sane at both extremes.
	 */
	.black-card {
		display: flex;
		justify-content: center;
		font-size: clamp(.85rem, 2vh, 1.35rem);
	}
	.black-card--compact {
		font-size: clamp(.7rem, 1.5vh, 1rem);
	}
</style>
