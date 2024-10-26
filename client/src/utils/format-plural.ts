export function formatPlural(count: number, one: string, few: string, many: string, zero: string | undefined = undefined): string {
	count = Math.abs(count);
	if (count === 0 && zero) return zero;
	if (count === 1) return one;
	if (count >= 2 && count <= 4) return few;
	return many;
}
