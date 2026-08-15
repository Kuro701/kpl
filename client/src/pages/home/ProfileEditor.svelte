<script lang="ts">
  import ItemList from "../../components/layout/ItemList.svelte";
  import AvatarPicker from "../../components/AvatarPicker.svelte";
  import { LocalIdentity, setAvatar } from "../../lib/auth/auth";
  import { DEFAULT_AVATAR, normalizeAvatar } from "../../lib/avatars";
  import { autoFocus } from "../../use/auto-focus";

  export let username: string;
  export let disabled: boolean = false;

  let pickerOpen = false;

  $: avatar = normalizeAvatar($LocalIdentity.image) || DEFAULT_AVATAR;

  function choose(event: CustomEvent<string>) {
    setAvatar(event.detail);
    pickerOpen = false;
  }
</script>

<ItemList>
  <div class="identity">
    <button
      class="avatar"
      on:click={() => (pickerOpen = true)}
      {disabled}
      title="Změnit obrázek"
      aria-label="Změnit obrázek"
    >
      <span class="avatar__glyph">{avatar}</span>
      <span class="avatar__hint">změnit</span>
    </button>
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

{#if pickerOpen}
  <AvatarPicker selected={avatar} on:pick={choose} on:close={() => (pickerOpen = false)} />
{/if}

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

  .identity {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
  }

  .avatar {
    position: relative;
    width: 7rem;
    height: 7rem;
    border-radius: 2rem;
    background: var(--avatar-bg);
    border: 1px solid var(--border);
    cursor: var(--cursor-pointer);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    overflow: hidden;
    transition: border-color .15s ease, box-shadow .15s ease, transform .12s ease;
  }
  .avatar:hover:not(:disabled) {
    border-color: var(--accent);
    box-shadow: var(--accent-glow);
    transform: translateY(-2px);
  }
  .avatar:disabled {
    cursor: var(--cursor-not-allowed);
    opacity: .6;
  }

  .avatar__glyph {
    font-size: 3.5rem;
    line-height: 1;
    cursor: inherit;
  }

  .avatar__hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: .2rem 0 .3rem;
    font-size: .65rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--accent-contrast);
    background: var(--accent);
    opacity: 0;
    transition: opacity .15s ease;
    cursor: inherit;
  }
  .avatar:hover:not(:disabled) .avatar__hint {
    opacity: 1;
  }
</style>
