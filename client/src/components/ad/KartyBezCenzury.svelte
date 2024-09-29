<a class="kbc-wrapper" href="https://link.helkor.eu/from-kpl-to-dickobraz" target="_blank" rel="noopener noreferrer">
	<div class="kbc">
		<div class="kbc__text kbc__text--small">
			Chceš si zahrát i offline?
		</div>
		<div>
			<div class="kbc__logo">
				Karty bez cenzury
			</div>
			<div class="kbc__text">
				Sleva 10% s kódem <b>KPL-ONLINE</b>
			</div>
		</div>
	</div>
</a>


<style>
	.kbc-wrapper {
		text-decoration: inherit;
		color: inherit;
	}

	.kbc {
		background-color: gold;
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		width: 100%;
	}

	.kbc::before, .kbc::after {
		content: '';
		display: block;
		width: 100%;
		height: 1rem;
		--stripe-size: .75rem;
		background: repeating-linear-gradient(-70deg, gold 0, gold var(--stripe-size), black var(--stripe-size), black calc(2 * var(--stripe-size)));
	}

	.kbc__logo {
		font-family: var(--font-karty-bez-cenzury);
		display: flex;
		flex-direction: column;
		color: black;
		text-transform: uppercase;
		text-align: center;
		font-size: 1.3rem;
	}
	.kbc__text {
		text-align: center;
		font-size: .9rem;
	}
	.kbc__text--small {
		font-size: .8rem;
		opacity: .8;
	}
</style>
