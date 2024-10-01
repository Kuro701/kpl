import { writable } from "svelte/store";

export enum Theme {
	LIGHT = 'light',
	DARK = 'dark',
}

export const ActiveTheme = writable<Theme>(Theme.LIGHT);
