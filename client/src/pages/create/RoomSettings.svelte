<script lang="ts">
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
		<input type="text" bind:value={value.name} maxlength="40" placeholder="Název místnosti" />
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
			<!-- Every number from 3 to 15: the old list skipped 7, 9, 11, 13, 14
			     for no reason anyone could explain at the table. -->
			{#each Array.from({ length: 13 }, (_, i) => i + 3) as count}
				<option value={count}>{count}</option>
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
	<div class="property property--note">
		Místnost je soukromá — dovnitř se dostane jen ten, komu pošleš kód.
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

	.settings .property__tile,
	.settings .property__title {
		color: var(--fg);
		font-size: .9rem;
	}

	.settings .property.property--note {
		display: block;
		margin-top: -.25rem;
		color: var(--muted);
		font-size: .8rem;
		font-style: italic;
		line-height: 1.4;
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
		opacity: .7;
		filter: invert(1);
		transition: opacity .16s ease;
	}
	.button--random:hover img {
		opacity: 1;
	}

	@media (max-width: 50rem) {
		.settings .property {
			flex-direction: column;
			align-items: flex-start;
		}
		.settings .property__input {
			width: 100%;
		}
		.settings .property.property--checkbox {
			flex-direction: row;
		}
		.settings .property.property--checkbox .property__input{
			width: fit-content;
			flex: 0;
		}
	}
</style>
