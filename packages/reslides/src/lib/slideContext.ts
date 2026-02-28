import { getContext, setContext, hasContext } from 'svelte';

const SLIDE_CONTEXT_KEY = Symbol('reslides-slide');

export interface SlideContext {
	readonly currentStep: number;
	readonly totalSteps: number;
	registerStep: () => number;
	reportNotes: (notes: string) => void;
}

export function setSlideContext(ctx: SlideContext): void {
	setContext(SLIDE_CONTEXT_KEY, ctx);
}

export function getSlideContext(): SlideContext {
	return getContext<SlideContext>(SLIDE_CONTEXT_KEY);
}

export function hasSlideContext(): boolean {
	return hasContext(SLIDE_CONTEXT_KEY);
}
