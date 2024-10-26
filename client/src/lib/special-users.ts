type SpecialUser = {
	text: string;
	icon: string;
	link?: string;
	iconInverted?: boolean;
}

const badges: Record<string, SpecialUser> = {
	developer: {
		text: "Programátorský tým",
		icon: '/img/badges/code.svg',
		iconInverted: true,
	},
	youtube: {
		text: "YouTuber",
		icon: '/img/badges/youtube.svg',
		iconInverted: true,
	},
	twitch: {
		text: "Twitch Streamer",
		icon: '/img/badges/twitch.svg',
		iconInverted: true,
	},
}

export const specialUsers: Record<string, SpecialUser> = {
	/* Negix       */ 'discord_252757031147012096': badges.developer,
	/* Awanys      */ 'discord_280025349226627072': { ...badges.youtube, link: 'https://youtube.com/@Awanys'      },
	/* Ayana       */ 'discord_358686107132624899': { ...badges.youtube, link: 'https://youtube.com/@AyanaDesign' },
	/* Senpai Dejv */ 'discord_574517196999360522': { ...badges.youtube, link: 'https://youtube.com/@senpaidejv'  },
	/* MarweX      */ 'discord_207938663110279168': { ...badges.youtube, link: 'https://youtube.com/@marwex99'    },
	/* MegaSkuci   */ 'discord_275342253046628352': { ...badges.youtube, link: 'https://youtube.com/@MegaSkuci'   },
	/* Siviaka     */ 'discord_757983882179248269': { ...badges.twitch,  link: 'https://www.twitch.tv/siviaka'    },
	/* Deril       */ 'discord_270552324202561536': { ...badges.twitch, link: 'https://www.twitch.tv/derilmc'     },
}
