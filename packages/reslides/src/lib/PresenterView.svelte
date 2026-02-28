<script lang="ts">
	import type { Snippet } from 'svelte';
	import SlideContainer from './SlideContainer.svelte';
	import PresenterTimer from './PresenterTimer.svelte';

	interface Props {
		width: number;
		height: number;
		currentSlide: number;
		totalSlides: number;
		currentStep: number;
		totalSteps: number;
		notes: string;
		theme?: string;
		colorScheme?: string;
		children: Snippet;
	}

	let {
		width,
		height,
		currentSlide,
		totalSlides,
		currentStep,
		totalSteps,
		notes,
		theme = 'default',
		colorScheme = 'light',
		children,
	}: Props = $props();
</script>

<div class="presenter-view" data-theme={theme} data-color-scheme={colorScheme}>
	<div class="current-slide">
		<div class="slide-frame">
			<SlideContainer {width} {height}>
				{@render children()}
			</SlideContainer>
		</div>
	</div>

	<div class="next-slide">
		<div class="panel-label">Next</div>
		{#if currentSlide < totalSlides - 1}
			<div class="next-indicator">Slide {currentSlide + 2}</div>
		{:else}
			<div class="next-indicator end">End of presentation</div>
		{/if}
	</div>

	<div class="notes-panel">
		<div class="panel-label">Notes</div>
		<div class="notes-content">
			{#if notes}
				{notes}
			{:else}
				<span class="no-notes">No notes for this slide</span>
			{/if}
		</div>
	</div>

	<div class="info-panel">
		<PresenterTimer />
		<div class="progress">
			{currentSlide + 1} / {totalSlides}
		</div>
		{#if totalSteps > 0}
			<div class="steps">
				Step {currentStep} / {totalSteps}
			</div>
		{/if}
		<div class="hint">Press arrows to navigate</div>
	</div>
</div>

<style>
	.presenter-view {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 3fr 2fr;
		gap: 12px;
		padding: 12px;
		box-sizing: border-box;
		background: #1a1a1a;
		color: #e0e0e0;
		font-family: var(--font-body, system-ui, sans-serif);
	}

	.current-slide {
		grid-column: 1;
		grid-row: 1;
		border: 2px solid #333;
		border-radius: 8px;
		overflow: hidden;
		background: #000;
	}

	.slide-frame {
		width: 100%;
		height: 100%;
	}

	.next-slide {
		grid-column: 2;
		grid-row: 1;
		border: 2px solid #333;
		border-radius: 8px;
		overflow: hidden;
		background: #111;
		display: flex;
		flex-direction: column;
		padding: 12px;
	}

	.next-indicator {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		color: #888;
	}

	.next-indicator.end {
		font-style: italic;
		color: #666;
	}

	.notes-panel {
		grid-column: 1;
		grid-row: 2;
		border: 2px solid #333;
		border-radius: 8px;
		padding: 12px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.notes-content {
		flex: 1;
		font-size: 1.125rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.no-notes {
		color: #555;
		font-style: italic;
	}

	.info-panel {
		grid-column: 2;
		grid-row: 2;
		border: 2px solid #333;
		border-radius: 8px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.panel-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #666;
		margin-bottom: 8px;
	}

	.progress {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.steps {
		font-size: 0.875rem;
		color: #888;
	}

	.hint {
		font-size: 0.75rem;
		color: #555;
		margin-top: auto;
	}
</style>
