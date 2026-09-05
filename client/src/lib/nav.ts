/**
 * Base-aware routing.
 *
 * The app is served from a sub-path (see `base` in vite.config.ts), but
 * svelte-routing's `navigate` pushes whatever string it is given — it knows
 * nothing about the base. Rather than rewrite fifteen call sites, every module
 * imports `navigate` from here instead of from svelte-routing, and the paths
 * inside the app stay written as if it lived at the root.
 */
import { navigate as routerNavigate } from 'svelte-routing';

/** e.g. "/games/mytheder/" — always has a trailing slash. */
export const BASE = import.meta.env.BASE_URL;
/** e.g. "/games/mytheder" — no trailing slash; what <Router basepath> wants. */
export const BASE_PATH = BASE.replace(/\/$/, '');

/** "/rules" -> "/games/mytheder/rules" */
export function route(path: string): string {
	return BASE + path.replace(/^\//, '');
}

/** The part of the current URL the app cares about, base stripped off. */
export function appPath(): string {
	const p = window.location.pathname;
	const stripped = BASE_PATH && p.startsWith(BASE_PATH) ? p.slice(BASE_PATH.length) : p;
	return stripped || '/';
}

export function navigate(to: string, options?: Parameters<typeof routerNavigate>[1]) {
	return routerNavigate(route(to), options);
}
