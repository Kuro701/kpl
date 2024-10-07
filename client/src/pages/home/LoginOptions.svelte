<script>

  import { loginViaDiscord } from "../../lib/auth/discord";
  import { loginViaGoogle } from "../../lib/auth/google";

</script>
<div class="login-options">
	<div class="login-provider" aria-label="Přihlásit se přes Discord" data-balloon-pos="up">
		<button on:click={loginViaDiscord}>
			<img src="/img/provider/discord.svg" alt="Discord" />
		</button>
	</div>

	<div class="login-provider">
		<button on:click={loginViaGoogle} aria-label="Přihlásit se přes Google" data-balloon-pos="up">
			<img src="/img/provider/google.svg" alt="Discord" />
		</button>
	</div>
</div>

<style>
	.login-options {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: .5rem;
	}

	.login-provider button {
		padding: none;
		border: none;
		background: none;
		font-size: inherit;
	}
	.login-provider img {
		height: 2rem;
		width: 2rem;
		object-fit: contain;
	}
</style>
