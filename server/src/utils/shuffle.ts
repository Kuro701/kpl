export function smartArrayShuffleAtPlace<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function smartArrayShuffle<T>(array: T[]): T[] {
	const newArray = [...array];
	return smartArrayShuffleAtPlace(newArray);
}
