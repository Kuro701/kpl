<script lang="ts">
  import { link, navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
  import { LobbyRooms, type LobbyRoom } from "../../lib/networking/client";
  import RoomWidget from "./RoomWidget.svelte";

  let roomsByState: Record<string, LobbyRoom[]> = {
    lobby: [],
    ingame: [],
  };

  $: roomsByState = $LobbyRooms.reduce((acc, room) => {
    const state = room.state === 'lobby' ? 'lobby' : 'ingame';
    acc[state].push(room);
    return acc;
  }, { lobby: [], ingame: [] } as Record<string, LobbyRoom[]>);
</script>
<LayoutMenu>
  <LobbyHeader>
    <LobbyBackButton slot="left" action={() => navigate('/')} />
    <h1>Místnosti</h1>
    <svelte:fragment slot="right">
      <a class="button" href="/rooms/create" use:link>
        <img src="/img/icons/plus.png" alt="Plus" draggable="false" class="icon invert" />
        Vytvořit místnost
      </a>
    </svelte:fragment>
  </LobbyHeader>


  {#if $LobbyRooms.length === 0}
    <div class="empty">
      Je tu nějak prázdno :c <br />
      Svolej svoje kámoše a pojďte to tady oživit!
    </div>
  {:else}
    <div class="rooms">
      {#each roomsByState.lobby as room (room.uuid)}
        <RoomWidget value={room} />
      {/each}
      {#each roomsByState.ingame as room (room.uuid)}
        <RoomWidget value={room} />
      {/each}

    </div>
  {/if}
</LayoutMenu>


<style>
  .button img {
    height: 1rem;
    width: 1rem;
  }

  .rooms {
    padding: .5rem 2rem;
    display: grid;
    height: 25rem;
    overflow: hidden auto;
    gap: 1rem;

    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    grid-template-rows: min-content;
  }

  .empty {
    padding: .5rem 2rem;
    height: 25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    color: var(--blackish);
    font-weight: 300;
    text-align: center;
  }
</style>
