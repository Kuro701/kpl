<script>
  import AdBox from './AdBox.svelte';
  import ProfileEditor from './ProfileEditor.svelte';
  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { connect, connectToServer, sendRaw, waitForIdentity } from '../../lib/networking/client';
  import { randomUsername } from '../../lib/random';
  import { navigate, link } from 'svelte-routing';
  import { safeAwait } from '../../utils/safe-await';
  import { encodeNetworkMessage, MessageType } from '../../lib/networking/encoder';
  import Login from './Login.svelte';
  import LobbyHeader from '../../components/layout/LobbyHeader.svelte';
  import { rpcCall } from '../../lib/networking/req-res-manager';
  import { getLoginCredentials, LocalIdentity } from '../../lib/auth/auth';
  import Debuger from '../../components/debug/Debuger.svelte';
  import DebugVariable from '../../components/debug/DebugVariable.svelte';
  import AccountHome from './AccountHome.svelte';

  let connecting = false;
  let loaders = {
    randomJoin: false,
    showLobby: false,
    createRoom: false,
  };
  $: connecting = Object.values(loaders).some(Boolean);

  let username = $LocalIdentity.username;

  async function randomJoin() {
    loaders.randomJoin = true;
    if(!await connectToServer(username)) {
      loaders.randomJoin = false;
      return;
    };
    const [roomId, error] = await safeAwait(rpcCall('joinRandomRoom'));

    if (error) {
      console.error('Failed to join random room:', error);
      loaders.randomJoin = false;
      return;
    }

    loaders.randomJoin = false;
    navigate(`/room/${roomId}`);
  }

  async function showLobby() {
    loaders.showLobby = true;
    if(!await connectToServer(username)) {
      loaders.showLobby = false;
      return;
    };
    loaders.showLobby = false;
    navigate('/rooms');
  }

  async function createRoom() {
    loaders.createRoom = true;
    if(!await connectToServer(username))  {
      loaders.createRoom = false;
      return;
    };
    loaders.createRoom = false;
    navigate('/create');
  }
</script>

<Debuger>
  <DebugVariable name="identity" variable={$LocalIdentity} />
</Debuger>

<LayoutMenu>
  <LobbyHeader>
    <h1>Hrát</h1>

    <svelte:fragment slot="right">
      <a class="button button--social" aria-label="Pravidla" data-balloon-pos="down" href="/rules" use:link>
        <img src="/img/icons/rules.png" alt="Pravidla" draggable="false" />
      </a>
    </svelte:fragment>
  </LobbyHeader>

  <TwoColumns>
    <ItemList slot="left">
      <h2>Rychlá hra</h2>

      <ProfileEditor bind:username disabled={connecting} />

      <div class="actions">
        <div class="action">
          <button class="button" class:button--loading={loaders.randomJoin} on:click={randomJoin} disabled={connecting}>
            Náhodně připojit
          </button>
        </div>
        <div class="action">
          <button class="button" class:button--loading={loaders.showLobby} on:click={showLobby} disabled={connecting}>
            Místnosti
          </button>
          <div aria-label="Vytvořit místnost" data-balloon-pos="right">
            <button class="button" on:click={createRoom}  disabled={connecting} class:button--loading={loaders.createRoom}>
              <img src="/img/icons/plus.png" alt="Vytvořit místnost" class="icon invert" draggable="false" />
            </button>
          </div>
        </div>
      </div>


    </ItemList>
    <div class="how-to-play" slot="right">
      <!-- <HowToPlay /> -->
      {#if $LocalIdentity.provider === 'anonymous'}
        <Login />
      {:else}
        <AccountHome />
      {/if}
      <AdBox />
    </div>
  </TwoColumns>
</LayoutMenu>

<style>
  .actions {
    display: flex;
    flex-direction: column;
    width: 15rem;
    gap: .5rem;
    margin: 1rem 0 2rem 0;
  }
  .action {
    display: flex;
    justify-content: space-between;
    gap: .25rem;
  }
  .action > .button:first-child {
    flex: 1;
  }

  h1 {
    margin-bottom: 0;
  }

  .how-to-play {
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding-bottom: 2rem;
  }
</style>
