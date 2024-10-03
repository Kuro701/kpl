<script>
  import { leaveRoom } from "../../../lib/networking/client";
	import { IngameRoom } from "../../../lib/networking/room";

</script>
<!-- <div>
	<div>
		Stat
	</div>
	<div>

	</div>
</div>

<div>
	{$IngameRoom?.name ?? 'Načítání...'}
</div> -->

<div class="wrapper">
	<button class="button button--leave" on:click={leaveRoom}>
		<img src="/img/icons/leave.png" alt="Odhlásit se" class="icon invert" draggable="false" />
		Opustit místnost
	</button>
</div>

<style>
	.wrapper {
		padding: 1rem;
		text-align: center;
		width: 100%;
	}
	.wrapper .button {
		margin-left: auto;
		margin-right: auto;
	}
</style>
