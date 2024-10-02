import { writable } from "svelte/store";

export const SystemMessage = writable<string | null>(null);
