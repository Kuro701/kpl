<script lang="ts">
	export let black: boolean = false;
	export let show: boolean = true;
	export let text: string = '';
	export let shrink: boolean = false;
	export let noMargin: boolean = false;
</script>

<div class="card" class:black={black} class:long={text.length > 100} class:shrink={shrink} class:no-margin={noMargin}>
	<div class="flipper" class:show={show}>
		<div class="front">
			<slot name="front">
				<p>{text}</p>
				<img src={`/img/logo${black ? '_white' : ''}.png`} alt="Karty proti lidskosti" />
			</slot>
		</div>
		<div class="back">
			<slot name="back">
				<p>
					Karty
					<br />
					proti
					<br />
					lidskosti
				</p>
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
		background: #fff;
		-webkit-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.card .flipper {
		transition: -webkit-transform .6s;
		transition: transform .6s;
		transition: transform .6s, -webkit-transform .6s;
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

	.card .back, .card .front {
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		position: absolute;
		top: 0;
		left: 0;
		border: 1px solid grey;
		border-radius: 5px;
		box-sizing: border-box;
		padding: 10px;
	}

	.card .front {
		background: #fff;
		z-index: 2;
		-webkit-transform: rotateY(0deg);
		transform: rotateY(0deg);
		transition: -webkit-transform .3s;
		transition: transform .3s;
		transition: transform .3s, -webkit-transform .3s;
	}

	.card .back {
		-webkit-transform: rotateY(180deg);
		transform: rotateY(180deg);
		background: #fff;
	}

	.card.black .back, .card.black .front {
		background: #000;
		color: #fff;
	}

	.card .back p {
		margin: 0;
		font-size: 1.5em;
		font-weight: 700;
		font-family: Calibri;
		cursor: var(--cursor-pointer);
	}

	.card .front p {
		font-family: Calibri;
		font-size: 1.3em;
		margin: 0;
		cursor: var(--cursor-pointer);
	}

	.card .front img {
		max-width: 100%;
		-webkit-transform: scale(.8);
		transform: scale(.8);
		position: absolute;
		bottom: 0;
		left: 0;
	}

	.card.long .front p {
		font-size: .9em;
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
</style>
