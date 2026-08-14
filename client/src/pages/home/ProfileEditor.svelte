<script lang="ts">
  import ItemList from "../../components/layout/ItemList.svelte";
  import { LocalIdentity } from "../../lib/auth/auth";
  import { autoFocus } from "../../use/auto-focus";

  export let username: string;
  export let disabled: boolean = false;
</script>

<ItemList>
  <div class="identity">
    <div class="pfp-editor">
      <img
        src={$LocalIdentity.image || `https://api.dicebear.com/9.x/dylan/svg?mood=happy,hopeful,superHappy&seed=${encodeURIComponent(username)}`}
        alt="Profile"
        draggable="false"
        referrerpolicy="no-referrer"
      />
    </div>
  </div>
  <div class="username">
    <div class="username__label">
      Přezdívka
    </div>
    <div class="username__input">
      <input
        type="text"
        bind:value={username}
        required
        maxlength="24"
        {disabled}
        use:autoFocus
      />
    </div>
  </div>
</ItemList>

<style>
  .username {
    margin-top: 1rem;
    width: 15rem;
  }

  .username__label {
    font-size: .8rem;
    color: var(--muted);
    margin-bottom: .35rem;
  }

  .pfp-editor {
    display: flex;
    justify-content: center;
  }

  .pfp-editor img {
    width: 7rem;
    height: 7rem;
    border-radius: 2rem;
    background: var(--avatar-bg);
  }

  .identity {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
  }
</style>
