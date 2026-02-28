import MagicString from 'magic-string';

/**
 * Replace text content between start and end positions.
 */
export function replaceContent(source: string, start: number, end: number, newContent: string): string {
	const s = new MagicString(source);
	s.overwrite(start, end, newContent);
	return s.toString();
}

/**
 * Replace or insert an attribute value on an opening tag.
 * tagStart/tagEnd define the opening tag bounds (from `<` to `>`).
 */
export function replaceAttribute(source: string, tagStart: number, tagEnd: number, attrName: string, newValue: string): string {
	const s = new MagicString(source);
	const tag = source.slice(tagStart, tagEnd);

	// Match existing attribute in attribute position (preceded by whitespace, not inside a value).
	// Using (?<=\s) lookbehind to avoid matching inside CSS values like var(--text-muted).
	const attrPattern = new RegExp(`(?<=\\s)${escapeRegex(attrName)}(?:="[^"]*"|='[^']*'|=\\{[^}]*\\})`);
	const attrMatch = attrPattern.exec(tag);

	if (attrMatch) {
		// Replace existing attribute value
		const attrStart = tagStart + attrMatch.index;
		const attrEnd = attrStart + attrMatch[0].length;
		// Preserve expression syntax for numeric values
		const isNumeric = /^\d+(\.\d+)?$/.test(newValue);
		const replacement = isNumeric
			? `${attrName}={${newValue}}`
			: `${attrName}="${newValue}"`;
		s.overwrite(attrStart, attrEnd, replacement);
	} else {
		// Insert new attribute before the closing > or />
		const insertPos = tagEnd - (tag.endsWith('/>') ? 2 : 1);
		s.appendLeft(insertPos, ` ${attrName}="${newValue}"`);
	}

	return s.toString();
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
