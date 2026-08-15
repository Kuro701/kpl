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

export const LocalIdentity = writable<ILocalIdentity>(loadSavedIdentity())

function loadSavedIdentity(): ILocalIdentity {
	const identityExpireString = window.localStorage.getItem('token_expires') || '';
	let expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
	if (identityExpireString) {
		expires = new Date(identityExpireString);
		if (expires < new Date()) {
			clearIdentityStorage();
		}
	}

	const provider = (window.localStorage.getItem('identity_provider') || 'anonymous') as AuthProvier;
	const user_id = window.localStorage.getItem('uuid') || '';
	const token = window.localStorage.getItem('token') || '';
	const username = window.localStorage.getItem('username') || randomUsername();
	// An older build stored a dicebear URL here; normalizeAvatar turns anything
	// unexpected into a real avatar instead of a broken image.
	const stored = window.localStorage.getItem('avatar');
	const image = stored ? normalizeAvatar(stored) : randomAvatar();

	return { provider, user_id, token, username, expires, image };
}

export function setIdentity(identity: ILocalIdentity) {
	window.localStorage.setItem('identity_provider', identity.provider);
	window.localStorage.setItem('uuid', identity.user_id);
	window.localStorage.setItem('token', identity.token);
	window.localStorage.setItem('username', identity.username);
	window.localStorage.setItem('token_expires', identity.expires.toISOString());
	window.localStorage.setItem('avatar', identity.image || '');

	LocalIdentity.set(identity);
}

function clearIdentityStorage() {
	window.localStorage.removeItem('identity_provider');
	window.localStorage.removeItem('uuid');
	window.localStorage.removeItem('token');
	window.localStorage.removeItem('username');
	window.localStorage.removeItem('token_expires');
	window.localStorage.removeItem('avatar');
}

export function setAvatar(image: string) {
	window.localStorage.setItem('avatar', image);
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
