import { navigate } from "svelte-routing";
import { safeAwait } from "../../utils/safe-await";
import { setIdentity } from "./auth";

const CLIENT_ID = '1289979640953180221';
const REDIRECT_URI = 'http://localhost:5173/auth/callback/discord';

export function loginViaDiscord() {
	const state = btoa(window.location.pathname);
	const endpoint = `https://discord.com/oauth2/authorize`
	const args = {
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'token',
		scope: 'identify',
		state: state,
	};

	const link = `${endpoint}?${new URLSearchParams(args)}`;

	window.location.href = link;
}

async function getDiscordProfile(token: string) {
	const response = await fetch('https://discord.com/api/users/@me', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const data = await response.json();
	return data;
}

export async function handleDiscordCallback() {
	const urlString = window.location.hash || window.location.search;
	if (!urlString) {
		navigate('/');
		return;
	}

	const params = new URLSearchParams(urlString.slice(1));
	const token = params.get('access_token');
	const state = params.get('state') || '';
	const expiry = parseInt(params.get('expires_in') || `${60*60*24}`);

	let path = '/';
	try {
		path = atob(state) || '/';
	} catch {
		console.warn('Invalid state, redirecting to home');
	}

	if (!token) {
		navigate(path);
		return;
	}

	const [ profile, error ] = await safeAwait(getDiscordProfile(token));

	if (error || !profile) {
		navigate(path);
		return;
	}

	const { id, username, global_name, avatar } = profile;

	if (!id) {
		navigate(path);
		return;
	}

	const avatarUrl = avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : undefined;

	setIdentity({
		provider: 'discord',
		image: avatarUrl,
		user_id: id,
		token: token,
		username: global_name || username,
		expires: new Date(Date.now() + expiry * 1000),
	});

	navigate(path);
}
