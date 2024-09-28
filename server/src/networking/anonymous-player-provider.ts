import { randomBytes } from "crypto";
import { createId as cuid } from "@paralleldrive/cuid2";

const ANONYMOUS_TIMEOUT = 1000 * 60 * 30; // 30 minutes for anonymous players to reconnect

type AnonymousPlayerData = {
	user_id: string;
	token: string;
	timeout?: NodeJS.Timeout;
}

const anonymousPlayers = new Map<string, AnonymousPlayerData>();

export function createAnonymousPlayer() {
	const user_id = `anonymous_${cuid()}`
	const token = randomBytes(16).toString('hex');

	anonymousPlayers.set(user_id, { user_id, token });
	return { user_id, token };
}

export function startAnonymousTimeout(user_id: string) {
	const data = anonymousPlayers.get(user_id);
	if (!data) {
		return;
	}

	if (data.timeout) {
		clearTimeout(data.timeout);
	}

	data.timeout = setTimeout(() => {
		if (data.timeout) {
			clearTimeout(data.timeout);
			data.timeout = undefined;
		}
		anonymousPlayers.delete(user_id);
	}, ANONYMOUS_TIMEOUT);
}

export function tryReviveAnonymousPlayer(user_id: string, token: string) {
	if (!user_id || !token) {
		return null;
	}

	const data = anonymousPlayers.get(user_id);
	if (!data || data.token !== token) {
		return null;
	}

	if (data.timeout) {
		clearTimeout(data.timeout);
		data.timeout = undefined;
	}

	return data;
}


