<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';
	import { setDeckContext, getDeckContext } from '../context.js';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const realCtx = getDeckContext();
	let counter = 0;

	// Mark this subtree as thumbnail mode
	setContext('reslides:thumbnail', true);

	// Shadow DeckContext: forwards reactive reads but no-ops all registration
	setDeckContext({
		get currentSlide() { return realCtx.currentSlide; },
		get totalSlides() { return realCtx.totalSlides; },
		get currentStep() { return realCtx.currentStep; },
		get totalSteps() { return realCtx.totalSteps; },
		get direction() { return realCtx.direction; },
		get transition() { return realCtx.transition; },
		get notes() { return realCtx.notes; },
		get overview() { return false; },
		get theme() { return realCtx.theme; },
		get inspect() { return false; },
		get isEditor() { return false; },
		get slideIds() { return realCtx.slideIds; },
		next() { realCtx.next(); },
		prev() { realCtx.prev(); },
		goTo(i: number) { realCtx.goTo(i); },
		openPresenter() {},
		toggleOverview() {},
		register() { return counter++; },
		reportTotalSteps() {},
		reportNotes() {},
		reportSlideId() {},
		registerContent() { return 0; },
		get backgroundConfig() { return realCtx.backgroundConfig; },
		reportBackground() {},
	});
</script>

{@render children()}
