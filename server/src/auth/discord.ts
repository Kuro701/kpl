interface DiscordUser {
	id: string;
	username: string;
	global_name: string;
	avatar: string;
}

export async function getDiscordUserInfo(token: string): Promise<DiscordUser> {
	const response = await fetch('https://discord.com/api/users/@me', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.json();
}
