<script>
  import { Route, Router } from "svelte-routing";
  import PageEntry from "./pages/home/PageEntry.svelte";
  import PageRules from "./pages/rules/PageRules.svelte";
  import PageCreate from "./pages/create/PageCreate.svelte";
  import PageIngame from "./pages/ingame/PageIngame.svelte";
  import PageJoin from "./pages/home/PageJoin.svelte";
  import SystemMessageWidget from "./components/layout/SystemMessageWidget.svelte";
  import PageResults from "./pages/ingame/PageResults.svelte";
  import { phoneMode } from "./lib/phone-mode";

</script>

<svelte:body
  on:touchstart={() => phoneMode.set(true)}
/>

<Router>
  <Route path="/" component={PageEntry} />
  <Route path="/create" component={PageCreate} backTo="/" />
  <Route path="/rules" component={PageRules} />
  <Route path="/room/:roomUUID" component={PageIngame} />
  <Route path="/join/:roomUUID" component={PageJoin} />
  <Route path="/game-over" component={PageResults} />
</Router>

<SystemMessageWidget />
