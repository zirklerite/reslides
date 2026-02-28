<script lang="ts">
	import { createEditorState } from './editorState.svelte.js';
	import { getEditorContext } from './editorContext.js';
	import { sendEdit, setSuppressTransition } from './editorSocket.js';

	interface Props {
		editVersion?: number;
		currentSlide?: number;
	}

	let { editVersion = 0, currentSlide = 0 }: Props = $props();

	const editorState = getEditorContext();

	const TYPE_COLORS: Record<string, string> = {
		slide: '#ef4444',
		step: '#10b981',
		text: '#f59e0b',
		image: '#f59e0b',
		code: '#f59e0b',
		list: '#f59e0b',
		group: '#a855f7',
		background: '#6366f1',
	};

	interface LayerItem {
		id: string;
		type: string;
		zIndex: number;
		domOrder: number;
		children: LayerItem[];
	}

	let layers = $state<LayerItem[]>([]);

	function queryLayers() {
		const slideEls = document.querySelectorAll('.editor-canvas .slide');
		const slideEl = slideEls.length > 0 ? slideEls[slideEls.length - 1] : null;
		if (!slideEl) {
			layers = [];
			return;
		}

		const allElements = slideEl.querySelectorAll('[data-edit-id]');
		const items: Map<string, LayerItem> = new Map();
		let domOrder = 0;

		for (const el of allElements) {
			const htmlEl = el as HTMLElement;
			const id = htmlEl.dataset.editId;
			const type = htmlEl.dataset.editType ?? 'text';
			if (!id || type === 'slide' || htmlEl.classList.contains('reslides-notes')) continue;

			const computed = window.getComputedStyle(htmlEl);
			const zIndex = parseInt(computed.zIndex) || 0;

			items.set(id, {
				id,
				type,
				zIndex,
				domOrder: domOrder++,
				children: [],
			});
		}

		// Build hierarchy: detect elements inside groups
		const topLevel: LayerItem[] = [];
		for (const el of allElements) {
			const htmlEl = el as HTMLElement;
			const id = htmlEl.dataset.editId;
			const type = htmlEl.dataset.editType ?? 'text';
			if (!id || type === 'slide' || htmlEl.classList.contains('reslides-notes')) continue;

			const item = items.get(id);
			if (!item) continue;

			// Check if this element's closest [data-edit-id] ancestor is a group
			const parentEditable = htmlEl.parentElement?.closest('[data-edit-id]') as HTMLElement | null;
			if (parentEditable && parentEditable.dataset.editType === 'group') {
				const parentId = parentEditable.dataset.editId;
				if (parentId) {
					const parentItem = items.get(parentId);
					if (parentItem) {
						parentItem.children.push(item);
						continue;
					}
				}
			}

			topLevel.push(item);
		}

		// Sort by z-index desc (highest = top of list), DOM order as tiebreaker
		// Background elements always go to the bottom
		topLevel.sort((a, b) => {
			const aIsBg = a.type === 'background' ? 1 : 0;
			const bIsBg = b.type === 'background' ? 1 : 0;
			if (aIsBg !== bIsBg) return aIsBg - bIsBg;
			return b.zIndex - a.zIndex || b.domOrder - a.domOrder;
		});
		for (const item of items.values()) {
			if (item.children.length > 0) {
				item.children.sort((a, b) => b.zIndex - a.zIndex || b.domOrder - a.domOrder);
			}
		}

		layers = topLevel;
	}

	// Re-query on slide change or edit version bump
	$effect(() => {
		void editVersion;
		void currentSlide;
		// Query immediately
		queryLayers();
		// Retry after a short delay to catch late DOM mounts (transitions)
		const timer = setTimeout(queryLayers, 100);
		return () => clearTimeout(timer);
	});

	// Also watch for DOM mutations in the canvas to catch async slide renders
	$effect(() => {
		const canvas = document.querySelector('.editor-canvas');
		if (!canvas) return;
		const observer = new MutationObserver(() => queryLayers());
		observer.observe(canvas, { childList: true, subtree: true });
		return () => observer.disconnect();
	});

	function handleClick(id: string) {
		editorState.selectElement(id);
	}

	// --- Drag to reorder ---
	let draggedId: string | null = $state(null);
	let dropIndex: number | null = $state(null);

	function handleDragStart(e: DragEvent, id: string, type: string) {
		if (type === 'background') {
			e.preventDefault();
			return;
		}
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dropIndex = index;
	}

	function handleDragLeave() {
		dropIndex = null;
	}

	function handleDrop(e: DragEvent, targetIndex: number) {
		e.preventDefault();
		dropIndex = null;

		if (!draggedId) return;

		// Compute new order
		const currentIds = layers.map(l => l.id);
		const fromIndex = currentIds.indexOf(draggedId);
		if (fromIndex < 0) return;

		const newOrder = [...currentIds];
		newOrder.splice(fromIndex, 1);
		newOrder.splice(targetIndex, 0, draggedId);

		// Assign z-index values: top of list (index 0) gets highest z-index
		setSuppressTransition();
		const total = newOrder.length;
		for (let i = 0; i < total; i++) {
			const id = newOrder[i];
			const el = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
			if (!el) continue;
			const file = el.dataset.editFile;
			const zValue = total - i;
			el.style.zIndex = String(zValue);
			if (file) {
				sendEdit('replaceStyle', {
					file,
					elementId: id,
					styles: { 'z-index': String(zValue) },
				});
			}
		}

		draggedId = null;
	}

	function handleDragEnd() {
		draggedId = null;
		dropIndex = null;
	}
</script>

<div class="layer-panel" onclick={(e) => { if (e.currentTarget === e.target) editorState.clearSelection(); }}>
	{#each layers as item, index}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="layer-item"
			class:selected={editorState.isSelected(item.id)}
			class:drag-over={dropIndex === index}
			role="button"
			tabindex="0"
			onclick={() => handleClick(item.id)}
			onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(item.id); }}
			draggable={item.type !== 'background' ? 'true' : 'false'}
			ondragstart={(e) => handleDragStart(e, item.id, item.type)}
			ondragover={(e) => handleDragOver(e, index)}
			ondragleave={handleDragLeave}
			ondrop={(e) => handleDrop(e, index)}
			ondragend={handleDragEnd}
		>
			<span class="type-badge" style:background={TYPE_COLORS[item.type] ?? TYPE_COLORS.text}></span>
			<span class="layer-id">{item.id}</span>
		</div>
		{#each item.children as child}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="layer-item child"
				class:selected={editorState.isSelected(child.id)}
				role="button"
				tabindex="0"
				onclick={() => handleClick(child.id)}
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(child.id); }}
			>
				<span class="type-badge" style:background={TYPE_COLORS[child.type] ?? TYPE_COLORS.text}></span>
				<span class="layer-id">{child.id}</span>
			</div>
		{/each}
	{/each}
	{#if layers.length === 0}
		<div class="empty-message">No elements on this slide</div>
	{/if}
</div>

<style>
	.layer-panel {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-height: 100%;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		cursor: pointer;
		border-radius: 4px;
		font-size: 0.8rem;
		color: #ccc;
		border: 1px solid transparent;
	}

	.layer-item:hover {
		background: #333;
	}

	.layer-item.selected {
		background: #2a3a5a;
		border-color: #4a6a9a;
	}

	.layer-item.drag-over {
		border-top: 2px solid #3b82f6;
	}

	.layer-item.child {
		padding-left: 24px;
	}

	.type-badge {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.layer-id {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty-message {
		color: #666;
		font-size: 0.75rem;
		padding: 8px;
		text-align: center;
	}
</style>
