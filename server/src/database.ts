import { CardDeck, PrismaClient } from "@prisma/client";

export const db = new PrismaClient();

type CardDeckWithCounts = CardDeck & {
	whiteCardCount: number;
	blackCardCount: number;
	totalCardCount: number;
}

export async function queryCardDeckCounts(deck: CardDeck): Promise<CardDeckWithCounts> {
	const totalCardCount = await db.card.count({
		where: {
			deckId: deck.id,
		}
	});
	const whiteCardCount = await db.card.count({
		where: {
			deckId: deck.id,
			pick: 0,
		}
	});

	const blackCardCount = totalCardCount - whiteCardCount;

	return {
		...deck,
		whiteCardCount,
		blackCardCount,
		totalCardCount,
	};
}
