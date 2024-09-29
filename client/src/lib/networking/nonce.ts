import { createId as cuid } from "@paralleldrive/cuid2";

export const NONCE_EMPTY = '';
export function createNonce() {
	return `c_${cuid()}`;
}
