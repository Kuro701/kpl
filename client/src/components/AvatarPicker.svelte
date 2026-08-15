<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { AVATAR_GROUPS } from "../lib/avatars";

  export let selected: string;

  const dispatch = createEventDispatcher<{ pick: string; close: void }>();

  function pick(avatar: string) {
    dispatch('pick', avatar);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={onKeyDown} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="backdrop" on:click={() => dispatch('close')}>
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="sheet" on:click|stopPropagation>
    <div class="sheet__head">
      <h3>Vyber si obrázek</h3>
      <button class="close" on:click={() => dispatch('close')} aria-label="Zavřít">✕</button>
    </div>

    <div class="sheet__body">
      {#each AVATAR_GROUPS as group}
        <div class="group">
          <div class="group__name">{group.name}</div>
          <div class="grid">
            {#each group.avatars as avatar}
              <button
                class="avatar"
                class:avatar--selected={avatar === selected}
                on:click={() => pick(avatar)}
                title={avatar}
              >
                {avatar}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0, 0, 0, .65);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    box-sizing: border-box;
  }

  .sheet {
    width: min(30rem, 100%);
    max-height: min(34rem, 100%);
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--accent-dim);
    border-radius: var(--radius-lg);
    box-shadow: 0 1.5rem 3.5rem rgba(0, 0, 0, .6), var(--accent-glow);
    overflow: hidden;
  }

  .sheet__head {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .sheet__head h3 {
    margin: 0;
    flex: 1;
    font-size: 1rem;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--accent-text);
  }

  .close {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 1rem;
    padding: .25rem .5rem;
    cursor: var(--cursor-pointer);
    border-radius: var(--radius);
  }
  .close:hover {
    color: var(--fg);
    background: var(--surface-hover);
  }

  .sheet__body {
    overflow-y: auto;
    padding: 1rem 1.25rem 1.25rem;
  }

  .group + .group {
    margin-top: 1.25rem;
  }
  .group__name {
    font-size: .7rem;
    font-weight: 600;
    letter-spacing: .13em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: .6rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
    gap: .5rem;
  }

  .avatar {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    line-height: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: var(--cursor-pointer);
    transition: transform .12s ease, border-color .15s ease, background-color .15s ease;
  }
  .avatar:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }
  .avatar--selected {
    border-color: var(--accent);
    background: var(--chip-bg-hover);
    box-shadow: var(--accent-glow);
  }
</style>
