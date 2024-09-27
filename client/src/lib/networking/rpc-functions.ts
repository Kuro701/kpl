import { getAuthCredentials } from "./client";

type ReplyFunction = (data: unknown) => void;
type RequestFunction = (reply: ReplyFunction, data: unknown) => Promise<void>;

export const rpcFunctions: Record<string, RequestFunction> = {
	auth: async (reply: ReplyFunction) => {
		reply(getAuthCredentials());
	},
}
