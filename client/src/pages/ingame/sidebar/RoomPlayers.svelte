<script lang="ts">
	import { flip } from "svelte/animate";
	import { PlayerIdentity } from "../../../lib/networking/client";
	import { IngameRoom, RoomState } from "../../../lib/networking/room";
	import { scoreSorter } from "../../../lib/score-sorter";


	// TODO: Allow host to kick players
</script>
<div class="players">
	{#each ($IngameRoom?.players ?? []).sort(scoreSorter($PlayerIdentity?.uuid || '')) as player (player.uuid)}
		<div class="player" animate:flip={{ duration: 500 }}>
			<div class="player__avatar">
				{player.image}
				{#if $IngameRoom?.state === RoomState.PICK_WHITE && !player.isCzar}
					<span
						class="dot"
						class:dot--done={player.hasPlayed}
						title={player.hasPlayed ? 'Vybráno' : 'Ještě vybírá'}
					></span>
				{/if}
			</div>
			<div class="player__name">
				<div class="role">
					{#if player.isCzar && $IngameRoom?.state !== RoomState.LOBBY}
						<span>Císař</span>
					{:else if player.isHost && $IngameRoom?.state === RoomState.LOBBY}
						<span>Hostitel</span>
					{/if}
				</div>
				<div class="name">
					<div>{player.username}</div>
				</div>
			</div>
			<div class="player__score">
				{player.points}
			</div>
		</div>
	{/each}
</div>

<style>
	.players {
		padding: 1rem 1rem 1rem .75rem;
		display: flex;
		flex-direction: column;
		gap: .75rem;
	}

	.player {
		display: flex;
		align-items: center;
		gap: .5rem;
		padding: .35rem .5rem;
		margin: -.35rem -.5rem;
		border-radius: var(--radius);
		border: 1px solid transparent;
		transition: background-color .15s ease, border-color .15s ease;
	}
	.player:hover {
		background-color: var(--surface-hover);
	}

	/* The czar (in game) and the host (in the lobby) are the only rows that
	   render a role label — give them a faint ember wash. */
	.player:has(.role span) {
		background-color: rgb(var(--accent-rgb) / .14);
		border-color: var(--accent-dim);
	}
	.player:has(.role span):hover {
		background-color: rgb(var(--accent-rgb) / .2);
	}

	/*
	 * Who is everyone waiting for? Grey while they are still choosing, green
	 * once their cards are down. The czar has nothing to choose yet, so they
	 * get no dot at all rather than a permanently grey one.
	 */
	.dot {
		position: absolute;
		right: -2px;
		bottom: -2px;
		width: .7rem;
		height: .7rem;
		border-radius: 50%;
		background: var(--muted);
		border: 2px solid var(--bg-deep);
		box-sizing: border-box;
		transition: background-color .2s ease, box-shadow .2s ease;
	}
	.dot--done {
		background: var(--ok);
		box-shadow: 0 0 8px rgba(74, 222, 128, .65);
	}

	.player__avatar {
		position: relative;
		height: 2.5rem;
		width: 2.5rem;
		border-radius: .75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.4rem;
		line-height: 1;
		flex: none;
		background-color: var(--avatar-bg);
		border: 1px solid var(--border);
		box-sizing: border-box;
	}

	.player__score {
		margin-left: auto;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--accent-text);
	}

	.player__name {
		display: flex;
		flex-direction: column;
		transform: translateY(-.1rem);
	}

	.player__name .name {
		font-size: 1rem;
		color: var(--fg);
	}

	.player__name .role {
		font-size: .7rem;
		color: var(--accent-text);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: .08em;
		transform: translateY(.2rem);
	}

	.player__name .name {
		display: flex;
		align-items: center;
		gap: .75rem;
	}
	.player__name .special-icon {
		height: 1.2rem;
		width: 1.2rem;
	}
	.player__name button.special-icon {
		padding: 0;
		background: none;
		border: none;
	}
</style>
