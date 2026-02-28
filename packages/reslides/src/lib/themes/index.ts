export const THEME_NAMES = [
	'default',
	'dark',
	'minimal',
	'academic',
	'corporate',
	'vibrant',
	'monochrome',
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];
