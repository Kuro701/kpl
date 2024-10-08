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
			<img class="player__avatar" src={player.image} alt={player.username} draggable="false" referrerpolicy="no-referrer" />
			<div class="player__name">
				<div class="role">
					{#if player.isCzar && $IngameRoom?.state !== RoomState.LOBBY}
						<span>Císař</span>
					{:else if player.isHost && $IngameRoom?.state === RoomState.LOBBY}
						<span>Hostitel</span>
					{/if}
				</div>
				<div class="name">{player.username}</div>
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
	}

	.player__avatar {
		height: 2.5rem;
		width: 2.5rem;
		object-fit: cover;
		border-radius: .75rem;
	}

	.player__score {
		margin-left: auto;
	}

	.player__name {
		display: flex;
		flex-direction: column;
		transform: translateY(-.1rem);
	}

	.player__name .name {
		font-size: 1rem;
	}

	.player__name .role {
		font-size: .75rem;
		color: var(--gray);
		font-weight: 200;
		transform: translateY(.2rem);
	}
</style>
