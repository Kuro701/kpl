<script lang="ts">
	import { flip } from "svelte/animate";
	import { PlayerIdentity } from "../../../lib/networking/client";
	import { IngameRoom, RoomState } from "../../../lib/networking/room";
	import { scoreSorter } from "../../../lib/score-sorter";
	import { specialUsers } from "../../../lib/special-users";


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
				<div class="name">
					<div>{player.username}</div>

					{#if specialUsers[player.uuid]}
						<button
							class="special-icon"
							aria-label={specialUsers[player.uuid].text}
							data-balloon-pos="up"
							on:click={() => {
								if (specialUsers[player.uuid].link) {
									window.open(specialUsers[player.uuid].link, '_blank');
								}
							}}
						>
							<img
								class="special-icon"
								class:invert={specialUsers[player.uuid].iconInverted}
								src={specialUsers[player.uuid].icon}
								alt={specialUsers[player.uuid].text}
							/>
						</button>
					{/if}
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
