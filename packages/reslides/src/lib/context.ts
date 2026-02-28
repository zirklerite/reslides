import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';
import type { TransitionPreset, Direction } from './transitions.js';

export interface BackgroundConfig {
	color?: string;
	gradient?: string;
	children?: Snippet;
}

const DECK_CONTEXT_KEY = Symbol('reslides-deck');

export interface DeckContext {
	readonly currentSlide: number;
	readonly totalSlides: number;
	readonly currentStep: number;
	readonly totalSteps: number;
	readonly direction: Direction;
	readonly transition: TransitionPreset;
	readonly notes: string;
	readonly overview: boolean;
	readonly theme: string;
	readonly inspect: boolean;
	readonly isEditor: boolean;
	readonly slideIds: ReadonlyArray<string | undefined>;
	next: () => void;
	prev: () => void;
	goTo: (index: number) => void;
	openPresenter: () => void;
	toggleOverview: () => void;
	register: () => number;
	reportTotalSteps: (slideIndex: number, count: number) => void;
	reportNotes: (slideIndex: number, notes: string) => void;
	reportSlideId: (slideIndex: number, id: string | undefined) => void;
	registerContent: (type: string) => number;
	readonly backgroundConfig: BackgroundConfig | null;
	reportBackground: (config: BackgroundConfig) => void;
}

export function setDeckContext(ctx: DeckContext): void {
	setContext(DECK_CONTEXT_KEY, ctx);
}

export function getDeckContext(): DeckContext {
	return getContext<DeckContext>(DECK_CONTEXT_KEY);
}
