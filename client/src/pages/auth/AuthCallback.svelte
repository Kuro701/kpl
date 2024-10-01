<script lang="ts">
	import { navigate } from "svelte-routing";
	import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
	import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
	import { handleDiscordCallback } from "../../lib/auth/discord";

	export let provider: string;

	switch (provider) {
		case 'discord':
			handleDiscordCallback();
			break;
		default:
			navigate('/');
			break;
	}
</script>

<LayoutMenu>
	<LobbyHeader>
		Probíhá přihlašování, prosím čekejte...
	</LobbyHeader>
</LayoutMenu>
