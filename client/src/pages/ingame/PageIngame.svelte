<script lang="ts">
	import Debuger from "../../components/debug/Debuger.svelte";
	import DebugVariable from "../../components/debug/DebugVariable.svelte";
	import LayoutGame from "../../components/layout/LayoutGame.svelte";
  import { PlayerIdentity } from "../../lib/networking/client";
	import { IngameRoom, SelectedCards, ServerResponseFn } from "../../lib/networking/room";
	import Board from "./Board.svelte";


</script>

<Debuger>
	<DebugVariable name="player" variable={$PlayerIdentity} />
	<DebugVariable name="serverWaitingResponse" variable={!!$ServerResponseFn} />
	<DebugVariable name="selected" variable={$SelectedCards} />
	<DebugVariable name="room" variable={$IngameRoom} />
</Debuger>

<LayoutGame>
	{#if $IngameRoom}
		<Board />
	{/if}
</LayoutGame>
