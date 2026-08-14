<script>
  import { navigate } from "svelte-routing";
  import LayoutMenu from "../../components/layout/LayoutMenu.svelte";
  import LobbyBackButton from "../../components/layout/LobbyBackButton.svelte";
  import LobbyHeader from "../../components/layout/LobbyHeader.svelte";

</script>
<LayoutMenu>
	<LobbyHeader>
		<LobbyBackButton slot="left" action={() => navigate('/')} />

		<h1>Pravidla hry</h1>
	</LobbyHeader>

	<div class="rules">
		<h2>Základní pravidla</h2>
		<p>
			Na začátku hry každý hráč dostane deset bílých karet. <br />
			Jeden z hráčů dostane roli karetního císaře (bude vysvětleno dále)
		</p>
		<p>
			Všem hráčům se zobrazí stejná černá karta, která obsahuje otázku nebo vynechané místo. <br />
			Všichni hráči kromě císaře vyberou bílou kartu, která podle nich nejvtipněji doplňuje černou kartu.
		</p>
		<p>
			Karetní císař poté přednese hráčům nahlas všechny odpovědi a vybere dle něj tu nejvtipnější. <br />
			Hráč, kterému patří vybraná bílá karta dostane bod. <br />
			Pro větší efekt je doporučeno, aby císař u každé bílé karty také znovu přečetl černou kartu.
		</p>
		<p>
			Po konci kola se karetním císařem stává další hráč a všem hráčům se doplní karty.
		</p>

		<h2>Konec hry</h2>
		<p>
			Hra je u konce, když jeden z hráčů dostane předem určeného množství bodů, když dojde balíček černých karet, nebo když se hráči dohodnou na předčasném ukončení hry.<br />
			Vítězem se stává hráč s nejvíce body.
		</p>

		<h2>Vyber 2 nebo 3</h2>
		<p>
			Některé černé karty vyžadují abyste na ně odpověděli kombinací více karet. <br />
			V takovém případě vyberte požadované množství karet v pořadí, v jakém mají být přečteny.
		</p>

		<h2>Obsah je nevhodný pro děti!</h2>
		<p>
			Hra může obsahovat nevhodné výrazy a černý, sexistický, rasistický a jinak nevhodný humor. <br />
			Hra je určena hráčům <b>13+</b> <br />
			Hra nemá sloužit k propagaci rasismu, sexismu či diskriminace.
		</p>
	</div>
</LayoutMenu>

<style>
	.rules {
		padding: 0 2rem 1rem 2rem;
		color: var(--fg);
	}

	h2 {
		margin-bottom: 0;
		font-size: 1.05rem;
		letter-spacing: .04em;
		text-transform: uppercase;
		color: var(--accent-text);
	}
	h2 + p {
		margin-top: .25rem;
	}

	.rules p {
		line-height: 1.6;
		color: var(--fg);
	}

	.rules b {
		color: var(--accent-text);
	}
</style>
