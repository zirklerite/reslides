<script lang="ts">
	type HandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

	interface Props {
		targetId: string;
		editVersion?: number;
		draggable?: boolean;
		resizable?: boolean;
		onDrag?: (delta: { dx: number; dy: number }) => void;
		onDragEnd?: (delta: { dx: number; dy: number }) => void;
		onResize?: (dims: { left: number; top: number; width: number; height: number }) => void;
		onResizeEnd?: (dims: { left: number; top: number; width: number; height: number }) => void;
	}

	let { targetId, editVersion = 0, draggable = false, resizable = false, onDrag, onDragEnd, onResize, onResizeEnd }: Props = $props();

	const TYPE_COLORS: Record<string, string> = {
		slide: 'rgba(239, 68, 68, 0.85)',
		step: 'rgba(16, 185, 129, 0.85)',
		text: 'rgba(245, 158, 11, 0.85)',
		image: 'rgba(245, 158, 11, 0.85)',
		code: 'rgba(245, 158, 11, 0.85)',
		list: 'rgba(245, 158, 11, 0.85)',
		group: 'rgba(168, 85, 247, 0.85)',
	};

	let top = $state(0);
	let left = $state(0);
	let boxWidth = $state(0);
	let boxHeight = $state(0);
	let visible = $state(false);
	let dragging = $state(false);
	let resizing = $state(false);
	let labelText = $state('');
	let labelColor = $state('rgba(245, 158, 11, 0.85)');
	let isGroup = $state(false);
	let showHandles = $state(true);

	function getGroupBounds(el: Element): DOMRect {
		const children = el.querySelectorAll('[data-edit-id]');
		if (children.length === 0) return el.getBoundingClientRect();
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const child of children) {
			const r = child.getBoundingClientRect();
			if (r.width === 0 && r.height === 0) continue;
			minX = Math.min(minX, r.left);
			minY = Math.min(minY, r.top);
			maxX = Math.max(maxX, r.right);
			maxY = Math.max(maxY, r.bottom);
		}
		if (minX === Infinity) return el.getBoundingClientRect();
		return new DOMRect(minX, minY, maxX - minX, maxY - minY);
	}

	function updateRect(el: Element) {
		const canvas = el.closest('.editor-canvas');
		if (!canvas) return;
		const canvasRect = canvas.getBoundingClientRect();
		const elRect = isGroup ? getGroupBounds(el) : el.getBoundingClientRect();
		const pad = isGroup ? 8 : 0;
		top = elRect.top - canvasRect.top - pad;
		left = elRect.left - canvasRect.left - pad;
		boxWidth = elRect.width + pad * 2;
		boxHeight = elRect.height + pad * 2;
		visible = true;
	}

	$effect(() => {
		// Depend on editVersion to re-query DOM after HMR
		void editVersion;
		const canvas = document.querySelector('.editor-canvas');
		const el = canvas?.querySelector(`[data-edit-id="${targetId}"]`);
		if (!el) {
			visible = false;
			return;
		}

		const htmlEl = el as HTMLElement;
		const editType = htmlEl.dataset.editType ?? 'text';
		labelColor = TYPE_COLORS[editType] ?? TYPE_COLORS.text;
		labelText = targetId;
		isGroup = editType === 'group';
		showHandles = editType !== 'slide';

		updateRect(el);

		const observer = new ResizeObserver(() => {
			if (!dragging && !resizing) updateRect(el);
		});
		observer.observe(el);

		return () => observer.disconnect();
	});

	const HANDLE_SIZE = 8;
	const HALF = HANDLE_SIZE / 2;
	const BORDER = 2;
	const B = BORDER / 2; // offset to center handles on the border line

	// With border-box, right/bottom border centers are inset by 2*BORDER from the style width/height
	const handles: Array<{ x: number; y: number; cursor: string; direction: HandleDirection }> = $derived([
		// Corners — centered on border intersection
		{ x: -HALF - B, y: -HALF - B, cursor: 'nwse-resize', direction: 'nw' as HandleDirection },
		{ x: boxWidth - 2 * BORDER + B - HALF, y: -HALF - B, cursor: 'nesw-resize', direction: 'ne' as HandleDirection },
		{ x: -HALF - B, y: boxHeight - 2 * BORDER + B - HALF, cursor: 'nesw-resize', direction: 'sw' as HandleDirection },
		{ x: boxWidth - 2 * BORDER + B - HALF, y: boxHeight - 2 * BORDER + B - HALF, cursor: 'nwse-resize', direction: 'se' as HandleDirection },
		// Edge midpoints — centered on border line
		{ x: boxWidth / 2 - HALF, y: -HALF - B, cursor: 'ns-resize', direction: 'n' as HandleDirection },
		{ x: boxWidth / 2 - HALF, y: boxHeight - 2 * BORDER + B - HALF, cursor: 'ns-resize', direction: 's' as HandleDirection },
		{ x: -HALF - B, y: boxHeight / 2 - HALF, cursor: 'ew-resize', direction: 'w' as HandleDirection },
		{ x: boxWidth - 2 * BORDER + B - HALF, y: boxHeight / 2 - HALF, cursor: 'ew-resize', direction: 'e' as HandleDirection },
	]);

	// --- Scale helper ---
	function getScale(): number {
		const slideContent = document.querySelector('.editor-canvas .slide-content') as HTMLElement | null;
		if (!slideContent) return 1;
		return slideContent.getBoundingClientRect().width / 960;
	}

	// --- Drag logic ---
	let startX = 0;
	let startY = 0;
	let startBoxLeft = 0;
	let startBoxTop = 0;

	function handlePointerDown(e: PointerEvent) {
		if (!draggable) return;
		e.preventDefault();
		e.stopPropagation();

		startX = e.clientX;
		startY = e.clientY;
		startBoxLeft = left;
		startBoxTop = top;
		dragging = true;

		document.body.style.cursor = 'grabbing';
		document.body.style.userSelect = 'none';

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		const scale = getScale();
		const screenDx = e.clientX - startX;
		const screenDy = e.clientY - startY;

		// Move the box visually (screen space)
		left = startBoxLeft + screenDx;
		top = startBoxTop + screenDy;

		// Report delta in slide coordinates
		onDrag?.({ dx: screenDx / scale, dy: screenDy / scale });
	}

	function handlePointerUp(e: PointerEvent) {
		const scale = getScale();
		const screenDx = e.clientX - startX;
		const screenDy = e.clientY - startY;

		dragging = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';

		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);

		// Report final delta in slide coordinates
		onDragEnd?.({ dx: screenDx / scale, dy: screenDy / scale });
	}

	// --- Resize logic ---
	let resizeDirection: HandleDirection = 'se';
	let resizeStartX = 0;
	let resizeStartY = 0;
	let initialLeft = 0;
	let initialTop = 0;
	let initialWidth = 0;
	let initialHeight = 0;

	const MIN_SIZE = 20;

	// Direction-to-edge mapping
	function affectsLeft(dir: HandleDirection) { return dir === 'nw' || dir === 'w' || dir === 'sw'; }
	function affectsTop(dir: HandleDirection) { return dir === 'nw' || dir === 'n' || dir === 'ne'; }
	function affectsWidth(dir: HandleDirection) { return dir !== 'n' && dir !== 's'; }
	function affectsHeight(dir: HandleDirection) { return dir !== 'e' && dir !== 'w'; }

	function computeResize(dx: number, dy: number): { left: number; top: number; width: number; height: number } {
		let newLeft = initialLeft;
		let newTop = initialTop;
		let newWidth = initialWidth;
		let newHeight = initialHeight;

		if (affectsWidth(resizeDirection)) {
			if (affectsLeft(resizeDirection)) {
				newLeft = initialLeft + dx;
				newWidth = initialWidth - dx;
			} else {
				newWidth = initialWidth + dx;
			}
		}

		if (affectsHeight(resizeDirection)) {
			if (affectsTop(resizeDirection)) {
				newTop = initialTop + dy;
				newHeight = initialHeight - dy;
			} else {
				newHeight = initialHeight + dy;
			}
		}

		// Enforce minimum size
		if (newWidth < MIN_SIZE) {
			if (affectsLeft(resizeDirection)) {
				newLeft = initialLeft + initialWidth - MIN_SIZE;
			}
			newWidth = MIN_SIZE;
		}
		if (newHeight < MIN_SIZE) {
			if (affectsTop(resizeDirection)) {
				newTop = initialTop + initialHeight - MIN_SIZE;
			}
			newHeight = MIN_SIZE;
		}

		return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
	}

	function handleHandlePointerDown(e: PointerEvent, direction: HandleDirection) {
		if (!resizable) return;
		e.preventDefault();
		e.stopPropagation();

		resizeDirection = direction;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizing = true;

		// Get the target element's current rect in slide coordinates
		const canvas = document.querySelector('.editor-canvas');
		const el = canvas?.querySelector(`[data-edit-id="${targetId}"]`) as HTMLElement | null;
		if (!el) return;
		const style = window.getComputedStyle(el);
		initialLeft = parseFloat(style.left) || 0;
		initialTop = parseFloat(style.top) || 0;
		initialWidth = parseFloat(style.width) || 0;
		initialHeight = parseFloat(style.height) || 0;

		document.body.style.cursor = handles.find(h => h.direction === direction)?.cursor ?? 'nwse-resize';
		document.body.style.userSelect = 'none';

		window.addEventListener('pointermove', handleResizeMove);
		window.addEventListener('pointerup', handleResizeUp);
	}

	function handleResizeMove(e: PointerEvent) {
		const scale = getScale();
		const dx = (e.clientX - resizeStartX) / scale;
		const dy = (e.clientY - resizeStartY) / scale;

		const dims = computeResize(dx, dy);

		// Update box visually
		const canvas = document.querySelector('.editor-canvas');
		const el = canvas?.querySelector(`[data-edit-id="${targetId}"]`) as HTMLElement | null;
		if (el) {
			el.style.left = `${dims.left}px`;
			el.style.top = `${dims.top}px`;
			el.style.width = `${dims.width}px`;
			el.style.height = `${dims.height}px`;
			updateRect(el);
		}

		onResize?.(dims);
	}

	function handleResizeUp(e: PointerEvent) {
		const scale = getScale();
		const dx = (e.clientX - resizeStartX) / scale;
		const dy = (e.clientY - resizeStartY) / scale;

		const dims = computeResize(dx, dy);

		resizing = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';

		window.removeEventListener('pointermove', handleResizeMove);
		window.removeEventListener('pointerup', handleResizeUp);

		onResizeEnd?.(dims);
	}
</script>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="selection-box"
		class:draggable
		role="button"
		tabindex="-1"
		style:top="{top}px"
		style:left="{left}px"
		style:width="{boxWidth}px"
		style:height="{boxHeight}px"
		style:--selection-color={labelColor}
		onpointerdown={handlePointerDown}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
	>
		<span class="selection-label" style:background={labelColor}>{labelText}</span>
		{#if showHandles}
			{#each handles as handle}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="handle"
					style:left="{handle.x}px"
					style:top="{handle.y}px"
					style:width="{HANDLE_SIZE}px"
					style:height="{HANDLE_SIZE}px"
					style:cursor={handle.cursor}
					onpointerdown={(e) => handleHandlePointerDown(e, handle.direction)}
				></div>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.selection-box {
		position: absolute;
		border: 2px solid var(--selection-color);
		pointer-events: none;
		z-index: 1000;
	}

	.selection-box.draggable {
		pointer-events: auto;
		cursor: grab;
		background: transparent;
	}

	.selection-label {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 9999;
		font-family: monospace;
		font-size: 8px;
		line-height: 1;
		padding: 1px 3px;
		color: #fff;
		pointer-events: none;
		white-space: nowrap;
		border-radius: 0 0 3px 0;
	}

	.handle {
		position: absolute;
		background: white;
		border: 2px solid var(--selection-color);
		pointer-events: auto;
	}
</style>
