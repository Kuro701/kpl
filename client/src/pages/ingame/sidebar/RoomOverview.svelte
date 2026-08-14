<script lang="ts">
	import { onDestroy } from "svelte";
	import { leaveRoom } from "../../../lib/networking/client";
	import { IngameRoom } from "../../../lib/networking/room";

	type CopyState = 'idle' | 'copied' | 'manual';

	let state: CopyState = 'idle';
	let copyTimer: ReturnType<typeof setTimeout> | null = null;

	$: joinCode = $IngameRoom?.uuid ?? '';
	$: joinLink = joinCode ? `${window.location.origin}/join/${joinCode}` : '';

	/*
	 * navigator.clipboard only exists in a secure context, and some browsers
	 * refuse it even there. Fall back to the old textarea + execCommand trick,
	 * and if even that fails, select the code so it can be copied by hand —
	 * never leave the button looking like it did nothing.
	 */
	async function writeToClipboard(text: string): Promise<boolean> {
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				return true;
			}
		} catch {
			// fall through to the legacy path
		}

		try {
			const scratch = document.createElement('textarea');
			scratch.value = text;
			scratch.setAttribute('readonly', '');
			scratch.style.position = 'fixed';
			scratch.style.top = '-1000px';
			scratch.style.opacity = '0';
			document.body.appendChild(scratch);
			scratch.select();
			scratch.setSelectionRange(0, text.length);
			const ok = document.execCommand('copy');
			document.body.removeChild(scratch);
			return ok;
		} catch {
			return false;
		}
	}

	function selectCode() {
		const node = document.getElementById('join-code-value');
		const selection = window.getSelection();
		if (!node || !selection) return;

		const range = document.createRange();
		range.selectNodeContents(node);
		selection.removeAllRanges();
		selection.addRange(range);
	}

	async function copyLink() {
		if (!joinLink) return;

		const ok = await writeToClipboard(joinLink);

		if (!ok) {
			selectCode();
		}

		state = ok ? 'copied' : 'manual';

		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => { state = 'idle'; }, 2000);
	}

	onDestroy(() => {
		if (copyTimer) clearTimeout(copyTimer);
	});
</script>

<div class="room-info-wraper">
	<div class="room-name">
		{$IngameRoom?.name ?? "Místnost"}
	</div>

	<button class="code" on:click={copyLink} title="Zkopírovat odkaz na místnost">
		<span class="code__value" id="join-code-value">{joinCode}</span>
		<span class="code__action">
			{#if state === 'copied'}zkopírováno ✓{:else if state === 'manual'}zkopíruj ručně{:else}kopírovat odkaz{/if}
		</span>
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
		user-select: text;
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
