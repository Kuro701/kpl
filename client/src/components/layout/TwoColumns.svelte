<div class="columns">
	<div>
		<slot name="left" />
	</div>
	<span class="columns__divider" aria-hidden="true"></span>
	<div>
		<slot name="right" />
	</div>
</div>

<style>
	.columns {
		width: 100%;
		display: flex;
		flex-direction: row;
		gap: 1rem;
		color: var(--fg);
	}
	.columns > div {
		flex: 1;
		min-width: 0;
	}

	/* The seam down the middle of the frame, diamond-tipped at both ends. */
	.columns__divider {
		flex: 0 0 1px;
		align-self: stretch;
		position: relative;
		background: linear-gradient(180deg, transparent, rgb(var(--accent-rgb) / .45), transparent);
	}
	.columns__divider::before,
	.columns__divider::after {
		content: "";
		position: absolute;
		left: 50%;
		width: 6px;
		height: 6px;
		background: var(--accent);
		transform: translateX(-50%) rotate(45deg);
		opacity: .8;
	}
	.columns__divider::before { top: 0; }
	.columns__divider::after { bottom: 0; }

	@media (max-width: 50rem) {
		.columns {
			flex-direction: column;
		}
		.columns__divider {
			display: none;
		}
	}
</style>
