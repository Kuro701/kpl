import cuid from "cuid";

export const NONCE_EMPTY = '';
export function createNonce() {
	return cuid();
}
