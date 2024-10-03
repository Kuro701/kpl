<script>
  import { Route, Router } from "svelte-routing";
  import PageEntry from "./pages/home/PageEntry.svelte";
  import PageRooms from "./pages/lobby/PageRooms.svelte";
  import PageRules from "./pages/rules/PageRules.svelte";
  import PageCreate from "./pages/create/PageCreate.svelte";
  import PageIngame from "./pages/ingame/PageIngame.svelte";
  import AuthCallback from "./pages/auth/AuthCallback.svelte";
  import PageJoin from "./pages/home/PageJoin.svelte";
  import SystemMessageWidget from "./components/layout/SystemMessageWidget.svelte";
  import PageResults from "./pages/ingame/PageResults.svelte";

</script>

<Router>
  <Route path="/" component={PageEntry} />
  <Route path="/create" component={PageCreate} backTo="/" />
  <Route path="/rooms/create" component={PageCreate} backTo="/rooms" />
  <Route path="/rooms" component={PageRooms} />
  <Route path="/rules" component={PageRules} />
  <Route path="/room/:roomUUID" component={PageIngame} />
  <Route path="/join/:roomUUID" component={PageJoin} />
  <Route path="/game-over" component={PageResults} />
  <Route path="/auth/callback/:provider" component={AuthCallback} />
</Router>

<SystemMessageWidget />
