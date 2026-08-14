<script lang="ts">
  import ProfileEditor from './ProfileEditor.svelte';
  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { connectToServer } from '../../lib/networking/client';
  import { navigate, link } from 'svelte-routing';
  import LobbyHeader from '../../components/layout/LobbyHeader.svelte';
  import { LocalIdentity } from '../../lib/auth/auth';
  import Debuger from '../../components/debug/Debuger.svelte';
  import DebugVariable from '../../components/debug/DebugVariable.svelte';

  const CODE_LENGTH = 5;

  let connecting = false;
  let username = $LocalIdentity.username;

  let code = '';
  let codeError = '';

  // Codes are shared out loud and over chat, so be forgiving: lowercase, spaces,
  // dashes, and the classic O/0 and I/L/1 mix-ups all resolve to the same room.
  function cleanCode(raw: string): string {
    return raw
      .toUpperCase()
      .replace(/[\s\-_]/g, '')
      .replace(/O/g, '0')
      .replace(/[IL]/g, '1')
      .replace(/[^0-9A-Z]/g, '')
      .slice(0, CODE_LENGTH);
  }

  function onCodeInput(event: Event) {
    code = cleanCode((event.target as HTMLInputElement).value);
    codeError = '';
  }

  function joinByCode() {
    const clean = cleanCode(code);

    if (clean.length !== CODE_LENGTH) {
      codeError = `Kód má ${CODE_LENGTH} znaků.`;
      return;
    }

    navigate(`/join/${clean}`);
  }

  function onCodeKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      joinByCode();
    }
  }

  async function createRoom() {
    connecting = true;
    if (!await connectToServer(username)) {
      connecting = false;
      return;
    }
    connecting = false;
    navigate('/create');
  }
</script>

<Debuger>
  <DebugVariable name="identity" variable={$LocalIdentity} />
</Debuger>

<LayoutMenu>
  <LobbyHeader>
    <h1>Hrát</h1>
    <div class="header-actions" slot="right">
      <a class="button button--ghost" aria-label="Pravidla" data-balloon-pos="down" href="/rules" use:link>
        <img src="/img/icons/rules.png" alt="Pravidla" draggable="false" class="icon invert" />
      </a>
    </div>
  </LobbyHeader>

  <TwoColumns>
    <ItemList slot="left">
      <h2>Nová hra</h2>
      <p class="sub">Vyber si přezdívku, založ místnost a pošli kámošům kód.</p>

      <ProfileEditor bind:username disabled={connecting} />

      <div class="actions">
        <button class="button button--primary" class:button--loading={connecting} on:click={createRoom} disabled={connecting}>
          <img src="/img/icons/plus.png" alt="" class="icon invert" draggable="false" />
          Vytvořit místnost
        </button>
      </div>
    </ItemList>

    <div class="join" slot="right">
      <div class="joinbox">
        <h2>Připojit se kódem</h2>
        <p class="sub">Kámoš ti poslal kód místnosti? Hoď ho sem.</p>

        <input
          class="code-input"
          type="text"
          inputmode="latin"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength={CODE_LENGTH}
          placeholder="•••••"
          value={code}
          on:input={onCodeInput}
          on:keydown={onCodeKey}
        />

        {#if codeError}
          <div class="code-error">{codeError}</div>
        {:else}
          <div class="code-hint">nebo klikni na odkaz, který ti poslal</div>
        {/if}

        <button class="button button--primary button--wide" on:click={joinByCode} disabled={code.length !== CODE_LENGTH}>
          Připojit se
        </button>
      </div>
    </div>
  </TwoColumns>
</LayoutMenu>

<style>
  h1 {
    margin-bottom: 0;
  }

  .sub {
    margin: .25rem 0 1rem 0;
    font-size: .85rem;
    color: var(--muted);
  }

  .actions {
    display: flex;
    flex-direction: column;
    width: 15rem;
    gap: .5rem;
    margin: 1rem 0 2rem 0;
  }

  .join {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 1rem 0 2rem 0;
    box-sizing: border-box;
  }

  .joinbox {
    width: 100%;
    max-width: 20rem;
    padding: 1.25rem;
    border-radius: var(--radius-lg);
    background: var(--joinbox-bg);
    border: 1px solid var(--accent-dim);
    box-sizing: border-box;
  }

  .joinbox h2 {
    margin: 0;
    font-size: 1rem;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--accent-text);
  }

  .code-input {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: .34em;
    text-align: center;
    text-transform: uppercase;
    height: 3rem;
    text-indent: .34em;
  }

  .code-hint,
  .code-error {
    margin: .5rem 0 .85rem 0;
    font-size: .7rem;
    text-align: center;
    color: var(--muted);
  }

  .code-error {
    color: var(--danger);
  }

  .header-actions {
    display: flex;
    gap: 1rem;
  }
</style>
