import { navigate } from "svelte-routing";
import { getAuthCredentials, LobbyRooms, PlayerCount, PlayerIdentity, RoomCount, type LobbyRoom } from "./client";
import { IngameRoom, LastGameResults, RoomState, SelectedCards, ServerResponseFn, type GameResults } from "./room";
import { get } from "svelte/store";

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

		if (anonymous) {
			localStorage.setItem('identity_provider', 'anonymous');
			localStorage.setItem('username', username);
			localStorage.setItem('uuid', uuid);
			localStorage.setItem('token', token);
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
		console.log('Room data:', data);
		const roomData = data as null | IngameRoom;

		if (roomData === null) {
			reply(OK);
			IngameRoom.set(null);
			ServerResponseFn.set(null);
			SelectedCards.set([]);

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

		IngameRoom.set(roomData);
		reply(OK);
	},
	pickWhiteCards: async (reply, data) => {
		console.log('Picking white cards:', data);
		ServerResponseFn.set(reply);
	},
	pickCzarCard: async (reply, data) => {
		console.log('Picking czar card:', data);
		ServerResponseFn.set(reply);
	},
	gameResults: async (reply, data) => {
		reply(OK);

		console.log('Game results:', data);
		LastGameResults.set(data as GameResults);
		navigate('/game-over');
	},
	playerCount: async (reply, data) => {
		reply(OK);

		PlayerCount.set((data as {
			count: number;
		}).count ?? 0);
	},
}
