<script>
  import { Route, Router } from "svelte-routing";
  import PageEntry from "./pages/lobby/PageEntry.svelte";
  import PageRooms from "./pages/lobby/PageRooms.svelte";

</script>

<Router>
  <Route path="/" component={PageEntry} />
  <Route path="/lobby" component={PageRooms} />
</Router>
