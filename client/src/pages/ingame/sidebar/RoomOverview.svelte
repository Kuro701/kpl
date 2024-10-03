<script>
	import { IngameRoom } from "../../../lib/networking/room";

</script>
<div>
	<div>
		Stat
	</div>
	<div>
		<button class="button button--leade">
			<img src="/img/icons/leave.png" alt="Odhlásit se" class="icon invert" draggable="false" />
		</button>
	</div>
</div>

<div>
	{$IngameRoom?.name ?? 'Načítání...'}
</div>
