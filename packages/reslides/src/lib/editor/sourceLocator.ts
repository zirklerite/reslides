export interface ElementLocation {
	/** Start of the opening tag (the `<`) */
	tagStart: number;
	/** End of the opening tag (after `>` or `/>`) */
	tagEnd: number;
	/** Start of text content (after opening tag's `>`), null for self-closing */
	contentStart: number | null;
	/** End of text content (before `</`), null for self-closing */
	contentEnd: number | null;
	/** Whether the tag is self-closing (`/>`) */
	selfClosing: boolean;
}

/**
 * Find an element in Svelte source by its `id` attribute value.
 * Returns byte positions for the opening tag and content region, or null if not found.
 */
export function findElementById(source: string, id: string): ElementLocation | null {
	// Match id="value" — look for the exact id attribute
	const idPattern = new RegExp(`<([A-Za-z]\\w*)\\s[^>]*?\\bid="${escapeRegex(id)}"[^>]*?(\\/?)>`, 'g');
	const match = idPattern.exec(source);
	if (!match) return null;

	const tagStart = match.index;
	const fullTag = match[0];
	const tagEnd = tagStart + fullTag.length;
	const isSelfClosing = fullTag.endsWith('/>');

	if (isSelfClosing) {
		return { tagStart, tagEnd, contentStart: null, contentEnd: null, selfClosing: true };
	}

	// Find the closing tag
	const tagName = match[1];
	const closingTag = `</${tagName}>`;
	// Simple search — find the next matching closing tag
	// This handles the common case; deeply nested same-name tags are rare in reslides
	let depth = 1;
	let pos = tagEnd;
	const openPattern = new RegExp(`<${tagName}[\\s>]`, 'g');
	const closePattern = new RegExp(`</${tagName}>`, 'g');

	while (depth > 0 && pos < source.length) {
		openPattern.lastIndex = pos;
		closePattern.lastIndex = pos;

		const nextOpen = openPattern.exec(source);
		const nextClose = closePattern.exec(source);

		if (!nextClose) return null; // malformed — no closing tag found

		if (nextOpen && nextOpen.index < nextClose.index) {
			depth++;
			pos = nextOpen.index + nextOpen[0].length;
		} else {
			depth--;
			if (depth === 0) {
				return {
					tagStart,
					tagEnd,
					contentStart: tagEnd,
					contentEnd: nextClose.index,
					selfClosing: false,
				};
			}
			pos = nextClose.index + nextClose[0].length;
		}
	}

	return null;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
