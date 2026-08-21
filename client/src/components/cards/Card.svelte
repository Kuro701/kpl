<script lang="ts">
  import CardTip from "./CardTip.svelte";

  export let black: boolean = false;
  export let show: boolean = true;
  export let text: string = "";
  export let shrink: boolean = false;
  export let noMargin: boolean = false;
  export let marked: boolean = false;
  export let tip: string | null = null;

  /*
   * Cards are a fixed size and the text is not: white cards run to 132
   * characters and black ones to 175. A single threshold at 100 left an 85
   * character card rendering at full size and spilling out through the logo,
   * so the size steps down in stages that were measured against the real box.
   */
  $: length = text.length;
  $: sizeClass =
    length > 130 ? 'text-xs' :
    length > 90  ? 'text-s'  :
    length > 60  ? 'text-m'  : '';
</script>

<div
  class="card {sizeClass}"
  class:black
  class:shrink
  class:no-margin={noMargin}
>
  <div class="flipper" class:show>
    <div class="front" class:marked>
      {#if tip}
        <div class="tip">
          <CardTip {tip} />
        </div>
      {/if}

      <slot name="front">
        <p>{text.replaceAll(/_+/g, '______')}</p>
        <img
          src={`/img/logo${black ? "_white" : ""}.png`}
          alt="Mytheder"
        />
      </slot>
    </div>
    <div class="back">
      <slot name="back">
        <span class="back-art" role="img" aria-label="Mytheder"></span>
      </slot>
    </div>
  </div>
</div>

<style>
  .card,
  .card .back,
  .card .front {
    width: 12em;
    height: 15em;
    font-size: 1em;
  }

  .card {
    -webkit-perspective: 1000px;
    perspective: 1000px;
    float: left;
    margin: 5px;
    background: transparent;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .card .flipper {
    transition: -webkit-transform 0.6s;
    transition: transform 0.6s;
    transition:
      transform 0.6s,
      -webkit-transform 0.6s;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    position: relative;
    -webkit-transform: rotateY(180deg);
    transform: rotateY(180deg);
  }

  .card .flipper.show {
    -webkit-transform: rotateY(0deg);
    transform: rotateY(0deg);
  }

  .card .back,
  .card .front {
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    position: absolute;
    top: 0;
    left: 0;
    border: 1px solid rgba(120, 104, 72, .55);
    border-radius: 13px;
    box-sizing: border-box;
    padding: 14px;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, .6),
      0 0 0 1px rgb(var(--accent-rgb) / .1);
  }

  .card .front {
    /* Aged paper, not white. Seven of these in a hand against a dark board is
       a glare panel at #f7f5fb, and the warm tone sits with the gold. */
    background: var(--card-paper);
    color: var(--card-ink);
    /* The trim: a gold rule just inside the edge, echoing the frame on the
       back of the card without crowding the text. */
    box-shadow:
      0 10px 30px rgba(0, 0, 0, .6),
      inset 0 0 0 2px var(--card-trim),
      inset 0 0 12px rgb(var(--accent-rgb) / .22);
    z-index: 2;
    -webkit-transform: rotateY(0deg);
    transform: rotateY(0deg);
    transition: -webkit-transform 0.3s;
    transition: transform 0.3s;
    transition:
      transform 0.3s,
      -webkit-transform 0.3s;
  }

  .card .back {
    -webkit-transform: rotateY(180deg);
    transform: rotateY(180deg);
    /* The house deck. Near-black so the artwork's own field disappears into
       the card and no seam shows at the edges. */
    background: var(--card-dark);
    color: var(--fg);
    border: 1px solid var(--accent-dim);
    padding: 0;
    overflow: hidden;
  }

  .card .back-art {
    display: block;
    width: 100%;
    height: 100%;
    background-image: url('/img/card-back.webp');
    background-repeat: no-repeat;
    background-position: center;
    /*
     * Shipped already cropped to the card's 4:5, so cover and contain agree
     * and there is nothing to letterbox. The original art is a taller 5:7;
     * the trim came off the top and bottom border, clear of the emblem and
     * the wordmark.
     */
    background-size: cover;
  }

  /* Black cards keep the dark face of the physical game, but pick up a gold
     edge so they read as lit on the dark board. */
  .card.black .back,
  .card.black .front {
    background: var(--card-dark);
    color: var(--card-dark-ink);
    border: 1px solid rgb(var(--accent-rgb) / .42);
    box-shadow:
      0 14px 44px rgba(0, 0, 0, .75),
      0 0 46px rgb(var(--accent-rgb) / .28),
      inset 0 0 0 2px rgb(var(--accent-rgb) / .55);
  }

  .card .front p,
  .card.black .front p {
    font-family: var(--font-text);
    font-size: 1.3em;
    line-height: 1.25;
    margin: 0;
    cursor: var(--cursor-pointer);
    /* Blanks like zvaný______? are one unbreakable token and used to push the
       line straight out of the card. */
    overflow-wrap: anywhere;
    /* Keep clear of the logo pinned to the bottom-left. */
    padding-bottom: 2.1em;
  }

  .card.text-m .front p { font-size: 1.08em; }
  .card.text-s .front p { font-size: .92em; }
  .card.text-xs .front p { font-size: .78em; line-height: 1.2; }

  /* Nothing may leave the card, whatever the text does. */
  .card .front,
  .card .back {
    overflow: hidden;
  }

  /* The house mark, bottom-left. Sized as a fraction of the card rather than
     left at its natural width — the wordmark is heavy enough that at full
     width it competed with the card's own text for attention. */
  .card .front img {
    width: 58%;
    max-width: 58%;
    position: absolute;
    bottom: .5em;
    left: .8em;
    opacity: .9;
  }

  .card.shrink {
    height: auto;
    margin-bottom: 0;
  }
  .card.shrink .front {
    position: relative;
    height: auto;
    border-bottom: none;
    border-end-end-radius: 0;
    border-end-start-radius: 0;
  }
  .card.shrink .front img {
    display: none;
  }

  .card.no-margin {
    margin: 0;
  }

  .card .front.marked {
    background: var(--card-paper-won);
    border-color: var(--accent);
    box-shadow:
      0 14px 36px rgba(0, 0, 0, .65),
      0 0 34px rgb(var(--accent-rgb) / .6);
  }
</style>
