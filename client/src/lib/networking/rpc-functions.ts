import { navigate } from "svelte-routing";
import { getAuthCredentials, LobbyRooms, PlayerCount, PlayerIdentity, RoomCount, type LobbyRoom } from "./client";
import { ChatMessages, IngameRoom, LastGameResults, RoomState, SelectedCards, ServerResponseFn, type ChatMessage, type GameResults } from "./room";
import { get } from "svelte/store";
import { playSound } from "../sounds";
import { identityStorage } from "../auth/auth";

type ReplyFunction = (data: unknown) => void;
type RequestFunction = (reply: ReplyFunction, data: unknown) => Promise<void>;

const OK = true;

export const rpcFunctions: Record<string, RequestFunction> = {
	auth: async (reply) => {
		reply(getAuthCredentials());
	},
	identity: async (reply, data) => {
		const { uuid, token, username, anonymous } = data as { uuid: string, token: string, username: string, anonymous: boolean };

		if (anonymous) {
			identityStorage.setItem('identity_provider', 'anonymous');
			identityStorage.setItem('username', username);
			identityStorage.setItem('uuid', uuid);
			identityStorage.setItem('token', token);
		}

		PlayerIdentity.set({ uuid, username, anonymous });

		reply(OK);
	},
	lobby: async (reply, data) => {
		LobbyRooms.set((data as any).rooms || []);
		RoomCount.set((data as any).roomCount || 0);
		reply(OK);
	},
	room: async (reply, data) => {
		const roomData = data as null | IngameRoom;

		if (roomData === null) {
			reply(OK);
			IngameRoom.set(null);
			ServerResponseFn.set(null);
			SelectedCards.set([]);
			ChatMessages.set([]);

			if (window.location.pathname.startsWith('/room/')) {
				navigate('/');
			}

			return;
		}

		roomData.intermissionStart = roomData.intermissionStart ? new Date(roomData.intermissionStart) : null;
		roomData.intermissionEnd = roomData.intermissionEnd ? new Date(roomData.intermissionEnd) : null;

		const playerIndetity = get(PlayerIdentity);
		const isCzar = roomData.players.some(p => p.isCzar && p.uuid === playerIndetity?.uuid);


		if (!(roomData.state === RoomState.PICK_WHITE && !isCzar) && !(roomData.state === RoomState.PICK_CZAR && isCzar)) {
			ServerResponseFn.set(null);
			SelectedCards.set([]);
		}

		IngameRoom.update((oldRoomData) => {
			const isEvent_CzarSelected = oldRoomData?.table.lastRoundWinnerGroupId === null && roomData.table.lastRoundWinnerGroupId !== null;
			if (isEvent_CzarSelected) {
				const oldPoints = oldRoomData?.players.find(p => p.uuid === playerIndetity?.uuid)?.points || 0;
				const newPoints = roomData.players.find(p => p.uuid === playerIndetity?.uuid)?.points || 0;
				const isMine = newPoints > oldPoints;
				if (isMine) {
					playSound('point')
				} else {
					playSound('selected');
				}
			}

			return roomData;
		});
		reply(OK);
	},
	pickWhiteCards: async (reply, data) => {
		ServerResponseFn.set(reply);
	},
	pickCzarCard: async (reply, data) => {
		ServerResponseFn.set(reply);
	},
	gameResults: async (reply, data) => {
		reply(OK);

		LastGameResults.set(data as GameResults);
		navigate('/game-over');
		playSound('gameover');
	},
	chat: async (reply, data) => {
		reply(OK);

		const message = data as ChatMessage;
		if (!message?.id) {
			return;
		}

		ChatMessages.update(messages => {
			// The server also sends history on join, so guard against a repeat.
			if (messages.some(m => m.id === message.id)) {
				return messages;
			}

			return [...messages, message].slice(-80);
		});
	},
	chatHistory: async (reply, data) => {
		reply(OK);

		ChatMessages.set(((data as { messages?: ChatMessage[] })?.messages ?? []));
	},
	playerCount: async (reply, data) => {
		reply(OK);

		PlayerCount.set((data as {
			count: number;
		}).count ?? 0);
	},
}
