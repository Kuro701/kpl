<script lang="ts">
  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { randomUsername } from "../../lib/random";

  export let username: string;

</script>

<ItemList>
  <div class="pfp-editor">

  </div>
  <div class="username">
    <div class="username__label">
      <i class="fas fa-user"></i>
      Přezdívka
    </div>
    <div class="username__input">
      <input type="text" bind:value={username} required maxlength="25" />
    </div>
  </div>
</ItemList>

<style>
  .username {
    width: 15rem;
  }
</style>
