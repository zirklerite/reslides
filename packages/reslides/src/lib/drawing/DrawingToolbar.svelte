<script lang="ts">
	import type { DrawingState } from './drawingState.svelte.js';

	interface Props {
		drawingState: DrawingState;
		slideIndex: number;
	}

	let { drawingState, slideIndex }: Props = $props();

	const COLORS = ['#ff0000', '#3b82f6', '#22c55e', '#eab308', '#ffffff', '#000000'];
	const THICKNESSES = [
		{ label: 'S', value: 2 },
		{ label: 'M', value: 4 },
		{ label: 'L', value: 8 },
	];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div
	class="drawing-toolbar"
	onpointerdown={(e) => e.stopPropagation()}
	onclick={(e) => e.stopPropagation()}
>
	<button
		class="tool-btn"
		class:active={drawingState.tool === 'pen'}
		onclick={() => drawingState.setTool('pen')}
		title="Pen (P)"
	>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
		</svg>
	</button>

	<button
		class="tool-btn"
		class:active={drawingState.tool === 'eraser'}
		onclick={() => drawingState.setTool('eraser')}
		title="Eraser (E)"
	>
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
			<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
			<path d="M22 21H7"/>
		</svg>
	</button>

	<span class="separator"></span>

	{#each COLORS as c}
		<button
			class="color-btn"
			class:active={drawingState.color === c}
			style:background={c}
			style:border-color={c === '#ffffff' ? '#999' : c}
			onclick={() => drawingState.setColor(c)}
			title={c}
		></button>
	{/each}

	<span class="separator"></span>

	{#each THICKNESSES as t}
		<button
			class="thickness-btn"
			class:active={drawingState.strokeWidth === t.value}
			onclick={() => drawingState.setStrokeWidth(t.value)}
			title="Thickness {t.value}"
		>{t.label}</button>
	{/each}

	<span class="separator"></span>

	<button class="tool-btn" onclick={() => drawingState.clearSlide(slideIndex)} title="Clear (C)">
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M3 6h18"/>
			<path d="M8 6V4h8v2"/>
			<path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/>
		</svg>
	</button>

	<button class="tool-btn" onclick={() => drawingState.toggleDrawing()} title="Close (Esc)">
		<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M18 6 6 18"/>
			<path d="m6 6 12 12"/>
		</svg>
	</button>
</div>

<style>
	.drawing-toolbar {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 10px;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 8px;
		pointer-events: auto;
		user-select: none;
	}

	.tool-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid transparent;
		border-radius: 4px;
		background: transparent;
		color: #ccc;
		cursor: pointer;
		padding: 0;
	}

	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.tool-btn.active {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.4);
		color: #fff;
	}

	.color-btn {
		width: 20px;
		height: 20px;
		border: 2px solid transparent;
		border-radius: 50%;
		cursor: pointer;
		padding: 0;
	}

	.color-btn:hover {
		transform: scale(1.2);
	}

	.color-btn.active {
		border-color: #fff;
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
	}

	.thickness-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 1px solid transparent;
		border-radius: 4px;
		background: transparent;
		color: #ccc;
		cursor: pointer;
		font-size: 11px;
		font-weight: 600;
		padding: 0;
	}

	.thickness-btn:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.thickness-btn.active {
		background: rgba(255, 255, 255, 0.25);
		border-color: rgba(255, 255, 255, 0.4);
		color: #fff;
	}

	.separator {
		width: 1px;
		height: 20px;
		background: rgba(255, 255, 255, 0.2);
		margin: 0 2px;
	}
</style>
