<script lang="ts">
  import { navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
  import { randomRoomName } from "../../lib/random";
  import RoomSettings from "./RoomSettings.svelte";
  import { safeAwait } from "../../utils/safe-await";
  import { rpcCall } from "../../lib/networking/req-res-manager";
  import Debuger from "../../components/debug/Debuger.svelte";
  import DebugVariable from "../../components/debug/DebugVariable.svelte";
  import type { CardDeck } from "../../lib/networking/client";
  import CardDeckWidget from "./CardDeckWidget.svelte";
  import Card from "../../components/cards/Card.svelte";

  export let backTo = '/';

  function back() {
    if (!working) {
      navigate(backTo);
    }
  }

  let settings = {
    name: randomRoomName(),
    maxPlayers: 10,
    goal: 10,
    isPublic: false,
  };

  let availablePacks: CardDeck[] = [];

  let working = true;
  async function createRoom() {
    working = true;

    // TODO: Validate settings


    const [roomUUID, error] = await safeAwait(rpcCall('createRoom', {
      ...settings,
      decks: [ availablePacks.map(pack => pack.id) ]
    }));
    working = false;
    if (error || !roomUUID) {
      console.error(error);
      return;
    }

    // Following line will not connect player to the room
    // server will send join event to the player
    // this is just a shortcut to avoid waiting and make the app feel faster
    navigate(`/room/${roomUUID}`);
  }


  async function getAvailablePacks() {
    const [packs, error] = await safeAwait(rpcCall<CardDeck[]>('getAvailableCardDecks'));
    if (error || !packs) {
      console.error(error);
      working = false;
      return;
    }

    availablePacks = packs;
    working = false;
  }
  getAvailablePacks();

</script>

<Debuger>
  <DebugVariable name="working" variable={working} />
  <DebugVariable name="settings" variable={settings} />
  <DebugVariable name="availablePacks" variable={availablePacks} />
</Debuger>

<LayoutMenu>
	<LobbyHeader>
		  <LobbyBackButton slot="left" action={back} />
		<h1>Vytvořit místnost</h1>
	</LobbyHeader>
  <div class="room-creator">
    <RoomSettings bind:value={settings} />
    <div class="card-packs">
      <h3>Balíčky karet</h3>
      <div class="card-packs__packs">
        {#each availablePacks as pack}
          <CardDeckWidget value={pack} />
        {:else}
          <p>Načítání...</p>
        {/each}
        <Card>
          <p slot="front" style="font-size: .75rem; opacity: .75;text-align:center;">
            Vlastní balíčky karet již brzy
          </p>
        </Card>
      </div>
    </div>

    <div class="actions">
      <button class="button" on:click={createRoom}>
        <img src="/img/icons/plus.png" alt="Vytvořit místnost" class="icon invert" />
        Vytvořit místnost
      </button>
    </div>
  </div>
</LayoutMenu>

<style>
  .actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  .card-packs {
    padding: 0 2rem;
  }

  .card-packs__packs {
    display: flex;
  }
</style>
