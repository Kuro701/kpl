export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(arr: T[]): T {
	return arr[randomInt(0, arr.length - 1)];
}
