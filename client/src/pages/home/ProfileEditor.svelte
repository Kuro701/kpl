<script lang="ts">
  import ItemList from "../../components/layout/ItemList.svelte";
  import { autoFocus } from "../../use/auto-focus";

  export let username: string;
  export let disabled: boolean = false;

</script>

<ItemList>
  <div class="pfp-editor">
    <img src="https://api.dicebear.com/9.x/fun-emoji/svg?seed=dudsugbuiah" alt="Profile" />
  </div>
  <div class="username">
    <div class="username__label">
      <i class="fas fa-user"></i>
      Přezdívka
    </div>
    <div class="username__input">
      <input type="text" bind:value={username} required maxlength="25" {disabled} use:autoFocus />
    </div>
  </div>
</ItemList>

<style>
  .username {
    margin-top: 1rem;
    width: 15rem;
  }

  .pfp-editor img {
    width: 7rem;
    height: 7rem;
    border-radius: .5rem;
  }
</style>
