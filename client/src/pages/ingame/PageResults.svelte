<script lang="ts">
	import { asset } from '../../lib/asset';
	import { link } from 'svelte-routing';
	import { navigate } from '../../lib/nav';
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

	/*
	 * Built once, not per render: the values are random but they must not
	 * change on every state update, or the embers would teleport each time the
	 * score list re-sorts.
	 */
	const EMBERS = Array.from({ length: 18 }, (_, i) => ({
		i,
		x: Math.round(Math.random() * 100),
		delay: +(Math.random() * 9).toFixed(2),
		dur: +(7 + Math.random() * 7).toFixed(2),
		size: +(2 + Math.random() * 4).toFixed(1),
		drift: Math.round((Math.random() - 0.5) * 120),
		// Mostly the gold of the winner's podium, occasionally the teal dragon.
		hue: Math.random() < 0.22 ? '168 190 180' : '217 162 39',
	}));
</script>

<Debuger>
	<DebugVariable name="score" variable={$LastGameResults} />
</Debuger>

<div class="game-over">
	<!--
		The celebration. Embers rather than confetti — this game is dragons and
		cathedrals, and party streamers would look borrowed from somewhere else.
		aria-hidden because it is atmosphere: a screen reader should get the
		scores, not eighteen decorative dots.
	-->
	<div class="embers" aria-hidden="true">
		{#each EMBERS as ember (ember.i)}
			<span
				class="ember"
				style="--x:{ember.x}%; --delay:{ember.delay}s; --dur:{ember.dur}s; --size:{ember.size}px; --drift:{ember.drift}px; --hue:{ember.hue}"
			></span>
		{/each}
	</div>

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
				<img src={asset('/img/icons/play.png')} alt="" draggable="false" class="icon invert" />
				Hrát znovu
			</button>
		{/if}
		<button class="button" on:click={leave}>
			<img src={asset('/img/icons/leave.png')} alt="" draggable="false" class="icon invert" />
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
		position: relative;
		background-color: var(--bg);
		background-image: radial-gradient(120% 80% at 50% 0%, rgb(var(--accent-rgb) / .18), transparent 70%);
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--fg);
		gap: 2rem;
		overflow: auto;
	}

	/* A slow breath of light behind the podium, under everything else. */
	.game-over::before {
		content: "";
		position: absolute;
		inset: -10% -20% auto;
		height: 70%;
		z-index: 0;
		pointer-events: none;
		background: radial-gradient(50% 50% at 50% 30%, rgb(var(--accent-rgb) / .2), transparent 70%);
		animation: celebrate-bloom 7s ease-in-out infinite;
	}
	@keyframes celebrate-bloom {
		0%, 100% { opacity: .55; transform: scale(1); }
		50%      { opacity: 1;   transform: scale(1.08); }
	}

	.embers {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.ember {
		position: absolute;
		left: var(--x);
		bottom: -12px;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: rgb(var(--hue));
		box-shadow: 0 0 8px 1px rgb(var(--hue) / .7);
		opacity: 0;
		animation: ember-rise var(--dur) linear var(--delay) infinite;
	}
	/*
	 * Fades in off the bottom edge and out before the top, so nothing is seen
	 * to pop into or out of existence at a screen edge.
	 */
	@keyframes ember-rise {
		0%   { transform: translate3d(0, 0, 0) scale(.6); opacity: 0; }
		12%  { opacity: .85; }
		70%  { opacity: .6; }
		100% { transform: translate3d(var(--drift), -102vh, 0) scale(1); opacity: 0; }
	}

	/* Everything real sits above the atmosphere. */
	.game-over > :not(.embers) {
		position: relative;
		z-index: 1;
	}

	/* Celebration is not worth making anyone motion-sick. */
	@media (prefers-reduced-motion: reduce) {
		.ember { animation: none; opacity: .5; }
		.game-over::before { animation: none; opacity: .8; }
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
		background-color: rgb(var(--accent-rgb) / .22);
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
		background-color: rgb(var(--accent-rgb) / .14);
		color: var(--fg);
		box-shadow: inset 3px 0 0 var(--accent);
	}
</style>
