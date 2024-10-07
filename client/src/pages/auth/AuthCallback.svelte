<script lang="ts">
	import { navigate } from "svelte-routing";
	import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
	import LobbyHeader from "../../components/layout/LobbyHeader.svelte";
	import { handleDiscordCallback } from "../../lib/auth/discord";
	import { handleGoogleCallback } from "../../lib/auth/google";

	export let provider: string;

	switch (provider) {
		case 'discord':
			handleDiscordCallback();
			break;
		case 'google':
			handleGoogleCallback();
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
