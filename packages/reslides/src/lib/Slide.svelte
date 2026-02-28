<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TransitionPreset } from './transitions.js';
	import { getInTransition, getOutTransition } from './transitions.js';
	import { getContext } from 'svelte';
	import { getDeckContext } from './context.js';
	import { consumeSuppressTransition } from './editor/editorSocket.js';
	import { setSlideContext } from './slideContext.js';

	interface Props {
		id?: string;
		transition?: TransitionPreset;
		theme?: string;
		editable?: string | boolean;
		children: Snippet;
		[key: string]: unknown;
	}

	let { id, transition, theme, editable, children, ...restProps }: Props = $props();

	const isThumbnail = getContext('reslides:thumbnail') === true;
	const deckCtx = getDeckContext();
	const slideIndex = deckCtx.register();

	$effect(() => {
		deckCtx.reportSlideId(slideIndex, id);
	});

	let active = $derived(deckCtx.currentSlide === slideIndex);
	let visible = $derived(active || deckCtx.overview);
	let isCurrent = $derived(deckCtx.currentSlide === slideIndex);

	let stepCount = $state(0);

	// Reset step count before children re-mount when slide becomes active
	$effect.pre(() => {
		if (active) {
			stepCount = 0;
		}
	});

	function registerStep(): number {
		stepCount++;
		deckCtx.reportTotalSteps(slideIndex, stepCount);
		return stepCount;
	}

	setSlideContext({
		get currentStep() {
			// Thumbnails: show all steps. Non-active slides: show step 0.
			if (isThumbnail) return Infinity;
			if (!active) return 0;
			return deckCtx.currentStep;
		},
		get totalSteps() { return stepCount; },
		registerStep,
		reportNotes(notes: string) {
			deckCtx.reportNotes(slideIndex, notes);
		},
	});

	function slideIn(node: Element) {
		if (consumeSuppressTransition()) {
			return { duration: 0 };
		}
		const preset = transition ?? deckCtx.transition;
		return getInTransition(node, preset, deckCtx.direction, node.clientWidth);
	}

	function slideOut(node: Element) {
		const preset = transition ?? deckCtx.transition;
		return getOutTransition(node, preset, deckCtx.direction, node.clientWidth);
	}

	function handleThumbnailClick() {
		deckCtx.goTo(slideIndex);
		deckCtx.toggleOverview();
	}
</script>

{#if isThumbnail}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="sidebar-thumb"
		class:current={deckCtx.currentSlide === slideIndex}
		data-slide-index={slideIndex}
		draggable="true"
	>
		<div class="sidebar-thumb-label">{slideIndex + 1}</div>
		<div class="sidebar-thumb-content">
			<div class="slide" data-theme={theme ?? undefined}>
				{#if deckCtx.backgroundConfig}
					<div
						class="slide-deck-bg"
						style:background-color={deckCtx.backgroundConfig.color ?? undefined}
						style:background-image={deckCtx.backgroundConfig.gradient ?? undefined}
					>
						{#if deckCtx.backgroundConfig.children}
							{@render deckCtx.backgroundConfig.children()}
						{/if}
					</div>
				{/if}
				{@render children()}
			</div>
		</div>
	</div>
{:else if deckCtx.overview}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="thumbnail"
		class:current={isCurrent}
		onclick={handleThumbnailClick}
	>
		<div class="thumbnail-label">{slideIndex + 1}</div>
		<div class="thumbnail-content">
			<div class="slide" data-theme={theme ?? undefined}>
				{#if deckCtx.backgroundConfig}
					<div
						class="slide-deck-bg"
						style:background-color={deckCtx.backgroundConfig.color ?? undefined}
						style:background-image={deckCtx.backgroundConfig.gradient ?? undefined}
					>
						{#if deckCtx.backgroundConfig.children}
							{@render deckCtx.backgroundConfig.children()}
						{/if}
					</div>
				{/if}
				{@render children()}
			</div>
		</div>
	</div>
{:else if active}
	<div
		{...restProps}
		class="slide"
		data-edit-type="slide"
		data-theme={theme ?? undefined}
		in:slideIn
		out:slideOut
	>
		{#if deckCtx.backgroundConfig}
			<div
				class="slide-deck-bg"
				style:background-color={deckCtx.backgroundConfig.color ?? undefined}
				style:background-image={deckCtx.backgroundConfig.gradient ?? undefined}
			>
				{#if deckCtx.backgroundConfig.children}
					{@render deckCtx.backgroundConfig.children()}
				{/if}
			</div>
		{/if}
		{@render children()}
	</div>
{/if}

<style>
	.slide {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
		overflow: hidden;
		box-sizing: border-box;
		background: var(--slide-bg);
		color: var(--text-color);
	}

	.slide-deck-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}

	.thumbnail {
		position: relative;
		border: 2px solid #333;
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		background: #000;
		aspect-ratio: 16 / 9;
	}

	.thumbnail:hover {
		border-color: #666;
	}

	.thumbnail.current {
		border-color: var(--accent-color, #3b82f6);
		box-shadow: 0 0 0 2px var(--accent-color, #3b82f6);
	}

	.thumbnail-label {
		position: absolute;
		top: 4px;
		left: 6px;
		font-size: 0.625rem;
		color: #888;
		font-family: var(--font-mono, monospace);
		z-index: 1;
		background: rgba(0, 0, 0, 0.6);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.thumbnail-content {
		width: 960px;
		height: 540px;
		transform-origin: top left;
		transform: scale(var(--thumb-scale, 0.25));
		pointer-events: none;
		position: relative;
	}

	/* Sidebar thumbnails */
	.sidebar-thumb {
		position: relative;
		border: 2px solid #333;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		background: #000;
		aspect-ratio: 16 / 9;
	}

	.sidebar-thumb:hover {
		border-color: #555;
	}

	.sidebar-thumb.current {
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}

	.sidebar-thumb-label {
		position: absolute;
		top: 3px;
		left: 4px;
		font-size: 0.5rem;
		color: #999;
		font-family: var(--font-mono, monospace);
		z-index: 1;
		background: rgba(0, 0, 0, 0.7);
		padding: 0 3px;
		border-radius: 2px;
		line-height: 1.4;
	}

	.sidebar-thumb-content {
		width: var(--deck-width, 960px);
		height: var(--deck-height, 540px);
		transform-origin: top left;
		transform: scale(var(--sidebar-thumb-scale, 0.18));
		pointer-events: none;
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
