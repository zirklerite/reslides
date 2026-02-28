import { getContext, setContext } from 'svelte';
import type { DrawingState } from './drawingState.svelte.js';

const DRAWING_CONTEXT_KEY = Symbol('reslides-drawing');

export function setDrawingContext(state: DrawingState): void {
	setContext(DRAWING_CONTEXT_KEY, state);
}

export function getDrawingContext(): DrawingState | null {
	return getContext<DrawingState | undefined>(DRAWING_CONTEXT_KEY) ?? null;
}
