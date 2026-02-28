/**
 * Layout presets — data-driven layout definitions.
 *
 * Each preset maps semantic roles (title, subtitle, body, etc.)
 * to position, size, and style values for a 960×540 slide.
 */

export interface RoleLayout {
	x: number;
	y: number;
	width: number;
	height?: number;
	size?: number;
	muted?: boolean;
	align?: 'left' | 'center' | 'right';
}

export interface LayoutPreset {
	id: string;
	name: string;
	roles: Record<string, RoleLayout>;
}

const PADDING = 60;
const SLIDE_W = 960;
const SLIDE_H = 540;
const CONTENT_W = SLIDE_W - PADDING * 2; // 840
const CONTENT_H = SLIDE_H - PADDING * 2; // 420

export const layoutPresets: LayoutPreset[] = [
	{
		id: 'title-slide',
		name: 'Title Slide',
		roles: {
			title: { x: 130, y: 170, width: 700, size: 48, align: 'center' },
			subtitle: { x: 180, y: 260, width: 600, size: 20, muted: true, align: 'center' },
		},
	},
	{
		id: 'section-header',
		name: 'Section Header',
		roles: {
			title: { x: 130, y: 200, width: 700, size: 40, align: 'center' },
		},
	},
	{
		id: 'title-content',
		name: 'Title + Content',
		roles: {
			title: { x: PADDING, y: 40, width: CONTENT_W, size: 36 },
			body: { x: PADDING, y: 120, width: CONTENT_W, height: 370 },
		},
	},
	{
		id: 'title-two-cols',
		name: 'Title + Two Columns',
		roles: {
			title: { x: PADDING, y: 40, width: CONTENT_W, size: 36 },
			body: { x: PADDING, y: 120, width: 390, height: 370 },
			'body-right': { x: 510, y: 120, width: 390, height: 370 },
		},
	},
	{
		id: 'title-only',
		name: 'Title Only',
		roles: {
			title: { x: PADDING, y: 40, width: CONTENT_W, size: 36 },
		},
	},
	{
		id: 'one-column',
		name: 'One Column',
		roles: {
			title: { x: PADDING, y: 40, width: CONTENT_W, size: 30 },
			subtitle: { x: PADDING, y: 90, width: CONTENT_W, size: 18, muted: true },
			body: { x: PADDING, y: 150, width: CONTENT_W, height: 340 },
		},
	},
	{
		id: 'main-point',
		name: 'Main Point',
		roles: {
			title: { x: PADDING, y: 100, width: 420, size: 36 },
			body: { x: 510, y: 60, width: 390, height: 420 },
		},
	},
	{
		id: 'section-description',
		name: 'Section + Description',
		roles: {
			title: { x: PADDING, y: 140, width: 400, size: 32 },
			subtitle: { x: PADDING, y: 210, width: 400, size: 16, muted: true },
			body: { x: 510, y: 60, width: 390, height: 420 },
		},
	},
	{
		id: 'caption',
		name: 'Caption',
		roles: {
			body: { x: PADDING, y: PADDING, width: CONTENT_W, height: 360 },
			caption: { x: 560, y: 460, width: 340, size: 14, muted: true, align: 'right' },
		},
	},
	{
		id: 'big-number',
		name: 'Big Number',
		roles: {
			number: { x: 130, y: 130, width: 700, size: 72, align: 'center' },
			body: { x: 180, y: 300, width: 600, size: 18, muted: true, align: 'center' },
		},
	},
	{
		id: 'blank',
		name: 'Blank',
		roles: {},
	},
];

export function getPresetById(id: string): LayoutPreset | undefined {
	return layoutPresets.find((p) => p.id === id);
}
