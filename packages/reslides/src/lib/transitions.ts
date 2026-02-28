import { fly, fade, scale } from 'svelte/transition';
import type { TransitionConfig } from 'svelte/transition';

export type TransitionPreset = 'none' | 'fade' | 'slide' | 'scale';
export type Direction = 'forward' | 'backward';

export function getInTransition(
	node: Element,
	preset: TransitionPreset,
	direction: Direction,
	width: number,
): TransitionConfig {
	switch (preset) {
		case 'fade':
			return fade(node, { duration: 300 });
		case 'slide':
			return fly(node, {
				x: direction === 'forward' ? width : -width,
				duration: 300,
			});
		case 'scale':
			return scale(node, { start: 0.8, duration: 300 });
		case 'none':
		default:
			return { duration: 0 };
	}
}

export function getOutTransition(
	node: Element,
	preset: TransitionPreset,
	direction: Direction,
	width: number,
): TransitionConfig {
	switch (preset) {
		case 'fade':
			return fade(node, { duration: 300 });
		case 'slide':
			return fly(node, {
				x: direction === 'forward' ? -width : width,
				duration: 300,
			});
		case 'scale':
			return scale(node, { start: 0.8, duration: 300 });
		case 'none':
		default:
			return { duration: 0 };
	}
}
