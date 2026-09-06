<script lang="ts">
	/*
	 * The writing step for a Žolík.
	 *
	 * A normal pick submits itself the moment you have chosen enough cards. A
	 * blank cannot: it has no text until you write some. So the selection is
	 * held open by PendingJokers and this panel finishes the job.
	 *
	 * The round timer keeps running underneath. If it expires while this is
	 * open the server plays the hand itself and moves on, so the panel closes
	 * on any state change rather than sitting over a round that has ended.
	 */
	import { onDestroy } from 'svelte';
	import {
		IngameRoom,
		JOKER_MAX_LENGTH,
		PendingJokers,
		RoomState,
		submitJokerTexts,
	} from '../../lib/networking/room';

	let texts: Record<string, string> = {};

	// Any blank still empty blocks the submit — a Žolík with nothing on it is a
	// wasted card, and the player would rather be told than find out on the table.
	$: ids = $PendingJokers;
	$: ready = ids.length > 0 && ids.every(id => (texts[String(id)] ?? '').trim().length > 0);

	$: if ($IngameRoom && $IngameRoom.state !== RoomState.PICK_WHITE && ids.length > 0) {
		PendingJokers.set([]);
	}

	function submit() {
		if (!ready) return;
		const payload: Record<string, string> = {};
		for (const id of ids) payload[String(id)] = (texts[String(id)] ?? '').trim();
		texts = {};
		submitJokerTexts(payload);
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			submit();
		}
	}

	onDestroy(() => PendingJokers.set([]));
</script>

{#if ids.length > 0}
	<div class="joker" role="dialog" aria-label="Žolík">
		<p class="joker__title">
			{ids.length > 1 ? 'Napiš své odpovědi' : 'Napiš svou odpověď'}
		</p>

		{#each ids as id, i (id)}
			{@const value = texts[String(id)] ?? ''}
			<label class="joker__row">
				{#if ids.length > 1}<span class="joker__num">{i + 1}</span>{/if}
				<input
					class="joker__input"
					type="text"
					maxlength={JOKER_MAX_LENGTH}
					placeholder="…"
					bind:value={texts[String(id)]}
					on:keydown={onKey}
					autofocus={i === 0}
				/>
				<span class="joker__count" class:joker__count--full={value.length >= JOKER_MAX_LENGTH}>
					{value.length}/{JOKER_MAX_LENGTH}
				</span>
			</label>
		{/each}

		<button class="joker__go" on:click={submit} disabled={!ready}>Zahrát</button>
	</div>
{/if}

<style>
	.joker {
		position: absolute;
		left: 50%;
		bottom: 1.2rem;
		transform: translateX(-50%);
		z-index: 30;
		width: min(560px, calc(100vw - 2rem));
		display: flex;
		flex-direction: column;
		gap: .55rem;
		padding: 1rem 1.1rem;
		box-sizing: border-box;
		border: 1px solid rgb(var(--accent-rgb) / .45);
		border-radius: var(--radius);
		background: rgb(8 6 7 / .96);
		box-shadow: 0 18px 46px rgb(0 0 0 / .6);
	}

	.joker__title {
		margin: 0;
		font-family: var(--head, inherit);
		letter-spacing: .08em;
		text-transform: uppercase;
		font-size: .78rem;
		color: var(--accent-text);
	}

	.joker__row {
		display: flex;
		align-items: center;
		gap: .55rem;
	}

	.joker__num {
		flex: none;
		width: 1.4em;
		text-align: center;
		opacity: .55;
		font-size: .85rem;
	}

	.joker__input {
		flex: 1 1 auto;
		min-width: 0;
		padding: .6rem .7rem;
		border-radius: calc(var(--radius) / 2);
		border: 1px solid rgb(255 255 255 / .16);
		background: rgb(255 255 255 / .04);
		color: inherit;
		font: inherit;
	}
	.joker__input:focus {
		outline: none;
		border-color: rgb(var(--accent-rgb) / .8);
	}

	.joker__count {
		flex: none;
		font-size: .72rem;
		font-variant-numeric: tabular-nums;
		opacity: .5;
	}
	.joker__count--full { color: #ff8a78; opacity: .9; }

	.joker__go {
		align-self: flex-end;
		padding: .5rem 1.5rem;
		border: 0;
		border-radius: calc(var(--radius) / 2);
		background: var(--accent-text);
		color: #14100f;
		font-family: var(--head, inherit);
		letter-spacing: .1em;
		text-transform: uppercase;
		font-size: .78rem;
		cursor: pointer;
	}
	.joker__go[disabled] { opacity: .35; cursor: default; }
</style>
