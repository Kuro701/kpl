<script lang="ts">
  import ItemList from "../../components/layout/ItemList.svelte";
  import { LocalIdentity, logout } from "../../lib/auth/auth";
  import { autoFocus } from "../../use/auto-focus";

  export let username: string;
  export let disabled: boolean = false;
</script>

<ItemList>
  <div class="identity">
    {#if $LocalIdentity.provider !== 'anonymous'}
      <div class="identity__label">
        <img src="/img/provider/{$LocalIdentity.provider}.svg" alt="Provider" draggable="false" />
        {$LocalIdentity.username}
      </div>
    {/if}
    <div class="pfp-editor">
      <img
        class:provider--discord={$LocalIdentity.provider === 'discord'}
        src={$LocalIdentity.image || `https://api.dicebear.com/9.x/dylan/svg?mood=happy,hopeful,superHappy&seed=${username}`}
        alt="Profile"
        draggable="false"
      />
    </div>
    {#if $LocalIdentity.provider !== 'anonymous'}
      <button class="button button--logout" on:click={logout}>
        <img src="/img/icons/leave.png" alt="Odhlásit se" draggable="false" />
        Odhlásit se
      </button>
    {/if}
  </div>
  <div class="username">
    <div class="username__label">
      <i class="fas fa-user"></i>
      Přezdívka
    </div>
    <div class="username__input">
      <input
        type="text"
        bind:value={username}
        required
        maxlength="25"
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

  .pfp-editor {
    display: flex;
    justify-content: center;
  }

  .pfp-editor img {
    width: 7rem;
    height: 7rem;
    border: 5px solid transparent;
    border-radius: 1rem;
  }

  .identity {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
  }

  .identity__label {
    display: flex;
    align-items: center;
    gap: .5rem;
    justify-content: center;
    margin-bottom: .5rem;
  }
  .identity__label img {
    width: 1.5rem;
    height: 1.5rem;
  }

  .pfp-editor img.provider--discord {
    border: 5px solid  #7289da;
  }

  .button--logout {
    background-color: transparent;
    border: none;
    color: #333;
    font-size: .9rem;
    padding: 0;
    margin: 0;
    height: auto;
    text-align: center;
    margin-top: .5rem;
  }
  .button--logout:hover {
    color: #000;
  }
  .button--logout img {
    width: 1rem;
    height: 1rem;
  }
</style>
