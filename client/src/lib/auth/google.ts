import { navigate } from "svelte-routing";
import { safeAwait } from "../../utils/safe-await";
import { setIdentity } from "./auth";

const CLIENT_ID = '436994910279-4c4t50rf8o9642u8eedo94u5h0g086hj.apps.googleusercontent.com';
const REDIRECT_URI = `${window.location.origin}/auth/callback/google`;

export function loginViaGoogle() {
	const state = btoa(window.location.pathname);
	const endpoint = `https://accounts.google.com/o/oauth2/v2/auth`
	const args = {
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'token',
		scope: 'https://www.googleapis.com/auth/userinfo.profile',
		state: state,
	};

	const link = `${endpoint}?${new URLSearchParams(args)}`;

	window.location.href = link;
};

async function getGoogleProfile(token: string) {
	const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const data = await response.json();
	return data;
}

export async function handleGoogleCallback() {
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

	const [ profile, error ] = await safeAwait(getGoogleProfile(token));

	if (error || !profile) {
		navigate(path);
		return;
	}

	setIdentity({
		provider: 'google',
		image: profile.picture,
		user_id: profile.id,
		token: token,
		username: profile.name,
		expires: new Date(Date.now() + expiry * 1000),
	});

	navigate(path);
}
