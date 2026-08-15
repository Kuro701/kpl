import { get, writable } from "svelte/store";
import type { AuthCredentials, AuthProvier } from "../networking/client";
import { randomUsername } from "../random";
import { normalizeAvatar, randomAvatar } from "../avatars";

type ILocalIdentity = {
	provider: AuthProvier;
	user_id: string;
	username: string;
	token: string;
	image?: string;
	expires: Date;
};

/*
 * Where the identity lives.
 *
 * localStorage is shared by every tab in a browser, so all your tabs are the
 * same player. That is right for real use — open the game twice and you take
 * your seat with you — and useless for testing, where you need to be three
 * people at once.
 *
 * Adding ?tab to the URL switches to sessionStorage, which is per-tab: three
 * tabs become three players. The choice is remembered for the tab, so a reload
 * does not silently turn you back into somebody else.
 */
function pickStorage(): Storage {
	if (typeof window === 'undefined') {
		return {
			getItem: () => null, setItem: () => {}, removeItem: () => {},
			clear: () => {}, key: () => null, length: 0,
		} as unknown as Storage;
	}

	try {
		const askedForTab = new URLSearchParams(window.location.search).has('tab');
		const alreadyPerTab = window.sessionStorage.getItem('per-tab-identity') === '1';

		if (askedForTab || alreadyPerTab) {
			window.sessionStorage.setItem('per-tab-identity', '1');
			return window.sessionStorage;
		}
	} catch {
		// storage blocked — fall through to localStorage and let it throw there
	}

	return window.localStorage;
}

export const identityStorage: Storage = pickStorage();

export const LocalIdentity = writable<ILocalIdentity>(loadSavedIdentity())

function loadSavedIdentity(): ILocalIdentity {
	const identityExpireString = identityStorage.getItem('token_expires') || '';
	let expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
	if (identityExpireString) {
		expires = new Date(identityExpireString);
		if (expires < new Date()) {
			clearIdentityStorage();
		}
	}

	const provider = (identityStorage.getItem('identity_provider') || 'anonymous') as AuthProvier;
	const user_id = identityStorage.getItem('uuid') || '';
	const token = identityStorage.getItem('token') || '';
	const username = identityStorage.getItem('username') || randomUsername();
	// An older build stored a dicebear URL here; normalizeAvatar turns anything
	// unexpected into a real avatar instead of a broken image.
	const stored = identityStorage.getItem('avatar');
	const image = stored ? normalizeAvatar(stored) : randomAvatar();

	return { provider, user_id, token, username, expires, image };
}

export function setIdentity(identity: ILocalIdentity) {
	identityStorage.setItem('identity_provider', identity.provider);
	identityStorage.setItem('uuid', identity.user_id);
	identityStorage.setItem('token', identity.token);
	identityStorage.setItem('username', identity.username);
	identityStorage.setItem('token_expires', identity.expires.toISOString());
	identityStorage.setItem('avatar', identity.image || '');

	LocalIdentity.set(identity);
}

function clearIdentityStorage() {
	identityStorage.removeItem('identity_provider');
	identityStorage.removeItem('uuid');
	identityStorage.removeItem('token');
	identityStorage.removeItem('username');
	identityStorage.removeItem('token_expires');
	identityStorage.removeItem('avatar');
}

export function setAvatar(image: string) {
	identityStorage.setItem('avatar', image);
	LocalIdentity.update(identity => ({ ...identity, image }));
}

export function getLoginCredentials(username: string): AuthCredentials {
	const identity = get(LocalIdentity);
	return {
		provider: identity.provider,
		user_id: identity.user_id,
		user_token: identity.token,
		username: username,
		image: identity.image,
	};
}

export function logout() {
	clearIdentityStorage();
	LocalIdentity.set(loadSavedIdentity());
}
