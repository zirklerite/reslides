import type { Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import MagicString from 'magic-string';

// --- Source Locator (inlined for Node.js compatibility) ---

interface ElementLocation {
	tagStart: number;
	tagEnd: number;
	contentStart: number | null;
	contentEnd: number | null;
	selfClosing: boolean;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findElementById(source: string, id: string): ElementLocation | null {
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

	const tagName = match[1];
	let depth = 1;
	let pos = tagEnd;
	const openPattern = new RegExp(`<${tagName}[\\s>]`, 'g');
	const closePattern = new RegExp(`</${tagName}>`, 'g');

	while (depth > 0 && pos < source.length) {
		openPattern.lastIndex = pos;
		closePattern.lastIndex = pos;

		const nextOpen = openPattern.exec(source);
		const nextClose = closePattern.exec(source);

		if (!nextClose) return null;

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

/** Find the full end position of an element (including closing tag) */
function getElementFullEnd(source: string, loc: ElementLocation): number {
	if (loc.selfClosing) return loc.tagEnd;
	if (loc.contentEnd === null) return loc.tagEnd;
	const tagName = source.slice(loc.tagStart + 1).match(/^(\w+)/)?.[1];
	if (!tagName) return loc.tagEnd;
	const closeTag = `</${tagName}>`;
	const closeIdx = source.indexOf(closeTag, loc.contentEnd);
	if (closeIdx >= 0) return closeIdx + closeTag.length;
	return loc.tagEnd;
}

// --- Source Modifier (inlined for Node.js compatibility) ---

function replaceContent(source: string, start: number, end: number, newContent: string): string {
	const s = new MagicString(source);
	s.overwrite(start, end, newContent);
	return s.toString();
}

function replaceAttribute(source: string, tagStart: number, tagEnd: number, attrName: string, newValue: string): string {
	const s = new MagicString(source);
	const tag = source.slice(tagStart, tagEnd);

	// Match existing attribute in attribute position (preceded by whitespace, not inside a value).
	// Using (?<=\s) lookbehind to avoid matching inside CSS values like var(--text-muted).
	const attrPattern = new RegExp(`(?<=\\s)${escapeRegex(attrName)}(?:="[^"]*"|='[^']*'|=\\{[^}]*\\})`);
	const attrMatch = attrPattern.exec(tag);

	if (attrMatch) {
		const attrStart = tagStart + attrMatch.index;
		const attrEnd = attrStart + attrMatch[0].length;
		// Preserve expression syntax for numeric values
		const isNumeric = /^\d+(\.\d+)?$/.test(newValue);
		const replacement = isNumeric
			? `${attrName}={${newValue}}`
			: `${attrName}="${newValue}"`;
		s.overwrite(attrStart, attrEnd, replacement);
	} else {
		const insertPos = tagEnd - (tag.endsWith('/>') ? 2 : 1);
		const isNumeric = /^\d+(\.\d+)?$/.test(newValue);
		const newAttr = isNumeric
			? ` ${attrName}={${newValue}}`
			: ` ${attrName}="${newValue}"`;
		s.appendLeft(insertPos, newAttr);
	}

	return s.toString();
}

function removeAttribute(source: string, tagStart: number, tagEnd: number, attrName: string): string {
	const s = new MagicString(source);
	const tag = source.slice(tagStart, tagEnd);

	// Match valued attribute in attribute position (preceded by whitespace).
	// The \s prefix is included in the match so it gets removed along with the attribute.
	const valuedPattern = new RegExp(`\\s${escapeRegex(attrName)}(?:="[^"]*"|='[^']*'|=\\{[^}]*\\})`);
	const valuedMatch = valuedPattern.exec(tag);

	if (valuedMatch) {
		const attrStart = tagStart + valuedMatch.index;
		const attrEnd = attrStart + valuedMatch[0].length;
		s.remove(attrStart, attrEnd);
		return s.toString();
	}

	// Match bare attribute in attribute position (preceded by whitespace, followed by whitespace/>//>)
	const barePattern = new RegExp(`\\s${escapeRegex(attrName)}(?=[\\s/>]|$)`);
	const bareMatch = barePattern.exec(tag);

	if (bareMatch) {
		const attrStart = tagStart + bareMatch.index;
		const attrEnd = attrStart + bareMatch[0].length;
		s.remove(attrStart, attrEnd);
		return s.toString();
	}

	// Attribute not found — return unchanged
	return source;
}

function addBareAttribute(source: string, tagStart: number, tagEnd: number, attrName: string): string {
	const s = new MagicString(source);
	const tag = source.slice(tagStart, tagEnd);

	// Check if attribute already exists in attribute position (preceded by whitespace)
	const valuedExists = new RegExp(`(?<=\\s)${escapeRegex(attrName)}(?:="[^"]*"|='[^']*'|=\\{[^}]*\\})`).test(tag);
	const bareExists = new RegExp(`(?<=\\s)${escapeRegex(attrName)}(?=[\\s/>]|$)`).test(tag);
	if (valuedExists || bareExists) {
		// Already present — remove first, then re-add as bare
		const withoutAttr = removeAttribute(source, tagStart, tagEnd, attrName);
		// Re-locate the tag in the modified source
		const newLoc = findElementById(withoutAttr, source.slice(tagStart, tagEnd).match(/\bid="([^"]*)"/)?.[1] ?? '');
		if (newLoc) {
			const s2 = new MagicString(withoutAttr);
			const newTag = withoutAttr.slice(newLoc.tagStart, newLoc.tagEnd);
			const insertPos = newLoc.tagEnd - (newTag.endsWith('/>') ? 2 : 1);
			s2.appendLeft(insertPos, ` ${attrName}`);
			return s2.toString();
		}
		return withoutAttr;
	}

	// Not present — add before closing > or />
	const insertPos = tagEnd - (tag.endsWith('/>') ? 2 : 1);
	s.appendLeft(insertPos, ` ${attrName}`);
	return s.toString();
}

function replaceStyle(source: string, tagStart: number, tagEnd: number, styles: Record<string, string>): string {
	const s = new MagicString(source);
	const tag = source.slice(tagStart, tagEnd);

	// Parse existing style attribute
	const stylePattern = /\bstyle="([^"]*)"/;
	const styleMatch = stylePattern.exec(tag);

	// Build merged style map
	const styleMap = new Map<string, string>();

	if (styleMatch) {
		// Parse existing properties
		const existing = styleMatch[1];
		for (const part of existing.split(';')) {
			const trimmed = part.trim();
			if (!trimmed) continue;
			const colonIdx = trimmed.indexOf(':');
			if (colonIdx < 0) continue;
			const key = trimmed.slice(0, colonIdx).trim();
			const val = trimmed.slice(colonIdx + 1).trim();
			styleMap.set(key, val);
		}
	}

	// Merge new styles
	for (const [key, val] of Object.entries(styles)) {
		styleMap.set(key, val);
	}

	// Build style string
	const styleStr = Array.from(styleMap.entries())
		.map(([k, v]) => `${k}: ${v}`)
		.join('; ');

	if (styleMatch) {
		// Overwrite existing style attribute
		const attrStart = tagStart + styleMatch.index;
		const attrEnd = attrStart + styleMatch[0].length;
		s.overwrite(attrStart, attrEnd, `style="${styleStr}"`);
	} else {
		// Insert new style attribute
		const insertPos = tagEnd - (tag.endsWith('/>') ? 2 : 1);
		s.appendLeft(insertPos, ` style="${styleStr}"`);
	}

	return s.toString();
}

// --- Slide Block Reordering ---

interface SlideBlock {
	start: number;
	end: number;
}

function findAllSlideBlocks(source: string): SlideBlock[] {
	const blocks: SlideBlock[] = [];
	const openPattern = /<Slide[\s>]/g;
	const closePattern = /<\/Slide>/g;

	let match;
	while ((match = openPattern.exec(source)) !== null) {
		const start = match.index;
		let depth = 1;
		let pos = start + match[0].length;

		// Check for self-closing <Slide ... />
		const tagEndSearch = source.indexOf('>', start);
		if (tagEndSearch >= 0 && source[tagEndSearch - 1] === '/') {
			blocks.push({ start, end: tagEndSearch + 1 });
			continue;
		}

		while (depth > 0 && pos < source.length) {
			openPattern.lastIndex = pos;
			closePattern.lastIndex = pos;

			const nextOpen = openPattern.exec(source);
			const nextClose = closePattern.exec(source);

			if (!nextClose) break;

			if (nextOpen && nextOpen.index < nextClose.index) {
				depth++;
				pos = nextOpen.index + nextOpen[0].length;
			} else {
				depth--;
				if (depth === 0) {
					blocks.push({ start, end: nextClose.index + nextClose[0].length });
				}
				pos = nextClose.index + nextClose[0].length;
			}
		}

		// Reset openPattern lastIndex for the outer loop
		openPattern.lastIndex = blocks.length > 0 ? blocks[blocks.length - 1].end : pos;
	}

	return blocks;
}

function reorderSlideBlocks(source: string, order: number[]): string | null {
	const blocks = findAllSlideBlocks(source);
	if (blocks.length === 0) return null;
	if (order.length !== blocks.length) return null;

	// Validate order contains all indices exactly once
	const sorted = [...order].sort((a, b) => a - b);
	for (let i = 0; i < sorted.length; i++) {
		if (sorted[i] !== i) return null;
	}

	// Extract block contents and the gaps between them
	const blockContents = blocks.map(b => source.slice(b.start, b.end));

	// Find the gap before each block (from previous block end or from start-of-parent)
	// We'll reconstruct: prefix + block[order[0]] + gap + block[order[1]] + ... + suffix
	const prefix = source.slice(0, blocks[0].start);
	const suffix = source.slice(blocks[blocks.length - 1].end);

	// Gap between consecutive blocks (use the gap pattern from original order)
	const gaps: string[] = [];
	for (let i = 1; i < blocks.length; i++) {
		gaps.push(source.slice(blocks[i - 1].end, blocks[i].start));
	}

	// Reconstruct with reordered blocks, keeping original gaps between them
	let result = prefix;
	for (let i = 0; i < order.length; i++) {
		if (i > 0) {
			result += gaps[Math.min(i - 1, gaps.length - 1)] || '\n\n';
		}
		result += blockContents[order[i]];
	}
	result += suffix;

	return result;
}

// --- Element removal/grouping helpers ---

/** Expand a removal range to include leading whitespace and trailing newline */
function expandToLine(source: string, start: number, end: number): { start: number; end: number } {
	let s = start;
	while (s > 0 && (source[s - 1] === '\t' || source[s - 1] === ' ')) s--;
	let e = end;
	if (source[e] === '\n') e++;
	else if (source[e] === '\r' && source[e + 1] === '\n') e += 2;
	return { start: s, end: e };
}

// --- Vite Plugin ---

export function reslidesEditor(): Plugin {
	return {
		name: 'reslides-editor',
		apply: 'serve',
		enforce: 'pre',

		transform(code, id) {
			if (!id.endsWith('.svelte')) return;

			let result = code;

			// Match component tags with editable prop
			const tagRegex = /<([A-Z]\w*)\s([^>]*?)(?:\/>|>)/g;
			let match;

			while ((match = tagRegex.exec(result)) !== null) {
				const fullMatch = match[0];
				const attrs = match[2];

				// Check if this tag has an editable prop
				const editableMatch = attrs.match(/\beditable(?:="([^"]*)")?/);
				if (!editableMatch) continue;

				const caps = editableMatch[1] || 'text,style,position';

				// Extract id value
				const idMatch = attrs.match(/\bid="([^"]*)"/);

				let newTag: string;
				if (idMatch) {
					const elemId = idMatch[1];
					const dataAttrs = `data-edit-id="${elemId}" data-edit-file="${id}" data-edit-caps="${caps}"`;
					newTag = fullMatch.replace(attrs, `${attrs} ${dataAttrs}`);
				} else {
					// No id — skip injection, keep editable prop as-is
					continue;
				}

				result = result.slice(0, match.index) + newTag + result.slice(match.index + fullMatch.length);
				tagRegex.lastIndex = match.index + newTag.length;
			}

			if (result !== code) {
				return { code: result, map: null };
			}
		},

		configureServer(server) {
			const MAX_UNDO = 50;
			const undoStack: Array<{ file: string; content: string }> = [];
			const redoStack: Array<{ file: string; content: string }> = [];

			function pushUndo(file: string, content: string) {
				undoStack.push({ file, content });
				if (undoStack.length > MAX_UNDO) undoStack.shift();
				redoStack.length = 0;
			}

			server.hot.on('reslides:edit', (data, client) => {
				try {
					const { command, file, elementId, ...payload } = data;

					// --- Undo/redo: no file or elementId needed ---
					if (command === 'undo') {
						if (undoStack.length === 0) {
							client.send('reslides:edit-result', { error: 'Nothing to undo' });
							return;
						}
						const entry = undoStack.pop()!;
						let current: string;
						try {
							current = readFileSync(entry.file, 'utf-8');
						} catch {
							client.send('reslides:edit-result', { error: `File not found: ${entry.file}` });
							return;
						}
						redoStack.push({ file: entry.file, content: current });
						writeFileSync(entry.file, entry.content, 'utf-8');
						client.send('reslides:edit-result', { ok: true });
						return;
					}

					if (command === 'redo') {
						if (redoStack.length === 0) {
							client.send('reslides:edit-result', { error: 'Nothing to redo' });
							return;
						}
						const entry = redoStack.pop()!;
						let current: string;
						try {
							current = readFileSync(entry.file, 'utf-8');
						} catch {
							client.send('reslides:edit-result', { error: `File not found: ${entry.file}` });
							return;
						}
						undoStack.push({ file: entry.file, content: current });
						writeFileSync(entry.file, entry.content, 'utf-8');
						client.send('reslides:edit-result', { ok: true });
						return;
					}

					// --- Reorder slides: needs file but not elementId ---
					if (command === 'reorderSlides') {
						if (!file) {
							client.send('reslides:edit-result', { error: 'No file specified' });
							return;
						}
						let source: string;
						try {
							source = readFileSync(file, 'utf-8');
						} catch {
							client.send('reslides:edit-result', { error: `File not found: ${file}` });
							return;
						}
						const order: number[] = payload.order;
						if (!Array.isArray(order)) {
							client.send('reslides:edit-result', { error: 'Invalid order array' });
							return;
						}
						const reordered = reorderSlideBlocks(source, order);
						if (reordered === null) {
							client.send('reslides:edit-result', { error: 'Could not reorder slides' });
							return;
						}
						pushUndo(file, source);
						writeFileSync(file, reordered, 'utf-8');
						client.send('reslides:edit-result', { ok: true });
						return;
					}

					// --- removeElement ---
					if (command === 'removeElement') {
						if (!file || !elementId) {
							client.send('reslides:edit-result', { error: 'removeElement requires file and elementId' });
							return;
						}
						let source: string;
						try { source = readFileSync(file, 'utf-8'); } catch { client.send('reslides:edit-result', { error: `File not found: ${file}` }); return; }
						const elLoc = findElementById(source, elementId);
						if (!elLoc) { client.send('reslides:edit-result', { error: `Element not found: ${elementId}` }); return; }

						const fullEnd = getElementFullEnd(source, elLoc);
						const range = expandToLine(source, elLoc.tagStart, fullEnd);

						const s = new MagicString(source);
						s.remove(range.start, range.end);
						pushUndo(file, source);
						writeFileSync(file, s.toString(), 'utf-8');
						client.send('reslides:edit-result', { ok: true });
						return;
					}

					// --- groupElements ---
					if (command === 'groupElements') {
						if (!file) { client.send('reslides:edit-result', { error: 'No file specified' }); return; }
						let source: string;
						try { source = readFileSync(file, 'utf-8'); } catch { client.send('reslides:edit-result', { error: `File not found: ${file}` }); return; }
						const eids: string[] = payload.elementIds;
						if (!Array.isArray(eids) || eids.length < 2) {
							client.send('reslides:edit-result', { error: 'Need at least 2 elementIds' });
							return;
						}

						// Find all elements and their source positions
						const items: Array<{ id: string; start: number; end: number }> = [];
						for (const eid of eids) {
							const loc = findElementById(source, eid);
							if (!loc) { client.send('reslides:edit-result', { error: `Element not found: ${eid}` }); return; }
							items.push({ id: eid, start: loc.tagStart, end: getElementFullEnd(source, loc) });
						}
						items.sort((a, b) => a.start - b.start);

						// Extract each element's source text
						const extracted = items.map(it => source.slice(it.start, it.end));

						// Generate unique group id
						const groupNum = (source.match(/group-(\d+)/g) || []).length + 1;
						const groupId = `group-${groupNum}`;

						// Detect indentation from the first element
						let lineStart = items[0].start;
						while (lineStart > 0 && source[lineStart - 1] !== '\n') lineStart--;
						const indent = source.slice(lineStart, items[0].start);
						const childIndent = indent + '\t';

						// Build group wrapper
						const groupContent = extracted.map(e => `${childIndent}${e}`).join('\n');
						const groupBlock = `${indent}<Group id="${groupId}" editable>\n${groupContent}\n${indent}</Group>`;

						// Remove elements backwards and insert group at first position
						const s = new MagicString(source);
						for (let i = items.length - 1; i >= 0; i--) {
							const range = expandToLine(source, items[i].start, items[i].end);
							if (i === 0) {
								s.overwrite(range.start, range.end, groupBlock + '\n');
							} else {
								s.remove(range.start, range.end);
							}
						}

						pushUndo(file, source);
						writeFileSync(file, s.toString(), 'utf-8');
						client.send('reslides:edit-result', { ok: true });
						return;
					}

					// --- ungroupElements ---
					if (command === 'ungroupElements') {
						if (!file || !elementId) {
							client.send('reslides:edit-result', { error: 'ungroupElements requires file and elementId' });
							return;
						}
						let source: string;
						try { source = readFileSync(file, 'utf-8'); } catch { client.send('reslides:edit-result', { error: `File not found: ${file}` }); return; }
						const gl = findElementById(source, elementId);
						if (!gl) { client.send('reslides:edit-result', { error: `Element not found: ${elementId}` }); return; }
						if (gl.selfClosing || gl.contentStart === null || gl.contentEnd === null) {
							client.send('reslides:edit-result', { error: 'Element has no children to ungroup' });
							return;
						}

						const fullEnd = getElementFullEnd(source, gl);

						// Extract and dedent inner content
						const inner = source.slice(gl.contentStart, gl.contentEnd);
						const lines = inner.split('\n');
						const dedented = lines.map(line => {
							if (line.startsWith('\t')) return line.slice(1);
							if (line.startsWith('    ')) return line.slice(4);
							return line;
						}).join('\n');

						const range = expandToLine(source, gl.tagStart, fullEnd);
						const s = new MagicString(source);
						s.overwrite(range.start, range.end, dedented.trim() + '\n');

						pushUndo(file, source);
						writeFileSync(file, s.toString(), 'utf-8');
						client.send('reslides:edit-result', { ok: true });
						return;
					}

					// --- Standard element-based commands ---
					if (!file) {
						client.send('reslides:edit-result', { error: 'No file specified' });
						return;
					}

					let source: string;
					try {
						source = readFileSync(file, 'utf-8');
					} catch {
						client.send('reslides:edit-result', { error: `File not found: ${file}` });
						return;
					}

					if (!elementId) {
						client.send('reslides:edit-result', { error: 'No elementId specified' });
						return;
					}

					const loc = findElementById(source, elementId);
					if (!loc) {
						client.send('reslides:edit-result', { error: `Element not found: ${elementId}` });
						return;
					}

					let modified: string | null = null;

					switch (command) {
						case 'replaceContent':
							if (loc.contentStart !== null && loc.contentEnd !== null) {
								modified = replaceContent(source, loc.contentStart, loc.contentEnd, payload.content);
							}
							break;
						case 'replaceAttribute':
							modified = replaceAttribute(source, loc.tagStart, loc.tagEnd, payload.attrName, payload.attrValue);
							break;
						case 'removeAttribute':
							modified = removeAttribute(source, loc.tagStart, loc.tagEnd, payload.attrName);
							break;
						case 'addBareAttribute':
							modified = addBareAttribute(source, loc.tagStart, loc.tagEnd, payload.attrName);
							break;
						case 'replaceStyle':
							modified = replaceStyle(source, loc.tagStart, loc.tagEnd, payload.styles);
							break;
						case 'insertNotes': {
							if (loc.contentEnd !== null && loc.contentStart !== null) {
								const region = source.slice(loc.contentStart, loc.contentEnd);
								const lastNl = region.lastIndexOf('\n');
								const closingIndent = lastNl >= 0 ? region.slice(lastNl + 1) : '';
								const childMatch = region.match(/\n(\s+)\S/);
								const childIndent = childMatch ? childMatch[1] : closingIndent + '\t';

								const s = new MagicString(source);
								if (lastNl >= 0) {
									const insertPos = loc.contentStart + lastNl + 1;
									s.appendLeft(insertPos, `${childIndent}<Notes id="${payload.notesId}" editable>${payload.content}</Notes>\n`);
								} else {
									s.appendLeft(loc.contentEnd, `\n${childIndent}<Notes id="${payload.notesId}" editable>${payload.content}</Notes>\n${closingIndent}`);
								}
								modified = s.toString();
							}
							break;
						}
					}

					if (modified !== null) {
						pushUndo(file, source);
						writeFileSync(file, modified, 'utf-8');
						client.send('reslides:edit-result', { ok: true });
					} else {
						client.send('reslides:edit-result', { error: `Command not handled: ${command}` });
					}
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					client.send('reslides:edit-result', { error: message });
				}
			});
		},
	};
}
