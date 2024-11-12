export const GameErrors: Record<string, string> = {
	ROOM_DESTROYED_PLAYER_QUIT: 'Hráč se odpojil. Nedostatek hráčů. Hra byla zrušena.',
	ROOM_ALREADY_STARTED: 'Hra již začala',
	ROOM_FULL: 'Místnost je plná',
	ROOM_NOT_FOUND: 'Místnost nenalezena',
	ROOM_NOT_INITED: 'Chyba při spouštění hry',
};


function handleNetworkError(error: string) {
	const errorMsg = GameErrors[error];
	if (errorMsg) {
		alert(errorMsg);
	}
}
