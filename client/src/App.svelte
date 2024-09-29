<script>
  import { Route, Router } from "svelte-routing";
  import PageEntry from "./pages/home/PageEntry.svelte";
  import PageRooms from "./pages/lobby/PageRooms.svelte";
  import PageRules from "./pages/rules/PageRules.svelte";
  import PageCreate from "./pages/create/PageCreate.svelte";

</script>

<Router>
  <Route path="/" component={PageEntry} />
  <Route path="/create" component={PageCreate} back="/" />
  <Route path="/rooms/create" component={PageCreate} back="/rooms" />
  <Route path="/rooms" component={PageRooms} />
  <Route path="/rules" component={PageRules} />
</Router>
