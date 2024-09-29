import { getAuthCredentials, LobbyRooms, PlayerIdentity } from "./client";

type ReplyFunction = (data: unknown) => void;
type RequestFunction = (reply: ReplyFunction, data: unknown) => Promise<void>;

const OK = true;

export const rpcFunctions: Record<string, RequestFunction> = {
	auth: async (reply) => {
		reply(getAuthCredentials());
	},
	identity: async (reply, data) => {
		const { uuid, token, username, anonymous } = data as { uuid: string, token: string, username: string, anonymous: boolean };
		console.log('Identity:', { uuid, token, username });

		localStorage.setItem('uuid', uuid);
		localStorage.setItem('token', token);
		localStorage.setItem('username', username);

		PlayerIdentity.set({ username, anonymous });

		reply(OK);
	},
	lobby: async (reply, data) => {
		LobbyRooms.set((data as any).rooms ?? []);
		reply(OK);
	},
}
