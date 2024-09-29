import { getRandomAdjective } from "./random-db/random-adjectives";
import { getRandomAdverb } from "./random-db/random-adverbs";
import { getRandomNoun } from "./random-db/random-nouns";

export function randomRange(min: number, max: number, decimal: boolean = false): number {
  const random = Math.random() * (max - min) + min;
  return decimal ? random : Math.floor(random);
}

export function randomArrayElement<T>(array: T[]): T {
  return array[randomRange(0, array.length)];
}

export function randomUsername(): string {
	return `Hráč ${randomRange(0, 9999).toString().padStart(4, '0')}`;
}

export function randomRoomName(): string {
  const noun = getRandomNoun();
  const adjectives = [
    getRandomAdverb(),
    getRandomAdjective(noun[1]),
  ];

  return `${adjectives.join(' ')} ${noun[0]}`.toLowerCase();
}
