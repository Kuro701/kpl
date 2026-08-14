<script lang="ts">
  import { afterUpdate, tick } from "svelte";
  import { PlayerIdentity } from "../../../lib/networking/client";
  import { rpcCall } from "../../../lib/networking/req-res-manager";
  import { ChatMessages, CHAT_MAX_LENGTH } from "../../../lib/networking/room";
  import { safeAwait } from "../../../utils/safe-await";

  let draft = '';
  let sending = false;
  let listElement: HTMLElement | null = null;
  let pinnedToBottom = true;

  // Only auto-scroll when the player is already reading the newest messages —
  // yanking the view down while they scroll back is worse than a missed line.
  function onScroll() {
    if (!listElement) return;
    const distanceFromBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight;
    pinnedToBottom = distanceFromBottom < 40;
  }

  afterUpdate(() => {
    if (pinnedToBottom && listElement) {
      listElement.scrollTop = listElement.scrollHeight;
    }
  });

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;

    sending = true;
    draft = '';
    pinnedToBottom = true;

    const [, error] = await safeAwait(rpcCall('sendChatMessage', { text }));
    sending = false;

    if (error) {
      // Put it back so nothing typed is silently lost.
      draft = text;
      return;
    }

    await tick();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  function time(at: string): string {
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="chat">
  <div class="chat__title">Chat</div>

  <div class="chat__messages" bind:this={listElement} on:scroll={onScroll}>
    {#if $ChatMessages.length === 0}
      <div class="chat__empty">Zatím ticho.</div>
    {/if}

    {#each $ChatMessages as message (message.id)}
      {#if message.kind === 'system'}
        <div class="msg msg--system">{message.text}</div>
      {:else}
        <div class="msg" class:msg--mine={message.uuid === $PlayerIdentity?.uuid}>
          <span class="msg__author">{message.username}</span>
          <span class="msg__text">{message.text}</span>
          <span class="msg__time">{time(message.at)}</span>
        </div>
      {/if}
    {/each}
  </div>

  <div class="chat__input">
    <input
      type="text"
      placeholder="Napiš zprávu…"
      maxlength={CHAT_MAX_LENGTH}
      bind:value={draft}
      on:keydown={onKeyDown}
    />
  </div>
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 1rem;
    box-sizing: border-box;
    border-top: 1px solid var(--border);
  }

  .chat__title {
    font-size: .7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .13em;
    color: var(--muted);
    margin-bottom: .6rem;
  }

  .chat__messages {
    flex: 1;
    min-height: 6rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: .45rem;
    font-size: .82rem;
    line-height: 1.4;
    padding-right: .25rem;
  }

  .chat__empty {
    color: var(--muted);
    font-style: italic;
  }

  .msg {
    word-break: break-word;
  }

  .msg--system {
    color: var(--muted);
    font-style: italic;
  }

  .msg__author {
    font-weight: 600;
    color: var(--accent-text);
    margin-right: .3rem;
  }
  .msg__author::after {
    content: ':';
  }

  .msg--mine .msg__author {
    color: var(--fg);
  }

  .msg__text {
    color: var(--fg);
  }

  .msg__time {
    margin-left: .35rem;
    font-size: .66rem;
    color: var(--muted);
    opacity: 0;
    transition: opacity .15s ease;
  }
  .msg:hover .msg__time {
    opacity: 1;
  }

  .chat__input {
    margin-top: .7rem;
  }
  .chat__input input {
    height: 2.2rem;
    font-size: .85rem;
  }

  @media screen and (max-width: 1199px) {
    .chat {
      display: none;
    }
  }
</style>
