<script lang="ts">
  import { IngameRoom } from "../../../lib/networking/room";
  import RoomChat from "./RoomChat.svelte";
  import RoomOverview from "./RoomOverview.svelte";
  import RoomPlayers from "./RoomPlayers.svelte";
  import VolumeSettings from "./VolumeSettings.svelte";


</script>

<div class="sidebar">
  <RoomOverview />
  <RoomPlayers />
  <RoomChat />

  <div class="down">
    <VolumeSettings />
  </div>
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-deep);
    color: var(--fg);
  }
  .down {
    margin-top: auto;
    border-top: 1px solid var(--border);
  }
</style>
