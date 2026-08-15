/*
 * Avatars.
 *
 * The original build generated a face from an external service, seeded by the
 * player's nickname — so you got whatever it gave you, it changed when you
 * renamed yourself, and it needed a third-party request to render.
 *
 * These are emoji: no assets to ship, no network, they render on a phone, and
 * everyone already knows what they mean. The picker is a plain grid.
 */

export type AvatarGroup = {
	name: string;
	avatars: string[];
};

export const AVATAR_GROUPS: AvatarGroup[] = [
	{
		name: 'Zvířata',
		avatars: [
			'🦆', '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯',
			'🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦉',
			'🦇', '🐺', '🦄', '🐝', '🦋', '🐙', '🦈', '🐬',
			'🦀', '🦖', '🐢', '🐍', '🦥', '🦦',
		],
	},
	{
		name: 'Květiny',
		avatars: [
			'🌸', '🌹', '🌻', '🌼', '🌷', '🌺', '💐', '🏵️',
			'🌱', '🌿', '🍀', '🌵', '🌴', '🍄', '🌾', '🪻',
		],
	},
	{
		name: 'Ostatní',
		avatars: [
			'🔥', '💀', '👻', '👾', '🤖', '🎃', '⚡', '🌙',
			'⭐', '🍕', '🍺', '🎲', '🎸', '🕹️', '💣', '🗿',
			'👑', '🦴', '🧿', '☠️', '🍉', '🧊', '🎩', '🪩',
		],
	},
];

export const ALL_AVATARS: string[] = AVATAR_GROUPS.flatMap(group => group.avatars);

/** Duck. Non-negotiable. */
export const DEFAULT_AVATAR = '🦆';

export function randomAvatar(): string {
	return ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
}

/**
 * Anything stored from an older build (a dicebear URL) or otherwise unexpected
 * falls back to a real avatar rather than rendering a broken image.
 */
export function normalizeAvatar(value: unknown): string {
	if (typeof value !== 'string') return randomAvatar();

	const trimmed = value.trim();
	if (!trimmed || trimmed.includes('/') || trimmed.length > 8) {
		return randomAvatar();
	}

	return trimmed;
}
