<script>
  import AdBox from './AdBox.svelte';
  import ProfileEditor from './ProfileEditor.svelte';
  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { connect, sendRaw, waitForIdentity } from '../../lib/networking/client';
  import { randomUsername } from '../../lib/random';
  import { navigate, link } from 'svelte-routing';
  import { safeAwait } from '../../utils/safe-await';
  import { encodeNetworkMessage, MessageType } from '../../lib/networking/encoder';
  import Login from './Login.svelte';
  import LobbyHeader from '../../components/layout/LobbyHeader.svelte';
  import { rpcCall } from '../../lib/networking/req-res-manager';

  let connecting = false;

  let username = window.localStorage.getItem('username') || randomUsername();

  async function connectToServer() {
    if (connecting) return false;

    connecting = true;
    const [_, connectionError] = await safeAwait(connect({
      provider: 'anonymous',
      username: username,
      user_id: window.localStorage.getItem('uuid') || '',
      user_token: window.localStorage.getItem('token') || '',
    }));

    if (connectionError) {
      connecting = false;
      console.error('Failed to connect:', connectionError);
      return false;
    }

    const [_identity, identityError] = await safeAwait(waitForIdentity())

    if (identityError) {
      connecting = false;
      console.error('Failed to get identity:', identityError);
      return false;
    }

    return true;
  }

  async function randomJoin() {
    if(!await connectToServer()) return;
    const [roomId, error] = await safeAwait(rpcCall('joinRandomRoom'));

    if (error) {
      console.error('Failed to join random room:', error);
      return;
    }

    navigate(`/room/${roomId}`);
  }

  async function showLobby() {
    if(!await connectToServer()) return;
    navigate('/rooms');
  }

  async function createRoom() {
    if(!await connectToServer()) return;
    navigate('/create');
  }
</script>
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
          <button class="button" on:click={randomJoin} disabled={connecting}>
            Náhodně připojit
          </button>
        </div>
        <div class="action">
          <button class="button" on:click={showLobby} disabled={connecting}>
            Místnosti
          </button>
          <button class="button" aria-label="Vytvořit místnost" data-balloon-pos="right" on:click={createRoom}  disabled={connecting}>
            <img src="/img/icons/plus.png" alt="Vytvořit místnost" class="icon invert" draggable="false" />
          </button>
        </div>
      </div>


    </ItemList>
    <div class="how-to-play" slot="right">
      <!-- <HowToPlay /> -->
      <Login />
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
