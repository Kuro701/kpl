<script lang="ts">
	import ProfileEditor from './ProfileEditor.svelte';
	import ItemList from "../../components/layout/ItemList.svelte";
	import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
	import TwoColumns from "../../components/layout/TwoColumns.svelte";
	import { connectToServer, type LobbyRoom } from '../../lib/networking/client';
	import { navigate } from 'svelte-routing';
	import { safeAwait } from '../../utils/safe-await';
	import LobbyHeader from '../../components/layout/LobbyHeader.svelte';
	import { rpcCall } from '../../lib/networking/req-res-manager';
	import { LocalIdentity } from '../../lib/auth/auth';
	import Debuger from '../../components/debug/Debuger.svelte';
	import DebugVariable from '../../components/debug/DebugVariable.svelte';
	import LoginOptions from './LoginOptions.svelte';
	import RoomPictogram from '../lobby/RoomPictogram.svelte';

	export let roomUUID: string;
	let connecting = false;
	let loading = true;

	let username = $LocalIdentity.username;
	let roomInfo: null | LobbyRoom = null;

	async function joinRoom() {
	  if(!await connectToServer(username)) return;
	  const [roomId, error] = await safeAwait(rpcCall('joinRoom', {
		roomUUID: roomUUID,
	  }));

	  if (error) {
		console.error('Failed to join random room:', error);
		return;
	  }

	  navigate(`/room/${roomId}`);
	}

	async function updateRoomInfo() {
		if (!await connectToServer(username)) return;

		const [roomInfoResponse, error] = await safeAwait(rpcCall<LobbyRoom|false>('getRoomInfo', {
			roomUUID: roomUUID,
		}));

		if (error || !roomInfoResponse) {
			// TODO: Show room not found error
			loading = false;
			return;
		}

		roomInfo = roomInfoResponse;
		loading = false;
	}
	updateRoomInfo();

  </script>

  <Debuger>
	<DebugVariable name="roomInfo" variable={roomInfo} />
	<DebugVariable name="identity" variable={$LocalIdentity} />
  </Debuger>

  <LayoutMenu>
	<LobbyHeader>
	  <h1>{loading ? 'Načítání...' : 'Připojit se do hry'}</h1>
	</LobbyHeader>

	<ItemList>
		<TwoColumns>
			<ItemList slot="left">
				<h2>Identita</h2>
				<ProfileEditor bind:username disabled={connecting} />

				{#if $LocalIdentity.provider === 'anonymous'}
					<div class="or">nebo</div>
					<LoginOptions />
				{/if}
			</ItemList>
			<ItemList slot="right">
				{#if roomInfo}
					<div class="room">
						<h2>{roomInfo.name}</h2>
						<RoomPictogram
							src="/img/icons/user.png"
							alt="Počet hráčů"
							text={`${roomInfo.playerCount}/${roomInfo.maxPlayers}`}
							horizontal
						/>
						{#if roomInfo.state === 'lobby'}
							<RoomPictogram
								src="/img/icons/waiting.png"
								alt="Stav místnosti"
								text="Čeká na start"
								horizontal
							/>
						{:else}
							<RoomPictogram
								src="/img/icons/ingame.png"
								alt="Stav místnosti"
								text="Ve hře"
								horizontal
							/>
						{/if}
						<RoomPictogram
							src="/img/icons/goal.png"
							alt="Cílový počet bodů"
							text={`${roomInfo.goal}`}
							horizontal
						/>
					</div>
					<div class="actions">
						<button class="button" on:click={joinRoom}>
							<img src="/img/icons/play.png" alt="Náhodná hra" draggable="false" class="icon invert" />
							Připojit se
						</button>
					</div>
				{:else if !loading}
					<div class="no-room">
						<h2>Místnost neexistuje</h2>
						<p>Je nám líto, ale místnost do které se snažíte připojit již neexistuje</p>
					</div>
				{/if}
			</ItemList>
		</TwoColumns>
	</ItemList>
	<br />
	<br />
</LayoutMenu>

<style>
	h1 {
	  margin-bottom: 0;
	}
	.actions {
		margin: 1rem 0;
	}
	.or {
		text-align: center;
		font-size: .8rem;
		opacity: .5;
	}
	.room {
		display: flex;
		flex-direction: column;
		gap: .5rem;
	}
	.no-room {
		text-align: center;
	}
	.no-room p {
		font-size: .8rem;
		color: #333;
	}

</style>
