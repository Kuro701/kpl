<script lang="ts">
	import { tick } from "svelte";
	import Card from "../../components/cards/Card.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { BoardCards, IngameRoom, RoomState, ServerResponseFn } from "../../lib/networking/room";
	import { phoneMode } from "../../lib/phone-mode";

	$: playerIsCzar = $IngameRoom?.players.some(p => p.isCzar && p.uuid === $PlayerIdentity?.uuid);

	/*
	 * The reveal. Once the czar has decided, every losing card flips face down
	 * so the winner is the only thing left on the table, with the name of
	 * whoever played it underneath — until now nobody ever learned who wrote
	 * the line that won.
	 */
	$: winnerGroupId = $IngameRoom?.table.lastRoundWinnerGroupId ?? null;
	$: revealing = !!winnerGroupId;
	$: winnerName = $IngameRoom?.table.lastRoundWinner?.username ?? '';

	/*
	 * The table used to be one long horizontal strip. At ten players the far
	 * left simply could not be reached — you scrolled right, never back past the
	 * start — so a third of the answers were unreadable and the czar was picking
	 * blind. It now wraps: at most five groups to a row, then a new row beneath.
	 *
	 * Rows are balanced rather than greedy, so six groups read as 3 + 3 instead
	 * of 5 + 1.
	 */
	const MAX_PER_ROW = 5;
	$: groupCount = $BoardCards.length;
	$: rowCount = Math.max(1, Math.ceil(groupCount / MAX_PER_ROW));
	$: columnCount = Math.max(1, Math.ceil(groupCount / rowCount));

	/*
	 * And the cards size themselves to the space that is actually there, instead
	 * of everyone reaching for ctrl+scroll to zoom the browser out. A card is
	 * 12em wide and 15em tall, so one em of font size is one unit of card: work
	 * out how many fit in the measured box and take the tighter of the two axes.
	 *
	 * The box is measured, not the content — .cards is a flex child with a zero
	 * basis and its own scroll, so its clientHeight is the room available
	 * regardless of what is in it. Setting the font size cannot change it, so
	 * there is no resize feedback loop.
	 */
	const CARD_W_EM = 12;
	const CARD_H_EM = 15;
	const GAP_PX = 8;
	const MIN_FONT_PX = 8;
	const MAX_FONT_PX = 16;

	let el: HTMLDivElement | undefined;
	let boxWidth = 0;
	let boxHeight = 0;

	/** Stacked answers put a shrunk card on top of the full-height one. */
	$: pick = $IngameRoom?.table.black?.pick ?? 1;
	$: groupHeightEm = CARD_H_EM + (pick - 1) * 8;

	/** The name under the winner needs its own strip, but only while revealing. */
	$: nameReservePx = revealing ? rowCount * 26 : 0;

	$: fitWidth = (boxWidth - (columnCount + 1) * GAP_PX) / (columnCount * CARD_W_EM);
	$: fitHeight = (boxHeight - (rowCount + 1) * GAP_PX - nameReservePx) / (rowCount * groupHeightEm);
	$: estimate = Math.max(MIN_FONT_PX, Math.min(MAX_FONT_PX, Math.floor(Math.min(fitWidth, fitHeight))));

	$: fitCards(estimate, groupCount, columnCount, boxWidth, boxHeight, revealing, $phoneMode);

	/*
	 * The estimate assumes every card is exactly 15em. A stacked answer is not:
	 * its shrunk card grows with however much text is on it, and the card's
	 * padding is in px so it does not shrink with the font. So the estimate is
	 * the optimistic starting point and this walks it down a pixel at a time
	 * until nothing is cut off — bounded, and only when the table changes.
	 */
	async function fitCards(start: number, ..._deps: unknown[]) {
		await tick();
		if (!el) return;

		if ($phoneMode) {
			el.style.fontSize = '';
			return;
		}

		let size = start;
		el.style.fontSize = `${size}px`;

		let guard = 0;
		while (size > MIN_FONT_PX && guard++ < 16 && el.scrollHeight > el.clientHeight + 1) {
			size -= 1;
			el.style.fontSize = `${size}px`;
		}
	}

	function onCardGroupClick(id: string) {
		const isCzarRound = $IngameRoom?.state === RoomState.PICK_CZAR;
		const reply = $ServerResponseFn;
		const isClickable = playerIsCzar && isCzarRound && !!reply;
		if (!isClickable) return;

		reply(id);
	}

</script>

<!-- Once the winner is out, the 'czar is deciding' line is stale noise. -->
{#if $IngameRoom?.state === RoomState.PICK_CZAR && !revealing}
	<div class="czar">
		{#if playerIsCzar}
			Vaše veličensto, <b>vyberte vítěznou kartu</b>
		{:else}
			Císař <b>{$IngameRoom?.players.find(x => x.isCzar)?.username || ''}</b> vybírá vítěznou kartu
		{/if}
	</div>
{/if}
<div
	class="cards"
	class:cards--touchmode={$phoneMode}
	style="--card-columns: {columnCount};"
	bind:this={el}
	bind:clientWidth={boxWidth}
	bind:clientHeight={boxHeight}
>
	{#each $BoardCards as cardGroup (cardGroup.id)}
		{@const isWinner = cardGroup.id === winnerGroupId}
		<button
			class="card-group"
			class:card-group--faded={revealing && !isWinner}
			class:card-group--winner={revealing && isWinner}
			on:click={() => onCardGroupClick(cardGroup.id)}
		>
			{#each cardGroup.cards as card, i (card.id)}
				<div class="card">
					<Card
						black={false}
						show={!revealing || isWinner}
						text={card.text}
						shrink={i !== cardGroup.cards.length - 1}
						noMargin={true}
						marked={isWinner}
						tip={card.tip}
					/>
				</div>
			{/each}

			{#if revealing && isWinner && winnerName}
				<div class="winner-name">{winnerName}</div>
			{/if}
		</button>

	{/each}
</div>

<style>
	.cards {
		display: grid;
		grid-template-columns: repeat(var(--card-columns, 1), max-content);
		justify-content: center;
		/* safe: if it ever does overflow, the top stays reachable rather than
		   being centred out past the scroll origin. */
		align-content: center;
		align-content: safe center;
		justify-items: center;
		align-items: start;
		gap: .5rem;
		padding-bottom: .5rem;
		margin-top: 1rem;
		/* Take the space left between the black card and the hand, and scroll
		   inside it — never sideways. */
		flex: 1 1 0;
		min-height: 0;
		overflow: hidden auto;
	}
	.cards--touchmode {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: auto;
		overflow: visible;
		font-size: 1rem;
	}

	.card-group {
		display: flex;
		flex-direction: column;
		font: inherit;
		text-rendering: inherit;
		color: inherit;
		letter-spacing: inherit;
		word-spacing: inherit;
		text-transform: inherit;
		text-indent: inherit;
		text-shadow: inherit;
		padding: 0;
		margin: 0;
		border: none;
		text-align: inherit;
		background-color: transparent;
	}
	.card-group:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: var(--radius);
	}

	.card {
		cursor: var(--cursor-pointer);
	}

	.card-group {
		transition: opacity .3s ease, transform .3s ease;
	}
	.card-group--faded {
		opacity: .45;
		transform: scale(.94);
	}
	.card-group--winner {
		transform: translateY(-.5rem);
	}

	.winner-name {
		margin-top: .6rem;
		text-align: center;
		/* Fixed, not scaled with the cards — at ten players the cards get small
		   and the name still has to be readable across the room. */
		font-size: .95rem;
		font-weight: 600;
		color: var(--accent-text);
		text-shadow: var(--accent-glow);
		animation: winner-in .3s ease-out;
	}

	@keyframes winner-in {
		from { opacity: 0; transform: translateY(-.4rem); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.czar {
		text-align: center;
		margin-top: 1rem;
		color: var(--fg);
	}
	.czar b {
		color: var(--accent-text);
	}
</style>
