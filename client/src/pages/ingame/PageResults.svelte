<script lang="ts">
	import { link } from "svelte-routing";
	import Debuger from "../../components/debug/Debuger.svelte";
	import DebugVariable from "../../components/debug/DebugVariable.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { LastGameResults } from "../../lib/networking/room";
	import PlayerWidget from "./PlayerWidget.svelte";
  import { scoreSorter } from "../../lib/score-sorter";
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
	<div>
		<a href="/" use:link class="button invert">
			<img src="/img/icons/leave.png" alt="Leave" draggable="false" class="icon invert" />
			Odejít
		</a>
	</div>
</div>

<style>
	.game-over {
		background-color: var(--blackish);
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: white;
		gap: 2rem;
		overflow: auto;
	}
	.game-over__title {
		font-size: 3rem;
		margin-top: 2rem;
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
		background-color: white;
		width: 5rem;
		height: 3rem;
		color: black;
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
		background-color: gold;
		color: rgb(61, 51, 0);
		height: 8rem;
	}

	/* 2. position */
	.podium-player:nth-child(2) {
		order: 1;
	}
	.podium-player:nth-child(2) .player-podium__pedestal {
		background-color: silver;
		color: rgb(51, 51, 51);
		height: 6rem;
	}


	/* 3. position */
	.podium-player:nth-child(3) {
		order: 3;
	}
	.podium-player:nth-child(3) .player-podium__pedestal {
		background-color: #cd7f32;
		color: #311e0b;
		height: 4rem;
	}

	.score {
		display: flex;
		flex-direction: column;
		font-size: 1.1rem;
		width: 40rem;
	}
	.player-score {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		border-bottom: 1px solid rgb(255, 255, 255, 0.1);
		padding: 1rem .75rem;

	}
	.player-score__place {
		width: 1.5rem;
	}
	.player-score__name {
		flex-grow: 1;
	}
	.player-score__points {
		text-align: right;
	}

	.player-score.me {
		background-color: rgb(255, 255, 255, 0.85);
		color: black;
	}
</style>
