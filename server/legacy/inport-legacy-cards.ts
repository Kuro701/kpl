import { Card, PrismaClient } from '@prisma/client';
import fs from 'fs';


type LegacyBlackCard = {
	id: number;
	text: string;
	pick: number;
	source?: string;
};

type LegacyWhiteCard = {
	id: number;
	text: string;
	source?: string;
	tooltip?: string;
};

type CardImport = {
	text: string;
	tip?: string;
	pick: number;
}

function convertLegacyBlackCard(legacyCard: LegacyBlackCard): CardImport {
	return {
		text: legacyCard.text,
		pick: legacyCard.pick,
	};
}

function convertLegacyWhiteCard(legacyCard: LegacyWhiteCard): CardImport {
	return {
		text: legacyCard.text,
		tip: legacyCard.tooltip,
		pick: 0,
	};
}

async function importCards() {
	console.log('Importing legacy cards...');

	const black_cards = JSON.parse(fs.readFileSync( 'legacy/black_cards.json', 'utf8'));
	const white_cards = JSON.parse(fs.readFileSync('legacy/white_cards.json', 'utf8'));


	let packOriginal: CardImport[] = [];
	let packOriginalCommunity: CardImport[] = [];

	white_cards.forEach((card: LegacyWhiteCard) => {
		const cardImport = convertLegacyWhiteCard(card);
		if (card.source) {
			packOriginalCommunity.push(cardImport);
		} else {
			packOriginal.push(cardImport);
		}
	});

	black_cards.forEach((card: LegacyBlackCard) => {
		const cardImport = convertLegacyBlackCard(card);
		if (card.source) {
			packOriginalCommunity.push(cardImport);
		} else {
			packOriginal.push(cardImport);
		}
	});


	const db = new PrismaClient();
	await db.$transaction([
		db.cardDeck.create({
			data: {
				name: 'KPL Online - Original (2018)',
				description: 'Původní balíček karet použitý při prvním spuštění KPL Online v roce 2018',
				ownerUUID: 'system',
				default: true,
				public: true,
				cards: {
					createMany: {
						data: packOriginal,
					}
				}
			}
		}),
		db.cardDeck.create({
			data: {
				name: 'KPL Online - Community (2021)',
				description: 'Rozšíření balíčku karet na základě návrhů komunity v roce 2021',
				ownerUUID: 'system',
				default: true,
				public: true,
				cards: {
					createMany: {
						data: packOriginalCommunity,
					}
				}
			}
		}),
	]);
	console.log('Legacy cards imported');
}
importCards();
