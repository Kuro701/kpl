<script lang="ts">
  import { link, navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
  import { LobbyRooms } from "../../lib/networking/client";
  import { safeAwait } from "../../utils/safe-await";
  import { rpcCall } from "../../lib/networking/req-res-manager";

  let working = false;
  async function joinRoom(roomId: string) {
    if (working) return;
    working = true;

    const [roomUUID, error] = await safeAwait(rpcCall('joinRoom', {
      roomUUID: roomId,
    }));

    if (error || !roomUUID) {
      console.error(error);
      working = false;
      return;
    }

    navigate(`/room/${roomUUID}`);
  }
</script>
<LayoutMenu>
  <LobbyHeader>
    <LobbyBackButton slot="left" action={() => navigate('/')} />
    <h1>Místnosti</h1>
    <svelte:fragment slot="right">
      <a class="button button--social" aria-label="Vytvořit místnost" data-balloon-pos="down" href="/rooms/create" use:link>
        <img src="/img/icons/plus.png" alt="Pravidla" draggable="false" />
      </a>
    </svelte:fragment>
  </LobbyHeader>



  <div class="rooms">
    {#each $LobbyRooms as room}
      <pre>{JSON.stringify(room, null, 2)}</pre>
      <button class="button" on:click={() => joinRoom(room.uuid)}>
        Připojit se
      </button>
    {/each}
  </div>
</LayoutMenu>


<style>
  .button--social img {
    height: 2rem;
    width: 2rem;
  }
</style>
