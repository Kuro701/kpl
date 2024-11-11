<script>
	import { leaveRoom } from "../../../lib/networking/client";
	import { IngameRoom } from "../../../lib/networking/room";

</script>

<div class="room-info-wraper">
	<div class="room-name">
		{$IngameRoom?.name ?? "Místnost"}
	</div>
	<div class="room-info">
		<div class="room-visibility">
			{$IngameRoom?.isPublic ? "Veřejná" : "Soukromá"} hra
		</div>
		<div class="room-players">
			{$IngameRoom?.players.length ?? 0}/{$IngameRoom?.maxPlayers ?? 0} hráčů
		</div>
		<div class="room-goal">
			cíl {$IngameRoom?.goal ?? 0} bodů
		</div>
	</div>
</div>

<div class="leave-wrapper">
	<button class="button button--leave" on:click={leaveRoom}>
		<img src="/img/icons/leave.png" alt="Odhlásit se" class="icon invert" draggable="false" />
		<span>Opustit místnost</span>
	</button>
</div>

<style>
	.leave-wrapper {
		padding: 1rem;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
	}
	.leave-wrapper .button {
		margin-left: auto;
		margin-right: auto;
	}

	.room-info-wraper {
		padding: 1rem;
		box-sizing: border-box;
		background-color: rgb(0, 0, 0, .25);
	}

	.room-name {
		text-transform: capitalize;
		text-align: center;
	}
	.room-info {
		display: flex;
		justify-content: center;
		gap: 1rem;
		color: rgb(255, 255, 255, .5);
		font-size: .8rem;
	}
</style>
