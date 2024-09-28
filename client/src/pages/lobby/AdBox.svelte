<script>
  import ProfileEditor from './ProfileEditor.svelte';

  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { connect, sendRaw, waitForIdentity } from '../../lib/networking/client';
  import { randomUsername } from '../../lib/random';
  import { navigate } from 'svelte-routing';
  import { safeAwait } from '../../utils/safe-await';
  import { encodeNetworkMessage, MessageType } from '../../lib/networking/encoder';
  import KartyBezCenzury from '../../components/ad/KartyBezCenzury.svelte';

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
    sendRaw(encodeNetworkMessage('', MessageType.PLAIN, 'join_random'));
  }

  async function showLobby() {
    if(!await connectToServer()) return;
    navigate('/lobby');
  }

  async function createRoom() {
    if(!await connectToServer()) return;
    navigate('/create');
  }
</script>

<div class="sponsor-wrap">
	<div class="sponsor-label">
		Sponzorováno
	</div>
	<div class="sponsor">
		<KartyBezCenzury />
	</div>
</div>

<style>
  .sponsor-wrap {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: .25rem;
	align-items: center;
  }
  .sponsor {
    width: calc(100% - 5rem);
    height: 8rem;
    background-color: gray;
    overflow: hidden;
    position: relative;
    border-radius: .5rem;
  }
  .sponsor-label {
    font-size: .75rem;
    opacity: .8;
    margin-top: 1rem;
    width: calc(100% - 5rem);
    padding-left: .5rem;
    cursor: var(--cursor-text);
  }
</style>

