export function autoFocus(node: HTMLElement) {
	let timeout: number | null = setTimeout(() => {
		node.focus();
		timeout = null;
	}, 0);

	return {
		destroy() {
			if (timeout) {
				clearTimeout(timeout);
			}
		}
	}
}
