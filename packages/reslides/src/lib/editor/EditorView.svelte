<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import SlideContainer from '../SlideContainer.svelte';
	import SelectionBox from './SelectionBox.svelte';
	import HoverBox from './HoverBox.svelte';
	import AlignmentGuides from './AlignmentGuides.svelte';
	import PropertyPanel from './PropertyPanel.svelte';
	import LayerPanel from './LayerPanel.svelte';
	import LayoutPanel from './LayoutPanel.svelte';
	import EditorNotesPanel from './EditorNotesPanel.svelte';
	import EditorSidebar from './EditorSidebar.svelte';
	import { getDeckContext } from '../context.js';
	import { createEditorState } from './editorState.svelte.js';
	import { setEditorContext } from './editorContext.js';
	import { sendEdit, onEditResult, setSuppressTransition, setPersistedSelection, setPersistedSlideSelections, getPersistedSlideSelections, setPersistedCurrentSlide, getPersistedCurrentSlide, setPersistedRightPanelTab, getPersistedRightPanelTab } from './editorSocket.js';

	interface Props {
		width: number;
		height: number;
		theme: string;
		colorScheme: string;
		children: Snippet;
	}

	let { width, height, theme, colorScheme, children }: Props = $props();

	const deckCtx = getDeckContext();
	const editorState = createEditorState();
	setEditorContext(editorState);

	// Persist selection to module-level state so it survives HMR
	$effect(() => {
		setPersistedSelection([...editorState.selectedElements]);
	});

	// --- Per-slide selection memory (restored from module-level persistence) ---
	let slideSelections = getPersistedSlideSelections();
	let prevSlide = getPersistedCurrentSlide();

	$effect.pre(() => {
		const current = deckCtx.currentSlide;
		untrack(() => {
			if (current === prevSlide) return;
			// Suppress slide transition so SelectionBox gets correct positions
			setSuppressTransition();
			// Save current selection for the slide we're leaving
			slideSelections.set(prevSlide, [...editorState.selectedElements]);
			// Commit any active text edit
			if (editorState.editingElement) {
				commitEdit();
			}
			// Restore saved selection for the new slide, or clear
			const saved = slideSelections.get(current);
			if (saved && saved.length > 0) {
				editorState.selectAll(saved);
			} else {
				editorState.clearSelection();
			}
			editorState.setHovered(null);
			prevSlide = current;
			setPersistedCurrentSlide(current);
			setPersistedSlideSelections(slideSelections);
		});
	});

	// Bump version after HMR settles so PropertyPanel/SelectionBox re-read DOM
	onEditResult((data) => {
		if (data.ok) {
			setSuppressTransition();
			setTimeout(() => editorState.bumpVersion(), 150);
		}
	});

	// --- Right panel tab (restored from module-level state to survive HMR) ---
	let rightPanelTab: 'properties' | 'layers' | 'layouts' = $state(getPersistedRightPanelTab());
	$effect(() => {
		setPersistedRightPanelTab(rightPanelTab);
	});

	// Track the element currently being edited and its original text
	let editingEl: HTMLElement | null = null;
	let originalText: string = '';

	function handleCanvasClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const editableEl = target.closest('[data-edit-id]') as HTMLElement | null;
		if (editableEl) {
			// If clicking a different element while editing, commit current edit first
			if (editorState.editingElement && editableEl.dataset.editId !== editorState.editingElement) {
				commitEdit();
			}
			const clickedId = editableEl.dataset.editId!;

			// Check if the element is inside a Group
			const groupEl = editableEl.closest('[data-group-id]') as HTMLElement | null;
			const groupEditEl = groupEl?.closest('[data-edit-id]') as HTMLElement | null;
			const isInGroup = groupEditEl && groupEditEl !== editableEl;

			if (e.shiftKey) {
				// Shift+click: toggle element in multi-selection
				editorState.toggleElement(isInGroup ? groupEditEl.dataset.editId! : clickedId);
			} else if (e.ctrlKey || e.metaKey) {
				// Ctrl+click: select the inner element directly (bypass group)
				editorState.selectElement(clickedId);
			} else if (isInGroup) {
				// Plain click inside group: select the group
				editorState.selectElement(groupEditEl.dataset.editId!);
			} else {
				// Plain click: select the element
				editorState.selectElement(clickedId);
			}
		} else {
			// Clicking background — commit any active edit, then deselect
			if (editorState.editingElement) {
				commitEdit();
			}
			editorState.clearSelection();
		}
	}

	function enterTextEdit(el: HTMLElement) {
		if (!editorState.isSingleSelection) return;

		const caps = el.dataset.editCaps ?? '';
		if (!caps.split(',').includes('text')) return;

		editingEl = el;
		originalText = el.innerText;
		editorState.startEditing(el.dataset.editId!);

		el.contentEditable = 'true';
		el.focus();

		const selection = window.getSelection();
		if (selection) {
			selection.selectAllChildren(el);
		}

		el.addEventListener('keydown', handleEditKeydown);
		el.addEventListener('blur', handleEditBlur);
	}

	function handleCanvasDblClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		let editableEl = target.closest('[data-edit-id]') as HTMLElement | null;
		// If double-click landed on the SelectionBox overlay, use the selected element
		if (!editableEl && editorState.isSingleSelection) {
			const id = editorState.selectedElements[0];
			const canvas = document.querySelector('.editor-canvas');
			editableEl = canvas?.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
		}
		if (editableEl) {
			enterTextEdit(editableEl);
		}
	}


	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			commitEdit();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelEdit();
		}
	}

	function handleEditBlur() {
		// Only commit if still in editing mode (cancel already cleans up)
		if (editorState.editingElement) {
			commitEdit();
		}
	}

	function commitEdit() {
		if (!editingEl) return;
		const newText = editingEl.innerText;
		const file = editingEl.dataset.editFile;
		const elementId = editingEl.dataset.editId;

		cleanupEditing();

		if (newText !== originalText && file && elementId) {
			sendEdit('replaceContent', { file, elementId, content: newText });
		}
	}

	function cancelEdit() {
		if (!editingEl) return;
		editingEl.innerText = originalText;
		cleanupEditing();
	}

	function cleanupEditing() {
		if (!editingEl) return;
		editingEl.removeEventListener('keydown', handleEditKeydown);
		editingEl.removeEventListener('blur', handleEditBlur);
		editingEl.contentEditable = 'false';
		editingEl.blur();
		editingEl = null;
		originalText = '';
		editorState.stopEditing();
	}

	// --- Drag-to-move (batch) ---

	function getElById(id: string): HTMLElement | null {
		return document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
	}

	let canDragAll = $state(false);

	$effect(() => {
		// Re-check when selection or editVersion changes
		void editorState.editVersion;
		if (!editorState.hasSelection) {
			canDragAll = false;
			return;
		}
		// All selected must have position capability and not be a slide
		canDragAll = editorState.selectedElements.every((id) => {
			const el = getElById(id);
			if (!el) return false;
			if (el.dataset.editType === 'slide') return false;
			const caps = el.dataset.editCaps ?? '';
			return caps.split(',').includes('position');
		});
	});

	// Initial positions for all selected elements during drag
	let dragInitialPositions: Map<string, { left: number; top: number }> = new Map();

	// Store the primary element's rect for snap calculations
	let dragPrimaryRect: { left: number; top: number; width: number; height: number } | null = null;

	function handleDragStart() {
		dragInitialPositions.clear();
		collectSnapPoints();
		for (const id of editorState.selectedElements) {
			const el = getElById(id);
			if (!el) continue;
			const style = window.getComputedStyle(el);
			const left = parseFloat(style.left) || 0;
			const top = parseFloat(style.top) || 0;
			const width = parseFloat(style.width) || 0;
			const height = parseFloat(style.height) || 0;
			dragInitialPositions.set(id, { left, top });
			// Use first element as snap reference
			if (!dragPrimaryRect) {
				dragPrimaryRect = { left, top, width, height };
			}
		}
	}

	function handleDrag(delta: { dx: number; dy: number }) {
		if (dragInitialPositions.size === 0) {
			handleDragStart();
		}
		// Apply snap
		let snappedDelta = delta;
		if (dragPrimaryRect) {
			const result = findSnap(dragPrimaryRect, delta);
			snappedDelta = { dx: result.dx, dy: result.dy };
			activeGuides = result.guides;
		}
		for (const [id, pos] of dragInitialPositions) {
			const el = getElById(id);
			if (!el) continue;
			el.style.left = `${pos.left + snappedDelta.dx}px`;
			el.style.top = `${pos.top + snappedDelta.dy}px`;
		}
	}

	function handleDragEnd(delta: { dx: number; dy: number }) {
		// Apply snap to final delta
		let snappedDelta = delta;
		if (dragPrimaryRect) {
			const result = findSnap(dragPrimaryRect, delta);
			snappedDelta = { dx: result.dx, dy: result.dy };
		}
		for (const [id, pos] of dragInitialPositions) {
			const el = getElById(id);
			if (!el) continue;
			const file = el.dataset.editFile;
			const finalLeft = Math.round(pos.left + snappedDelta.dx);
			const finalTop = Math.round(pos.top + snappedDelta.dy);
			if (file) {
				sendEdit('replaceStyle', {
					file,
					elementId: id,
					styles: {
						position: 'absolute',
						left: `${finalLeft}px`,
						top: `${finalTop}px`,
					},
				});
			}
		}
		dragInitialPositions.clear();
		dragPrimaryRect = null;
		clearGuides();
	}

	// --- Alignment guides ---

	interface SnapPoint {
		value: number;
		type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
	}

	let snapPoints: SnapPoint[] = [];
	let activeGuides = $state<{ x: number[]; y: number[] }>({ x: [], y: [] });

	function getScale(): number {
		const slideContent = document.querySelector('.editor-canvas .slide-content') as HTMLElement | null;
		if (!slideContent) return 1;
		return slideContent.getBoundingClientRect().width / 960;
	}

	function collectSnapPoints() {
		snapPoints = [];
		// Slide boundaries
		snapPoints.push(
			{ value: 0, type: 'left' },
			{ value: 960, type: 'right' },
			{ value: 480, type: 'centerX' },
			{ value: 0, type: 'top' },
			{ value: 540, type: 'bottom' },
			{ value: 270, type: 'centerY' },
		);
		// Non-selected element edges
		const canvas = document.querySelector('.editor-canvas');
		if (!canvas) return;
		const scale = getScale();
		const slideContent = canvas.querySelector('.slide-content') as HTMLElement | null;
		if (!slideContent) return;
		const slideRect = slideContent.getBoundingClientRect();

		for (const el of canvas.querySelectorAll('[data-edit-id]')) {
			const htmlEl = el as HTMLElement;
			const id = htmlEl.dataset.editId;
			if (!id || editorState.isSelected(id)) continue;
			if (htmlEl.dataset.editType === 'slide') continue;

			const rect = htmlEl.getBoundingClientRect();
			const elLeft = (rect.left - slideRect.left) / scale;
			const elTop = (rect.top - slideRect.top) / scale;
			const elRight = elLeft + rect.width / scale;
			const elBottom = elTop + rect.height / scale;

			snapPoints.push(
				{ value: elLeft, type: 'left' },
				{ value: elRight, type: 'right' },
				{ value: (elLeft + elRight) / 2, type: 'centerX' },
				{ value: elTop, type: 'top' },
				{ value: elBottom, type: 'bottom' },
				{ value: (elTop + elBottom) / 2, type: 'centerY' },
			);
		}
	}

	const SNAP_THRESHOLD = 5;

	function findSnap(
		elementRect: { left: number; top: number; width: number; height: number },
		delta: { dx: number; dy: number }
	): { dx: number; dy: number; guides: { x: number[]; y: number[] } } {
		const el = {
			left: elementRect.left + delta.dx,
			top: elementRect.top + delta.dy,
			right: elementRect.left + elementRect.width + delta.dx,
			bottom: elementRect.top + elementRect.height + delta.dy,
			centerX: elementRect.left + elementRect.width / 2 + delta.dx,
			centerY: elementRect.top + elementRect.height / 2 + delta.dy,
		};

		let bestDx = delta.dx;
		let bestDy = delta.dy;
		let bestDistX = SNAP_THRESHOLD + 1;
		let bestDistY = SNAP_THRESHOLD + 1;
		const guides: { x: number[]; y: number[] } = { x: [], y: [] };

		// Check x-axis snaps (left, right, centerX)
		for (const sp of snapPoints) {
			if (sp.type === 'left' || sp.type === 'right' || sp.type === 'centerX') {
				for (const edge of [el.left, el.right, el.centerX]) {
					const dist = Math.abs(edge - sp.value);
					if (dist < bestDistX) {
						bestDistX = dist;
						const adjustment = sp.value - edge;
						bestDx = delta.dx + adjustment;
						guides.x = [sp.value];
					}
				}
			}
		}

		// Check y-axis snaps (top, bottom, centerY)
		for (const sp of snapPoints) {
			if (sp.type === 'top' || sp.type === 'bottom' || sp.type === 'centerY') {
				for (const edge of [el.top, el.bottom, el.centerY]) {
					const dist = Math.abs(edge - sp.value);
					if (dist < bestDistY) {
						bestDistY = dist;
						const adjustment = sp.value - edge;
						bestDy = delta.dy + adjustment;
						guides.y = [sp.value];
					}
				}
			}
		}

		if (bestDistX > SNAP_THRESHOLD) {
			bestDx = delta.dx;
			guides.x = [];
		}
		if (bestDistY > SNAP_THRESHOLD) {
			bestDy = delta.dy;
			guides.y = [];
		}

		return { dx: bestDx, dy: bestDy, guides };
	}

	function clearGuides() {
		activeGuides = { x: [], y: [] };
	}

	// --- Resize (single element only) ---

	let canResize = $derived(
		editorState.isSingleSelection &&
		!editorState.editingElement &&
		(() => {
			const el = getElById(editorState.selectedElements[0]);
			if (!el) return false;
			if (el.dataset.editType === 'slide') return false;
			const caps = el.dataset.editCaps ?? '';
			return caps.split(',').includes('position');
		})()
	);

	function handleResizeEnd(dims: { left: number; top: number; width: number; height: number }) {
		const id = editorState.selectedElements[0];
		const el = getElById(id);
		if (!el) return;
		const file = el.dataset.editFile;
		if (file) {
			sendEdit('replaceStyle', {
				file,
				elementId: id,
				styles: {
					position: 'absolute',
					left: `${Math.round(dims.left)}px`,
					top: `${Math.round(dims.top)}px`,
					width: `${Math.round(dims.width)}px`,
					height: `${Math.round(dims.height)}px`,
				},
			});
		}
		clearGuides();
	}

	// --- Keyboard shortcuts ---

	function handleEditorKeydown(e: KeyboardEvent) {
		const key = e.key.toLowerCase();

		// Don't handle shortcuts during text editing (except Escape which is handled by edit handler)
		if (editorState.editingElement) return;

		// Undo: Ctrl+Z
		if (key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
			e.preventDefault();
			setSuppressTransition();
			sendEdit('undo', {});
			return;
		}

		// Redo: Ctrl+Shift+Z or Ctrl+Y
		if (
			(key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
			(key === 'y' && (e.ctrlKey || e.metaKey))
		) {
			e.preventDefault();
			setSuppressTransition();
			sendEdit('redo', {});
			return;
		}

		// Select All: Ctrl+A
		if (key === 'a' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			const slideEl = document.querySelector('.editor-canvas .slide');
			if (slideEl) {
				const editables = slideEl.querySelectorAll('[data-edit-id]');
				const ids = Array.from(editables).map((el) => (el as HTMLElement).dataset.editId!);
				editorState.selectAll(ids);
			}
			return;
		}

		// Group: Ctrl+G
		if (key === 'g' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
			e.preventDefault();
			if (editorState.selectedElements.length >= 2) {
				// Find the file from the first selected element
				const firstEl = getElById(editorState.selectedElements[0]);
				if (firstEl?.dataset.editFile) {
					sendEdit('groupElements', {
						file: firstEl.dataset.editFile,
						elementIds: editorState.selectedElements,
					});
				}
			}
			return;
		}

		// Ungroup: Ctrl+Shift+G
		if (key === 'g' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
			e.preventDefault();
			if (editorState.isSingleSelection) {
				const el = getElById(editorState.selectedElements[0]);
				if (el?.dataset.editFile) {
					sendEdit('ungroupElements', {
						file: el.dataset.editFile,
						elementId: editorState.selectedElements[0],
					});
				}
			}
			return;
		}

		// Delete selected elements
		if (key === 'delete' || key === 'backspace') {
			if (editorState.hasSelection) {
				e.preventDefault();
				for (const id of editorState.selectedElements) {
					const el = getElById(id);
					if (el?.dataset.editFile) {
						sendEdit('removeElement', {
							file: el.dataset.editFile,
							elementId: id,
						});
					}
				}
				editorState.clearSelection();
			}
			return;
		}
	}

	$effect(() => {
		window.addEventListener('keydown', handleEditorKeydown);
		return () => window.removeEventListener('keydown', handleEditorKeydown);
	});

	// --- Canvas-level hover detection ---

	function handleCanvasMouseMove(e: MouseEvent) {
		if (e.buttons !== 0) return; // suppress during drag
		if (editorState.editingElement) {
			editorState.setHovered(null);
			return;
		}
		const target = e.target as HTMLElement;
		const editableEl = target.closest('[data-edit-id]') as HTMLElement | null;
		const newId = editableEl?.dataset.editId ?? null;
		if (newId !== editorState.hoveredElement) {
			editorState.setHovered(newId);
		}
	}

	function handleCanvasMouseLeave() {
		editorState.setHovered(null);
	}

	// --- Hovered element + ancestor chain ---

	let hoveredChain: string[] = $derived.by(() => {
		const primary = editorState.hoveredElement;
		if (!primary) return [];

		const canvas = document.querySelector('.editor-canvas');
		const el = canvas?.querySelector(`[data-edit-id="${primary}"]`) as HTMLElement | null;
		if (!el) return [primary];

		const ids: string[] = [primary];
		let current = el.parentElement?.closest('[data-edit-id]') as HTMLElement | null;
		while (current && canvas?.contains(current)) {
			const id = current.dataset.editId;
			if (id) ids.push(id);
			current = current.parentElement?.closest('[data-edit-id]') as HTMLElement | null;
		}
		return ids;
	});

	// --- Inspect mode: show overlays for all editable elements ---

	let inspectElements: string[] = $state([]);

	$effect(() => {
		void editorState.editVersion;
		if (!deckCtx.inspect) {
			inspectElements = [];
			return;
		}
		const slideEl = document.querySelector('.editor-canvas .slide');
		if (!slideEl) {
			inspectElements = [];
			return;
		}
		const editables = slideEl.querySelectorAll('[data-edit-id]');
		const ids = Array.from(editables).map((el) => (el as HTMLElement).dataset.editId!);
		// Include slide itself if it has data-edit-id
		const slideEditId = (slideEl as HTMLElement).dataset?.editId;
		if (slideEditId && !ids.includes(slideEditId)) {
			ids.unshift(slideEditId);
		}
		// Exclude selected elements (they show SelectionBox instead)
		inspectElements = ids.filter((id) => !editorState.isSelected(id));
	});

</script>

<div class="editor-view">
	<div class="editor-toolbar">
		<span class="panel-label">Editor</span>
		<span class="slide-counter">Slide {deckCtx.currentSlide + 1} / {deckCtx.totalSlides}</span>
		<button class="nav-btn" onclick={() => deckCtx.prev()}>&#9664;</button>
		<button class="nav-btn" onclick={() => deckCtx.next()}>&#9654;</button>
	</div>
	<div class="editor-sidebar">
		<span class="panel-label">Slides</span>
		<EditorSidebar slides={children} {width} {height} {theme} {colorScheme} />
	</div>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="editor-canvas" onclick={handleCanvasClick} ondblclick={handleCanvasDblClick} onmousemove={handleCanvasMouseMove} onmouseleave={handleCanvasMouseLeave}>
		<SlideContainer {width} {height} {theme} {colorScheme}>
			{@render children()}
		</SlideContainer>
		{#each editorState.selectedElements as elemId}
			<SelectionBox
				targetId={elemId}
				editVersion={editorState.editVersion}
				draggable={!editorState.editingElement && canDragAll}
				resizable={canResize}
				onDrag={handleDrag}
				onDragEnd={handleDragEnd}
				onResizeEnd={handleResizeEnd}
			/>
		{/each}
		{#if !editorState.editingElement}
			{#each hoveredChain as elemId}
				{#if !editorState.isSelected(elemId)}
					<HoverBox
						targetId={elemId}
						editVersion={editorState.editVersion}
						onclick={(id) => editorState.selectElement(id)}
					/>
				{/if}
			{/each}
		{/if}
		{#if activeGuides.x.length > 0 || activeGuides.y.length > 0}
			<AlignmentGuides guides={activeGuides} />
		{/if}
		{#if deckCtx.inspect}
			{#each inspectElements as elemId}
				<HoverBox
					targetId={elemId}
					editVersion={editorState.editVersion}
					onclick={(id) => editorState.selectElement(id)}
				/>
			{/each}
		{/if}
	</div>
	<div class="editor-property-panel">
		<div class="panel-tabs">
			<button class="panel-tab" class:active={rightPanelTab === 'properties'} onclick={() => rightPanelTab = 'properties'}>Properties</button>
			<button class="panel-tab" class:active={rightPanelTab === 'layers'} onclick={() => rightPanelTab = 'layers'}>Layers</button>
			<button class="panel-tab" class:active={rightPanelTab === 'layouts'} onclick={() => rightPanelTab = 'layouts'}>Layouts</button>
		</div>
		{#if rightPanelTab === 'properties'}
			<PropertyPanel selectedIds={editorState.selectedElements} editVersion={editorState.editVersion} />
		{:else if rightPanelTab === 'layers'}
			<LayerPanel editVersion={editorState.editVersion} currentSlide={deckCtx.currentSlide} />
		{:else}
			<LayoutPanel />
		{/if}
	</div>
	<div class="editor-notes-panel">
		<EditorNotesPanel />
	</div>
</div>

<style>
	.editor-view {
		width: 100vw;
		height: 100vh;
		display: grid;
		grid-template-columns: 200px 1fr 260px;
		grid-template-rows: 48px 1fr 120px;
		grid-template-areas:
			"toolbar toolbar toolbar"
			"sidebar canvas properties"
			"sidebar notes properties";
		background: #1a1a1a;
		color: #ccc;
		font-family: system-ui, -apple-system, sans-serif;
		font-size: 0.875rem;
		overflow: hidden;
	}

	.editor-toolbar {
		grid-area: toolbar;
		background: #252525;
		border-bottom: 1px solid #333;
		display: flex;
		align-items: center;
		padding: 0 16px;
		gap: 12px;
	}

	.slide-counter {
		font-size: 0.8rem;
		color: #aaa;
		font-variant-numeric: tabular-nums;
	}

	.nav-btn {
		background: #333;
		border: 1px solid #444;
		color: #ccc;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.nav-btn:hover {
		background: #444;
	}

	.editor-sidebar {
		grid-area: sidebar;
		background: #1e1e1e;
		border-right: 1px solid #333;
		padding: 12px;
		overflow-y: auto;
	}

	.editor-canvas {
		grid-area: canvas;
		background: #2a2a2a;
		position: relative;
		overflow: hidden;
		padding: 24px;
	}

	.editor-canvas :global([contenteditable="true"]) {
		outline: none;
	}

	.editor-canvas {
		user-select: none;
	}

	.editor-canvas :global([contenteditable="true"]) {
		user-select: text;
	}

	.editor-property-panel {
		grid-area: properties;
		background: #1e1e1e;
		border-left: 1px solid #333;
		padding: 12px;
		overflow-y: auto;
	}

	.editor-notes-panel {
		grid-area: notes;
		background: #1e1e1e;
		border-top: 1px solid #333;
		padding: 12px;
		overflow-y: auto;
	}

	.panel-label {
		color: #666;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-tabs {
		display: flex;
		gap: 0;
		margin-bottom: 8px;
		border-bottom: 1px solid #333;
	}

	.panel-tab {
		flex: 1;
		background: none;
		border: none;
		color: #888;
		font-size: 0.75rem;
		padding: 6px 8px;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-tab:hover {
		color: #ccc;
	}

	.panel-tab.active {
		color: #ccc;
		border-bottom-color: #3b82f6;
	}

</style>
