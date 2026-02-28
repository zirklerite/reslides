<script lang="ts">
	import type { Snippet } from 'svelte';
	import DrawingOverlay from './drawing/DrawingOverlay.svelte';
	import DrawingToolbar from './drawing/DrawingToolbar.svelte';
	import { getDrawingContext } from './drawing/drawingContext.js';
	import { getDeckContext } from './context.js';

	interface Props {
		width?: number;
		height?: number;
		theme?: string;
		colorScheme?: string;
		children: Snippet;
	}

	let { width = 960, height = 540, theme = 'default', colorScheme = 'light', children }: Props = $props();

	const drawingState = getDrawingContext();
	const deckCtx = getDeckContext();

	let containerEl: HTMLDivElement | undefined = $state();
	let containerWidth = $state(0);
	let containerHeight = $state(0);

	let scale = $derived(
		Math.min(containerWidth / width, containerHeight / height) || 1
	);

	$effect(() => {
		if (!containerEl) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			containerWidth = entry.contentRect.width;
			containerHeight = entry.contentRect.height;
		});

		observer.observe(containerEl);

		return () => observer.disconnect();
	});
</script>

<div
	class="slide-container"
	bind:this={containerEl}
	data-theme={theme}
	data-color-scheme={colorScheme}
	style:--slide-scale={scale}
	style:--slide-width="{width}px"
	style:--slide-height="{height}px"
>
	<div class="slide-content">
		{@render children()}
	</div>

	{#if drawingState}
		<DrawingOverlay
			{width}
			{height}
			slideIndex={deckCtx.currentSlide}
			{drawingState}
		/>
		{#if drawingState.isDrawing}
			<DrawingToolbar
				{drawingState}
				slideIndex={deckCtx.currentSlide}
			/>
		{/if}
	{/if}
</div>

<style>
	.slide-container {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.slide-content {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--slide-width);
		height: var(--slide-height);
		transform: translate(-50%, -50%) scale(var(--slide-scale));
		transform-origin: center center;
		overflow: hidden;
	}
</style>
