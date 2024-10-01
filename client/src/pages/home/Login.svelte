<script>
  import LoginOptions from "./LoginOptions.svelte";

</script>
<div>
	<h2>Přihlásit se</h2>

	<div class="actions">
		<LoginOptions />
		<div style="opacity: .5; font-size: .8rem; text-align: center;">
			Další možnosti přihlášení již brzy
		</div>
	</div>
</div>

<style>
	.actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 {
		text-align: center;
	}
</style>
