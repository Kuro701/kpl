<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-routing";
  import { APP_VERSION } from "../../lib/version";

  /*
   * The server this deck belongs to. Drop the invite in here and the footer
   * turns the name into a link; leave it empty and it stays plain text.
   */
  const COMMUNITY_NAME = 'Mytheder';
  const COMMUNITY_DISCORD: string = '';

  /*
   * The menu is one piece of artwork — dragons, sky and the ornate frame all in
   * a single image — with the UI sitting inside the frame's opening.
   *
   * ART_W/H is the artwork's own size and BOX_* is the opening measured off it,
   * so the stage keeps the art's aspect and everything inside is positioned as
   * a percentage of it. That means the frame is never reconstructed in CSS and
   * never drifts out of alignment: it is the picture, and the UI is placed into
   * the hole in the picture.
   *
   * The content is authored at BOX_W x BOX_H and scaled to whatever the stage
   * works out to, so a small window shrinks the whole menu rather than
   * overflowing the frame.
   */
  const ART_W = 1672;
  const ART_H = 941;
  const BOX_W = 978;
  const BOX_H = 472;

  let stage: HTMLElement | undefined;
  let scale = 1;

  function fit() {
    if (stage) scale = stage.clientWidth / ART_W;
  }

  onMount(() => {
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  });
</script>

<div class="menu">
  <div
    class="stage"
    bind:this={stage}
    style={`--art-w: ${ART_W}; --art-h: ${ART_H}; --box-w: ${BOX_W}px; --box-h: ${BOX_H}px; --menu-scale: ${scale}`}
  >
    <a class="stage__title" href="/" use:link>
      <img src="/img/logo_white.png" alt="Mytheder" draggable="false" />
    </a>

    <div class="stage__content">
      <div class="scaler">
        <slot />
      </div>
    </div>

    <div class="stage__footer">
      <div>
        <div>Made by <span class="maker">Kuro Software</span></div>
        <div class="version">V:{APP_VERSION}</div>
      </div>
      <div>
        <a href="https://instagram.com/6Kuro_Labs9" target="_blank" rel="noopener noreferrer">
          @6Kuro_Labs9
        </a>
      </div>
      <div>
        {#if COMMUNITY_DISCORD}
          <a href={COMMUNITY_DISCORD} target="_blank" rel="noopener noreferrer">{COMMUNITY_NAME}</a>
        {:else}
          {COMMUNITY_NAME}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .menu {
    position: fixed;
    inset: 0;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: var(--bg-deep);
  }

  /* Cover the viewport while keeping the artwork's aspect, and centre it. */
  .stage {
    position: relative;
    aspect-ratio: var(--art-w) / var(--art-h);
    width: max(100vw, calc(100vh * var(--art-w) / var(--art-h)));
    background: url('/img/menu-frame.webp') center / 100% 100% no-repeat;
  }

  .stage__title {
    position: absolute;
    left: 50%;
    top: 9.5%;
    transform: translateX(-50%);
    width: 34%;
    display: block;
  }
  .stage__title img {
    width: 100%;
    display: block;
    filter: drop-shadow(0 0 22px rgb(var(--accent-rgb) / .4));
  }

  /* The frame's opening, measured off the artwork. */
  .stage__content {
    position: absolute;
    left: 20.81%;
    top: 28.06%;
    width: 58.49%;
    height: 50.16%;
    display: grid;
    place-items: center;
  }
  .scaler {
    width: var(--box-w);
    height: var(--box-h);
    transform: scale(var(--menu-scale, 1));
    transform-origin: center;
    display: flex;
    flex-direction: column;
    overflow: hidden auto;
  }

  .stage__footer {
    position: absolute;
    left: 0;
    right: 0;
    top: 85.5%;
    display: flex;
    justify-content: center;
    gap: 1.4em;
    font-size: calc(var(--menu-scale, 1) * 15px);
    color: var(--muted);
    cursor: var(--cursor-text);
  }
  .stage__footer > div {
    border-right: 1px solid rgb(var(--accent-rgb) / .22);
    padding-right: 1.4em;
  }
  .stage__footer > div:last-child {
    border-right: none;
    padding-right: 0;
  }
  .stage__footer .maker {
    color: var(--fg);
    font-weight: 500;
  }
  .stage__footer .version {
    margin-top: .15em;
    font-size: .78em;
    letter-spacing: .06em;
    opacity: .7;
  }
  .stage__footer a {
    color: var(--muted);
    text-decoration: underline;
    text-underline-offset: .18em;
    transition: color .16s ease;
  }
  .stage__footer a:hover {
    color: var(--accent-text);
  }

  /*
   * Too narrow for a 16:9 painting: the dragons would be cropped to slivers and
   * the frame would run off both sides. Drop the artwork and lay the menu out
   * as an ordinary page instead.
   */
  @media (max-width: 62rem) {
    .menu {
      position: static;
      display: block;
      overflow: visible;
      background: var(--bg);
      background-image:
        radial-gradient(60rem 38rem at 50% 30%, rgb(var(--accent-rgb) / .13), transparent 70%),
        radial-gradient(34rem 26rem at 84% 92%, rgb(var(--accent-2-rgb) / .10), transparent 72%);
      background-repeat: no-repeat;
      min-height: 100vh;
      padding: 1.5rem 1rem;
    }
    .stage {
      width: 100%;
      aspect-ratio: auto;
      background: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .stage__title {
      position: static;
      transform: none;
      width: min(22rem, 80%);
    }
    .stage__content {
      position: static;
      width: 100%;
      max-width: 42rem;
      height: auto;
      display: block;
      background: var(--panel);
      border: 1px solid var(--accent-dim);
      border-radius: var(--radius-lg);
      box-shadow: 0 1.5rem 3.5rem rgba(0, 0, 0, .55), var(--accent-glow);
    }
    .scaler {
      width: 100%;
      height: auto;
      transform: none;
      overflow: visible;
    }
    .stage__footer {
      position: static;
      font-size: .9rem;
      flex-wrap: wrap;
      align-items: flex-start;
    }
  }
</style>
