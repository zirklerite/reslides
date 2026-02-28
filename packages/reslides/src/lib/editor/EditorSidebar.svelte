<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getDeckContext } from '../context.js';
	import { sendEdit, setSuppressTransition } from './editorSocket.js';
	import ThumbnailProvider from './ThumbnailProvider.svelte';

	interface Props {
		slides: Snippet;
		width: number;
		height: number;
		theme?: string;
		colorScheme?: string;
	}

	let { slides, width, height, theme = 'default', colorScheme = 'light' }: Props = $props();

	const deckCtx = getDeckContext();

	// Sidebar usable width: 200px grid column - 12px padding each side = 176px, minus border = ~172px
	let thumbScale = $derived(172 / width);

	let dragFrom: number | null = $state(null);
	let dragOverIndex: number | null = $state(null);
	let dropAfter = $state(false);
	let indicatorY = $state(0);
	let showIndicator = $state(false);

	function getSlideIndex(el: HTMLElement): number | null {
		const wrapper = el.closest('[data-slide-index]') as HTMLElement | null;
		if (!wrapper) return null;
		return parseInt(wrapper.dataset.slideIndex!, 10);
	}

	function handleClick(e: MouseEvent) {
		if (dragFrom !== null) return;
		const idx = getSlideIndex(e.target as HTMLElement);
		if (idx !== null) deckCtx.goTo(idx);
	}

	function handleDragStart(e: DragEvent) {
		const idx = getSlideIndex(e.target as HTMLElement);
		if (idx === null) return;
		dragFrom = idx;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(idx));
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

		const wrapper = (e.target as HTMLElement).closest('[data-slide-index]') as HTMLElement | null;
		if (!wrapper) {
			showIndicator = false;
			return;
		}

		const idx = parseInt(wrapper.dataset.slideIndex!, 10);
		if (idx === dragFrom) {
			showIndicator = false;
			return;
		}

		const rect = wrapper.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isAfter = e.clientY > midY;

		dragOverIndex = idx;
		dropAfter = isAfter;
		showIndicator = true;

		// Position indicator at top or bottom edge of the thumbnail, in the gap
		if (isAfter) {
			indicatorY = wrapper.offsetTop + wrapper.offsetHeight + 3;
		} else {
			indicatorY = wrapper.offsetTop - 3;
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		showIndicator = false;

		if (dragFrom === null || dragOverIndex === null || dragFrom === dragOverIndex) {
			dragFrom = null;
			dragOverIndex = null;
			return;
		}

		// Compute target position in original indices
		let targetPos = dropAfter ? dragOverIndex + 1 : dragOverIndex;

		// Build order: remove dragFrom, then insert at adjusted position
		const order: number[] = [];
		for (let i = 0; i < deckCtx.totalSlides; i++) {
			if (i !== dragFrom) order.push(i);
		}
		// After removal, indices shift if dragFrom was before targetPos
		if (dragFrom < targetPos) targetPos--;
		order.splice(targetPos, 0, dragFrom);

		const slideEl = document.querySelector('[data-edit-file]') as HTMLElement | null;
		const file = slideEl?.dataset.editFile;

		dragFrom = null;
		dragOverIndex = null;
		if (!file) return;

		setSuppressTransition();
		sendEdit('reorderSlides', { file, order });
	}

	function handleDragEnd() {
		showIndicator = false;
		dragFrom = null;
		dragOverIndex = null;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="thumb-list"
	data-theme={theme}
	data-color-scheme={colorScheme}
	style:--sidebar-thumb-scale={thumbScale}
	style:--deck-width="{width}px"
	style:--deck-height="{height}px"
	onclick={handleClick}
	ondragstart={handleDragStart}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	ondragend={handleDragEnd}
>
	<ThumbnailProvider>
		{@render slides()}
	</ThumbnailProvider>
	{#if showIndicator}
		<div class="drop-indicator" style:top="{indicatorY}px"></div>
	{/if}
</div>

<style>
	.thumb-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 8px;
		position: relative;
	}

	.drop-indicator {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: #3b82f6;
		border-radius: 1px;
		pointer-events: none;
		z-index: 10;
		transform: translateY(-1px);
	}
</style>
