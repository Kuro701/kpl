<script lang="ts">
	import { navigate } from "svelte-routing";
	import type { LobbyRoom } from "../../lib/networking/client";
	import { rpcCall } from "../../lib/networking/req-res-manager";
	import { safeAwait } from "../../utils/safe-await";
	import RoomPictogram from "./RoomPictogram.svelte";

</script>

<div class="room">
	<div class="room__name">
		Neveřejná místnost
	</div>
	<div class="room__info">
		<RoomPictogram src="/img/icons/user.png" alt="Počet hráčů" text="-" />
		<RoomPictogram src="/img/icons/ingame.png" alt="Stav místnosti" text="-" />
		<RoomPictogram src="/img/icons/goal.png" alt="Cílový počet bodů" text="-" />
	</div>
</div>

<style>
	.room {
		border-radius: .5rem;
		height: min-content;
		border: 1px solid #000;
		opacity: .5;
		padding: .5rem;
		display: flex;
		flex-direction: column;
		font-family: inherit;
		gap: .5rem;
		background: transparent;
	}
	.room:hover {
		background: rgb(0 0 0 / 5%);
	}

	.room__name {
		font-weight: 600;
		font-size: 1rem;
		text-transform: capitalize;
		text-align: center;
		width: 100%;
	}
	.room__info {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		width: 100%;
	}
</style>
