<script lang="ts">
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import { navigate } from "svelte-routing";
	import Debuger from "../../components/debug/Debuger.svelte";
	import DebugVariable from "../../components/debug/DebugVariable.svelte";
	import LayoutGame from "../../components/layout/LayoutGame.svelte";
	import { connectToServer, PlayerIdentity } from "../../lib/networking/client";
	import { rpcCall } from "../../lib/networking/req-res-manager";
	import { IngameRoom, SelectedCards, ServerResponseFn } from "../../lib/networking/room";
	import { LocalIdentity } from "../../lib/auth/auth";
	import { safeAwait } from "../../utils/safe-await";
	import Board from "./Board.svelte";
	import IngameSidebar from "./sidebar/IngameSidebar.svelte";
	import TooltipDisplay from "../../components/layout/TooltipDisplay.svelte";

	export let roomUUID: string = '';

	let joining = false;
	let failed = false;

	/*
	 * This page used to call leaveRoom() when it unmounted, which quietly threw
	 * you out of the room every time you navigated anywhere — including to the
	 * results screen at the end of a game. All three players left at once, the
	 * room emptied, and "play again" came back to a room that no longer existed.
	 *
	 * Leaving is now only ever explicit: the sidebar button, or Odejít on the
	 * results. Arriving here instead makes sure you are in the room, which also
	 * means /room/CODE survives a refresh and works as a link.
	 */
	async function ensureInRoom() {
		if (!roomUUID) {
			navigate('/');
			return;
		}

		if (get(IngameRoom)?.uuid === roomUUID) {
			return;
		}

		joining = true;
		failed = false;

		if (!await connectToServer(get(LocalIdentity).username)) {
			joining = false;
			failed = true;
			return;
		}

		const [joined, error] = await safeAwait(rpcCall<string | false>('joinRoom', { roomUUID }));
		joining = false;

		if (error || !joined) {
			failed = true;
		}
	}

	onMount(ensureInRoom);
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
	{:else}
		<div class="placeholder">
			{#if failed}
				<h2>Místnost nenalezena</h2>
				<p>Nejspíš už skončila nebo ji všichni opustili.</p>
				<button class="button" on:click={() => navigate('/')}>Zpět na začátek</button>
			{:else}
				<h2>{joining ? 'Připojuji do místnosti…' : 'Načítání…'}</h2>
				<p>Kód místnosti: <b>{roomUUID}</b></p>
			{/if}
		</div>
	{/if}
	<IngameSidebar slot="sidebar" />
</LayoutGame>

<TooltipDisplay />

<style>
	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: .75rem;
		text-align: center;
		color: var(--fg);
	}
	.placeholder h2 {
		margin: 0;
		color: var(--accent-text);
		text-shadow: var(--accent-glow);
	}
	.placeholder p {
		margin: 0;
		color: var(--muted);
	}
	.placeholder b {
		font-family: var(--font-mono);
		letter-spacing: .2em;
		color: var(--accent-text);
	}
</style>
