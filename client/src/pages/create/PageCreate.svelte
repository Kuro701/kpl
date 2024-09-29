<script>
  import { navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
  import { randomRoomName } from "../../lib/random";
  import { PlayerIdentity } from "../../lib/networking/client";
  import Switch from "../../components/form/Switch.svelte";

  export let backTo = '/';

  let settings = {
    name: randomRoomName(),
    maxPlayers: 10,
    goal: 10,
    isPublic: false,
  };
</script>
<LayoutMenu>
	<LobbyHeader>
		<LobbyBackButton slot="left" action={() => navigate(backTo)} />
		<h1>Vytvořit místnost</h1>
	</LobbyHeader>
  <div class="room-creator">
    <div class="settings">
      <div class="property">
        <div class="property__tile">
          Název místnosti:
        </div>
        <div class="property__input">
          {#if !$PlayerIdentity || $PlayerIdentity.anonymous}
            <div data-balloon-pos="up" aria-label="Pro úpravu názvu místnosti se přihlaste">
              <input type="text" value={settings.name} disabled />
            </div>
          {:else}
            <input type="text" bind:value={settings.name} />
          {/if}
          <div aria-label="Náhodný název" data-balloon-pos="up">
            <button class="button button--random" on:click={() => settings.name = randomRoomName()}>
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
          <select bind:value={settings.maxPlayers}>
            {#each [5, 10, 15, 20, 25, 30] as goal}
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
          <select bind:value={settings.goal}>
            {#each [5, 10, 15, 20] as goal}
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
          <Switch bind:value={settings.isPublic} />
        </div>
      </div>
    </div>
    <div class="card-packs">

    </div>
  </div>
</LayoutMenu>

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
