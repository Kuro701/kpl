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
  import CardDeckSelector from "./CardDeckSelector.svelte";

  export let backTo = '/';

  function back() {
    if (!working) {
      navigate(backTo);
    }
  }

  let settings = {
    name: randomRoomName(),
    maxPlayers: 10,
    goal: 7,
    isPublic: false,
  };

  let availablePacks: CardDeck[] = [];
  let selectedPacks: number[] = [];

  let working = true;
  async function createRoom() {
    working = true;

    // TODO: Validate settings


    const [roomUUID, error] = await safeAwait(rpcCall('createRoom', {
      ...settings,
      decks: selectedPacks,
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

    availablePacks.forEach(pack => {
      if (pack.default) {
        selectedPacks.push(pack.id);
      }
    })

    selectedPacks = selectedPacks; //Trigger reactivity
    working = false;
  }
  getAvailablePacks();

</script>

<Debuger>
  <DebugVariable name="working" variable={working} />
  <DebugVariable name="settings" variable={settings} />
  <DebugVariable name="availablePacks" variable={availablePacks} />
  <DebugVariable name="selectedPacks" variable={selectedPacks} />
</Debuger>

<LayoutMenu>
	<LobbyHeader>
		  <LobbyBackButton slot="left" action={back} />
		<h1>Vytvořit místnost</h1>
	</LobbyHeader>
  <div class="room-creator">
    <RoomSettings bind:value={settings} />
    <div class="card-packs">
      <CardDeckSelector bind:value={selectedPacks} options={availablePacks} />
    </div>


    <div class="actions">
      <button class="button" on:click={createRoom} disabled={selectedPacks.length === 0}>
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

  .actions .button {
    min-width: 15rem;
    background-color: var(--accent);
    border-color: var(--accent);
    color: var(--accent-contrast);
    font-weight: 600;
    box-shadow: var(--accent-glow);
  }
  .actions .button:hover {
    background-color: var(--accent-hover);
    border-color: var(--accent-hover);
    color: var(--accent-contrast);
    box-shadow: var(--accent-glow-strong);
  }
  .actions .button[disabled] {
    background-color: var(--surface);
    border-color: var(--border);
    color: var(--muted);
    box-shadow: none;
  }

  .card-packs {
    padding: 0 2rem;
  }
</style>
