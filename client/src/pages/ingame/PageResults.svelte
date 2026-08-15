<script lang="ts">
	import { link, navigate } from "svelte-routing";
	import Debuger from "../../components/debug/Debuger.svelte";
	import DebugVariable from "../../components/debug/DebugVariable.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { LastGameResults } from "../../lib/networking/room";
	import PlayerWidget from "./PlayerWidget.svelte";
  import { scoreSorter } from "../../lib/score-sorter";
  import { leaveRoom } from "../../lib/networking/client";

	/*
	 * The room outlives the game now, so the same group can go straight into
	 * another one without creating a room and re-sharing the code.
	 */
	$: roomUUID = $LastGameResults?.roomUUID ?? null;

	function playAgain() {
		if (!roomUUID) return;
		navigate(`/room/${roomUUID}`);
	}

	function leave() {
		leaveRoom();
		navigate('/');
	}
</script>

<Debuger>
	<DebugVariable name="score" variable={$LastGameResults} />
</Debuger>

<div class="game-over">
	<h1 class="game-over__title">Konec hry</h1>
	<div class="podium">
		{#if $LastGameResults}
			{#each $LastGameResults.score.sort(scoreSorter($PlayerIdentity?.uuid || '')).slice(0, 3) as result, i}
				<div class="podium-player">
					<div class="podium-player__player-widget">
						<PlayerWidget name={result.username} image={result.image} />
					</div>
					<div class="player-podium__pedestal">{i + 1}</div>
				</div>
			{/each}
			{#each Array(Math.max(3 - $LastGameResults.score.length, 0)) as _, i}
				<div class="podium-player">
					<div class="podium-player__player-widget">
						<PlayerWidget />
					</div>
					<div class="player-podium__pedestal">{$LastGameResults.score.length + i + 1}</div>
				</div>
			{/each}
		{/if}
	</div>
	<div class="score">
		{#if $LastGameResults}
			{#each $LastGameResults.score.sort(scoreSorter($PlayerIdentity?.uuid || '')) as result, i}
				<div class="player-score" class:me={result.uuid === $PlayerIdentity?.uuid}>
					<div class="player-score__place">{i + 1}.</div>
					<div class="player-score__name">{result.username}</div>
					<div class="player-score__points">{result.points}</div>
				</div>
			{/each}
		{/if}
	</div>
	<div class="game-over__actions">
		{#if roomUUID}
			<button class="button button--again" on:click={playAgain}>
				<img src="/img/icons/play.png" alt="" draggable="false" class="icon invert" />
				Hrát znovu
			</button>
		{/if}
		<button class="button" on:click={leave}>
			<img src="/img/icons/leave.png" alt="" draggable="false" class="icon invert" />
			Odejít
		</button>
	</div>
</div>

<style>
	.game-over__actions {
		display: flex;
		gap: .75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.game-over__actions .button--again {
		background-color: var(--accent);
		border-color: var(--accent);
		color: var(--accent-contrast);
		font-weight: 600;
		box-shadow: var(--accent-glow);
	}
	.game-over__actions .button--again:hover {
		background-color: var(--accent-hover);
		border-color: var(--accent-hover);
		color: var(--accent-contrast);
		box-shadow: var(--accent-glow-strong);
	}

	.game-over {
		background-color: var(--bg);
		background-image: radial-gradient(120% 80% at 50% 0%, rgba(229, 50, 45, .18), transparent 70%);
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--fg);
		gap: 2rem;
		overflow: auto;
	}
	.game-over__title {
		font-size: 3rem;
		margin-top: 2rem;
		color: var(--fg);
		text-shadow: var(--accent-glow-strong);
	}

	/* The leave link carries the legacy `invert` class, which used to flip the
	   whole button white on the old dark results page. The themed .button
	   already reads correctly on dark, so only the icon stays inverted. */
	.game-over .button {
		filter: none;
	}

	.podium {
		display: flex;
		flex-direction: row;
		gap: 4rem;
	}

	.podium-player {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		justify-content: flex-end;
	}

	.player-podium__pedestal {
		background-color: var(--panel-raised);
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: var(--radius) var(--radius) 0 0;
		box-sizing: border-box;
		width: 5rem;
		height: 3rem;
		color: var(--fg);
		text-align: center;
		line-height: 3rem;
		font-size: 1.2rem;
		font-weight: bold;
	}


	/* 1. position */
	.podium-player:nth-child(1) {
		order: 2;
	}
	.podium-player:nth-child(1) .player-podium__pedestal {
		background-color: var(--accent);
		border-color: var(--accent);
		color: var(--accent-contrast);
		box-shadow: var(--accent-glow-strong);
		height: 8rem;
	}

	/* 2. position */
	.podium-player:nth-child(2) {
		order: 1;
	}
	.podium-player:nth-child(2) .player-podium__pedestal {
		background-color: rgba(229, 50, 45, .22);
		border-color: var(--accent-dim);
		color: var(--fg);
		height: 6rem;
	}


	/* 3. position */
	.podium-player:nth-child(3) {
		order: 3;
	}
	.podium-player:nth-child(3) .player-podium__pedestal {
		background-color: var(--surface-hover);
		border-color: var(--border-strong);
		color: var(--fg);
		height: 4rem;
	}

	.score {
		display: flex;
		flex-direction: column;
		font-size: 1.1rem;
		width: 40rem;
		max-width: 100%;
		background-color: var(--panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-sizing: border-box;
		overflow: hidden;
	}
	.player-score {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		border-bottom: 1px solid var(--border);
		padding: 1rem .75rem;
		color: var(--fg);

	}
	.player-score__place {
		width: 1.5rem;
		color: var(--muted);
	}
	.player-score__name {
		flex-grow: 1;
	}
	.player-score__points {
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--accent-text);
	}

	.player-score.me {
		background-color: rgba(229, 50, 45, .14);
		color: var(--fg);
		box-shadow: inset 3px 0 0 var(--accent);
	}
</style>
