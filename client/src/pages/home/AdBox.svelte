<script>
  import KartyBezCenzury from '../../components/ad/KartyBezCenzury.svelte';
</script>

<div class="sponsor-wrap">
	<div class="sponsor-label">
		Sponzorováno
	</div>
	<div class="sponsor">
		<KartyBezCenzury />
	</div>
</div>

<style>
  .sponsor-wrap {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: .25rem;
	align-items: center;
  }
  .sponsor {
    width: calc(100% - 5rem);
    height: 8rem;
    background-color: gray;
    overflow: hidden;
    position: relative;
    border-radius: .5rem;
  }
  .sponsor-label {
    font-size: .75rem;
    opacity: .8;
    margin-top: 1rem;
    width: calc(100% - 5rem);
    padding-left: .5rem;
    cursor: var(--cursor-text);
  }
</style>

