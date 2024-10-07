<script lang="ts">
	import Switch from "../../components/form/Switch.svelte";
	import { PlayerIdentity } from "../../lib/networking/client";
	import { randomRoomName } from "../../lib/random";

	type RoomSettings = {
		name: string;
		maxPlayers: number;
		goal: number;
		isPublic: boolean;
	}

	export let value: RoomSettings;
</script>

<div class="settings">
	<div class="property">
		<div class="property__tile">
		Název místnosti:
		</div>
		<div class="property__input">
		{#if !$PlayerIdentity || $PlayerIdentity.anonymous}
			<div data-balloon-pos="up" aria-label="Pro úpravu názvu místnosti se přihlaste">
			<input type="text" value={value.name} disabled />
			</div>
		{:else}
			<input type="text" bind:value={value.name} maxlength="40" />
		{/if}
		<div aria-label="Náhodný název" data-balloon-pos="up">
			<button class="button button--random" on:click={() => value.name = randomRoomName()}>
			<img src="/img/icons/dice.png" alt="Obnovit" />
			</button>
		</div>
		</div>
	</div>
	<div class="property">
		<div class="property__title">
		Max. počet hráčů:
		</div>
		<div class="property__input">
		<select bind:value={value.maxPlayers}>
			{#each [5, 10, 15, 20] as goal}
				<option value={goal}>{goal}</option>
			{/each}
		</select>
		</div>
	</div>
	<div class="property">
		<div class="property__title">
		Cíl hry:
		</div>
		<div class="property__input">
		<select bind:value={value.goal}>
			{#each [5, 7, 10, 12, 15, 18, 20] as goal}
			<option value={goal}>{goal}</option>
			{/each}
		</select>
		</div>
	</div>
	<div class="property">
		<div class="property__title">
		Veřejná místnost:
		</div>
		<div class="property__input">
		<Switch bind:value={value.isPublic} />
		</div>
	</div>
</div>

<style>
	.settings {
		padding: 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.settings .property {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.settings .property > div {
		flex: 1;
		display: flex;
	}

	.settings .property__input > *:first-child {
		width: 100%;
	}

	.button--random {
		background: none;
		border: none;
		padding: 0 0 0 .5rem;
		height: 2rem;
	}
	.button--random img {
		width: 2rem;
		height: 2rem;
		opacity: .8;
	}
	.button--random:hover img {
		opacity: 1;
	}
</style>
