<script>

  import { logout } from "../../lib/auth/auth";

</script>
<div>
	<h2>Váš účet</h2>

	<button on:click={logout}>
		Odhlásit se
	</button>
</div>
