type GoogleUser = {
	id: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
}

export async function getGoogleProfile(token: string): Promise<GoogleUser> {
	const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const data = await response.json();
	console.log(data);
	return data;
}
