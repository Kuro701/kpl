<script lang="ts">
  import { PlayerIdentity } from "../../lib/networking/client";
  import { rpcCall } from "../../lib/networking/req-res-manager";
  import { IngameRoom, RoomState } from "../../lib/networking/room";
  import PlayerWidget from "./PlayerWidget.svelte";

  function startGame() {
	return rpcCall("startGame");
  }

</script>

{#if $IngameRoom && $IngameRoom.state === RoomState.LOBBY}
	<div class="lobby-state">
		{#if $IngameRoom.players.length < 3}
			<div class="title">
				<h1>Čekání na hráče</h1>
				<p>
					Ke spuštení hry jsou potřeba minimálně 3 hráči
				</p>
			</div>
		{:else if $IngameRoom.players.some(p => p.isHost)}
			{@const host = $IngameRoom.players.find(p => p.isHost)}
			{#if host && host.uuid === $PlayerIdentity?.uuid}
				<div class="title title--before-button">
					<h1>Můžete spustit hru</h1>
					<p>
						Jste hostitel této mísnosti. Hra začne jakmile stisknete tlačítko níže
					</p>
				</div>
				<div class="start-btn-wrapper">
					<button class="button" on:click={startGame}>
						<img src="/img/icons/play.png" alt="Start" draggable="false" class="icon invert" />
						Spustit hru
					</button>
				</div>
			{:else}
				<div class="title">
					<h1>Čekání na hostitele</h1>
					<p>
						Čeká se, než hráč <b>{host?.username}</b>, kterému patří tato mísnost, spustí hru
					</p>
				</div>
			{/if}
		{:else}
			<div class="title">
				<h1>Hra začne za pár vteřin</h1>
				<p>
					Poslední šance pro opozdilce se připojit!
				</p>
			</div>
		{/if}

		<div class="players">
			{#each $IngameRoom.players as player}
				<PlayerWidget name={player.username} image={player.image} />
			{/each}
			{#if $IngameRoom.players.length < 3}
				{#each Array(3 - $IngameRoom.players.length) as _}
					<PlayerWidget />
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style>
	.lobby-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.players {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 2rem;
	}

	.title {
		text-align: center;
		margin-bottom: 5rem;
	}
	.title--before-button {
		margin-bottom: 1rem;
	}
	.title h1 {
		margin: 0;
	}
	.title p {
		margin: 0;
		font-weight: 300;
	}

	.start-btn-wrapper {
		height: 3rem;
		margin-bottom: 1rem;
	}
</style>
