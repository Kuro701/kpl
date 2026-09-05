<script lang="ts">
	import { asset } from '../../lib/asset';
  import ProfileEditor from './ProfileEditor.svelte';
  import ItemList from "../../components/layout/ItemList.svelte";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import TwoColumns from "../../components/layout/TwoColumns.svelte";
  import { connectToServer } from '../../lib/networking/client';
  import { rpcCall } from '../../lib/networking/req-res-manager';
  import { safeAwait } from '../../utils/safe-await';
  import { link } from 'svelte-routing';
  import { navigate, route } from '../../lib/nav';
  import LobbyHeader from '../../components/layout/LobbyHeader.svelte';
  import { LocalIdentity } from '../../lib/auth/auth';
  import Debuger from '../../components/debug/Debuger.svelte';
  import DebugVariable from '../../components/debug/DebugVariable.svelte';

  const CODE_LENGTH = 5;

  let connecting = false;
  let username = $LocalIdentity.username;

  let code = '';
  let codeError = '';

  /*
   * Solo mode. Bottom-right of the entry screen, deliberately quiet. The code
   * itself lives on the server (SOLO_CODE); this only sends what was typed, so
   * there is nothing to find in the bundle.
   */
  let soloAvailable = false;
  let soloOpen = false;
  let soloCode = '';
  let soloError = '';
  let soloBusy = false;

  async function revealSolo() {
    soloOpen = true;
    if (!await connectToServer(username)) return;
    const [features] = await safeAwait(rpcCall<{ solo?: boolean }>('serverFeatures'));
    soloAvailable = !!features?.solo;
  }

  async function startSolo() {
    const entered = soloCode.trim();
    if (soloBusy || !entered) return;
    soloBusy = true;
    soloError = '';

    if (!await connectToServer(username)) {
      soloError = 'Server neodpovídá.';
      soloBusy = false;
      return;
    }

    const [roomUUID, error] = await safeAwait(
      rpcCall<string | false>('startSoloGame', { code: entered, bots: 3 })
    );
    soloBusy = false;

    if (error || !roomUUID) {
      soloError = 'Špatný kód.';
      return;
    }
    navigate(`/room/${roomUUID}`);
  }

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
      <a class="button button--ghost" aria-label="Pravidla" data-balloon-pos="down" href={route('/rules')} use:link>
        <img src={asset('/img/icons/rules.png')} alt="Pravidla" draggable="false" class="icon invert" />
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
          <img src={asset('/img/icons/plus.png')} alt="" class="icon invert" draggable="false" />
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

  <!-- Solo mode. Quiet on purpose: a dot in the corner until you click it. -->
<div class="solo" class:solo--open={soloOpen}>
  {#if !soloOpen}
    <button class="solo__dot" on:click={revealSolo} aria-label="Solo">•</button>
  {:else}
    <div class="solo__box">
      {#if soloAvailable}
        <input
          class="solo__input"
          type="password"
          placeholder="kód"
          bind:value={soloCode}
          on:keydown={(e) => e.key === 'Enter' && startSolo()}
          disabled={soloBusy}
          autocomplete="off"
        />
        <button class="solo__go" on:click={startSolo} disabled={soloBusy || !soloCode.trim()}>
          {soloBusy ? '…' : 'Solo'}
        </button>
      {:else}
        <span class="solo__off">nedostupné</span>
      {/if}
      <button class="solo__x" on:click={() => { soloOpen = false; soloCode = ''; soloError = ''; }} aria-label="Zavřít">×</button>
    </div>
    {#if soloError}<p class="solo__err">{soloError}</p>{/if}
  {/if}
</div>

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

  /* ── solo mode control ───────────────────────────────────────── */
  .solo {
    /* fixed to the viewport — must live outside LayoutMenu, whose .scaler
       is transformed and would otherwise become its containing block */
    position: fixed;
    right: 10px;
    bottom: 8px;
    z-index: 5;
    text-align: right;
  }
  /* Discreet, but it has to survive sitting on top of bright artwork — a bare
     low-opacity glyph vanishes completely over the dragons. Its own small dark
     chip gives it a constant background to read against. */
  .solo__dot {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 0.5);
    border: 1px solid rgb(255 255 255 / 0.28);
    border-radius: 50%;
    color: rgb(255 255 255 / 0.5);
    font-size: 17px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
  }
  .solo__dot:hover {
    color: rgb(var(--accent-rgb));
    border-color: rgb(var(--accent-rgb) / 0.6);
    background: rgb(0 0 0 / 0.75);
  }
  .solo__box {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgb(0 0 0 / 0.55);
    border: 1px solid rgb(var(--accent-rgb) / 0.4);
    border-radius: 6px;
    padding: 5px 6px;
  }
  .solo__input {
    width: 90px;
    background: rgb(0 0 0 / 0.4);
    border: 1px solid rgb(var(--accent-rgb) / 0.25);
    border-radius: 4px;
    color: #fff;
    font: inherit;
    font-size: 12px;
    padding: 4px 6px;
  }
  .solo__go, .solo__x {
    background: none;
    border: 0;
    color: rgb(var(--accent-rgb));
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    padding: 4px 6px;
  }
  .solo__go[disabled] { opacity: 0.4; cursor: default; }
  .solo__x { color: rgb(255 255 255 / 0.4); font-size: 15px; }
  .solo__off { font-size: 11.5px; color: rgb(255 255 255 / 0.4); padding: 0 4px; }
  .solo__err { margin: 5px 0 0; font-size: 11.5px; color: #ff8a78; }
</style>
