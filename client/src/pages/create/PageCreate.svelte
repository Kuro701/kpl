<script>
  import { navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
  import { randomRoomName } from "../../lib/random";
  import RoomSettings from "./RoomSettings.svelte";
  import { safeAwait } from "../../utils/safe-await";
  import { rpcCall } from "../../lib/networking/req-res-manager";

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

  let working = false;
  async function createRoom() {
    working = true;

    // TODO: Validate settings


    const [roomUUID, error] = await safeAwait(rpcCall('createRoom', settings));
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

</script>
<LayoutMenu>
	<LobbyHeader>
		  <LobbyBackButton slot="left" action={back} />
		<h1>Vytvořit místnost</h1>
	</LobbyHeader>
  <div class="room-creator">
    <RoomSettings bind:value={settings} />
    <div class="card-packs">

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
</style>
