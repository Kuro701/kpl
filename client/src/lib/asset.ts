/**
 * Resolve a path in `public/` against Vite's base.
 *
 * The client used to be served from the root of its own domain, so absolute
 * paths like "/img/icons/plus.png" worked. It is now served from a sub-path of
 * kurolabs.net, and Vite only rewrites asset URLs it can see — a path baked
 * into Svelte markup compiles to a plain string and is left alone. Everything
 * that points at public/ has to go through here.
 */
export function asset(path: string): string {
	return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
