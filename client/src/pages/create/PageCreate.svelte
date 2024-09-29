<script>
  import { navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";

  export let backTo = '/';
</script>
<LayoutMenu>
	<LobbyHeader>
		<LobbyBackButton slot="left" action={() => navigate(backTo)} />
		<h1>Vytvořit místnost</h1>
	</LobbyHeader>
</LayoutMenu>
