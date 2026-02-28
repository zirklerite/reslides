import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

const DEFAULT_LANGS: BundledLanguage[] = [
	'javascript',
	'typescript',
	'html',
	'css',
	'json',
	'python',
	'svelte',
];

const DEFAULT_THEME = 'github-dark';

let highlighterPromise: Promise<Highlighter> | null = null;
let highlighterInstance: Highlighter | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (highlighterInstance) return Promise.resolve(highlighterInstance);
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: [DEFAULT_THEME],
			langs: DEFAULT_LANGS,
		}).then((h) => {
			highlighterInstance = h;
			return h;
		});
	}
	return highlighterPromise;
}

async function ensureTheme(h: Highlighter, theme: string): Promise<boolean> {
	const loaded = h.getLoadedThemes();
	if (loaded.includes(theme)) return true;
	try {
		await h.loadTheme(theme as Parameters<Highlighter['loadTheme']>[0]);
		return true;
	} catch {
		return false;
	}
}

async function ensureLang(h: Highlighter, lang: string): Promise<boolean> {
	const loaded = h.getLoadedLanguages();
	if (loaded.includes(lang)) return true;
	try {
		await h.loadLanguage(lang as BundledLanguage);
		return true;
	} catch {
		return false;
	}
}

export async function highlight(
	code: string,
	lang?: string,
	theme: string = DEFAULT_THEME,
): Promise<string | null> {
	if (!lang) return null;

	try {
		const h = await getHighlighter();
		const themeOk = await ensureTheme(h, theme);
		if (!themeOk) return null;
		const langOk = await ensureLang(h, lang);
		if (!langOk) return null;

		return h.codeToHtml(code, { lang, theme });
	} catch {
		return null;
	}
}
