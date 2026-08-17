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
	let reason = '';

	/*
	 * The server puts a player who dropped out of a running game straight back
	 * into it as soon as they authenticate — no code needed. That arrives as a
	 * pushed room update a moment after the socket is up, so give it a beat
	 * before asking to join, or we race it and ask for a seat we already have.
	 */
	function waitForRoom(ms: number): Promise<boolean> {
		if (get(IngameRoom)) return Promise.resolve(true);

		return new Promise(resolve => {
			let done = false;
			const finish = (value: boolean) => {
				if (done) return;
				done = true;
				unsubscribe();
				clearTimeout(timer);
				resolve(value);
			};

			const timer = setTimeout(() => finish(false), ms);
			const unsubscribe = IngameRoom.subscribe(room => {
				if (room) finish(true);
			});
		});
	}

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
		reason = '';

		if (!await connectToServer(get(LocalIdentity).username)) {
			joining = false;
			failed = true;
			reason = 'Server neodpovídá. Může se zrovna probouzet — zkus to za chvíli znovu.';
			return;
		}

		// Already back at the table? Then there is nothing to ask for.
		if (await waitForRoom(1500)) {
			joining = false;
			return;
		}

		const [joined, error] = await safeAwait(rpcCall<string | false>('joinRoom', { roomUUID }));
		joining = false;

		if (error || !joined) {
			failed = true;
			reason = error
				? 'Server neodpověděl včas.'
				: 'Místnost už neexistuje, je plná, nebo v ní běží hra, které ses neúčastnil.';
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
				<h2>Nepodařilo se připojit</h2>
				<p>{reason}</p>
				<p>Kód místnosti: <b>{roomUUID}</b></p>
				<div class="actions">
					<button class="button" on:click={ensureInRoom}>Zkusit znovu</button>
					<button class="button" on:click={() => navigate('/')}>Zpět na začátek</button>
				</div>
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
	.actions {
		display: flex;
		gap: .5rem;
		margin-top: .5rem;
	}
	.placeholder b {
		font-family: var(--font-mono);
		letter-spacing: .2em;
		color: var(--accent-text);
	}
</style>
