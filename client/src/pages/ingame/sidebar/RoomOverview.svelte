<script lang="ts">
	import { leaveRoom } from "../../../lib/networking/client";
	import { IngameRoom } from "../../../lib/networking/room";

	let copied = false;
	let copyTimer: ReturnType<typeof setTimeout> | null = null;

	$: joinCode = $IngameRoom?.uuid ?? '';
	$: joinLink = joinCode ? `${window.location.origin}/join/${joinCode}` : '';

	async function copyLink() {
		if (!joinLink) return;

		try {
			await navigator.clipboard.writeText(joinLink);
		} catch {
			// Clipboard is blocked outside https and in some mobile browsers.
			// Select the text instead so the player can copy it by hand.
			const selection = window.getSelection();
			const node = document.getElementById('join-code-value');
			if (selection && node) {
				const range = document.createRange();
				range.selectNodeContents(node);
				selection.removeAllRanges();
				selection.addRange(range);
			}
			return;
		}

		copied = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => { copied = false; }, 1600);
	}
</script>

<div class="room-info-wraper">
	<div class="room-name">
		{$IngameRoom?.name ?? "Místnost"}
	</div>

	<button class="code" on:click={copyLink} title="Zkopírovat odkaz na místnost">
		<span class="code__value" id="join-code-value">{joinCode}</span>
		<span class="code__action">{copied ? 'zkopírováno ✓' : 'kopírovat odkaz'}</span>
	</button>

	<div class="room-info">
		<div class="room-players">
			{$IngameRoom?.players.length ?? 0}/{$IngameRoom?.maxPlayers ?? 0} hráčů
		</div>
		<div class="room-goal">
			cíl {$IngameRoom?.goal ?? 0} bodů
		</div>
	</div>
</div>

<div class="leave-wrapper">
	<button class="button button--leave" on:click={leaveRoom}>
		<img src="/img/icons/leave.png" alt="Odhlásit se" class="icon invert" draggable="false" />
		<span>Opustit místnost</span>
	</button>
</div>

<style>
	.leave-wrapper {
		padding: 1rem;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
	}
	.leave-wrapper .button {
		margin-left: auto;
		margin-right: auto;
	}

	.room-info-wraper {
		padding: 1rem;
		box-sizing: border-box;
		background-color: rgb(0, 0, 0, .25);
	}

	.room-name {
		text-transform: capitalize;
		text-align: center;
		margin-bottom: .75rem;
	}

	.code {
		display: flex;
		align-items: center;
		gap: .75rem;
		width: 100%;
		padding: .6rem .75rem;
		margin-bottom: .75rem;
		box-sizing: border-box;
		font: inherit;
		text-align: left;
		border-radius: var(--radius);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
		color: inherit;
		cursor: var(--cursor-pointer);
		transition: border-color .15s, background-color .15s;
	}
	.code:hover {
		border-color: var(--accent);
		background: var(--chip-bg-hover);
	}

	.code__value {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 1.2rem;
		font-weight: 800;
		letter-spacing: .2em;
		color: var(--accent-text);
		user-select: all;
	}

	.code__action {
		font-size: .7rem;
		color: var(--muted);
		white-space: nowrap;
	}

	.room-info {
		display: flex;
		justify-content: center;
		gap: 1rem;
		color: rgb(255, 255, 255, .5);
		font-size: .8rem;
	}
</style>
