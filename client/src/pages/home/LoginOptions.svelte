<script>

  import { loginViaDiscord } from "../../lib/auth/discord";

</script>
<div>
	<button class="button button--discord" on:click={loginViaDiscord}>
		Přihlášení přes Discord
	</button>
</div>

<style>
	/* .button {
		width: 10rem;
	} */

	.button--discord {
		background-color: #7289da;
		border: 1px solid #7289da;
	}
	.button--discord:hover {
		background-color: #677bc4;
		border: 1px solid #677bc4;
	}

	/* .button--google {
		background-color: #db4437;
		border: 1px solid #db4437;
	}
	.button--google:hover {
		background-color: #c23321;
		border: 1px solid #c23321;
	} */
</style>
