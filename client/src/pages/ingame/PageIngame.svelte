<script lang="ts">
	import Debuger from "../../components/debug/Debuger.svelte";
	import DebugVariable from "../../components/debug/DebugVariable.svelte";
	import LayoutGame from "../../components/layout/LayoutGame.svelte";
	import { IngameRoom } from "../../lib/networking/room";
	import Board from "./Board.svelte";


</script>

<Debuger>
	<DebugVariable name="room" variable={$IngameRoom} />
</Debuger>

<LayoutGame>
	{#if $IngameRoom}
		<Board />
	{/if}
</LayoutGame>
