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
			<div class="player__avatar">{player.image}</div>
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
		background-color: rgba(229, 50, 45, .14);
		border-color: var(--accent-dim);
	}
	.player:has(.role span):hover {
		background-color: rgba(229, 50, 45, .2);
	}

	.player__avatar {
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
