<script lang="ts">
	import type { DrawingState } from './drawingState.svelte.js';
	import type { Point, Stroke } from './types.js';

	interface Props {
		width: number;
		height: number;
		slideIndex: number;
		drawingState: DrawingState;
	}

	let { width, height, slideIndex, drawingState }: Props = $props();

	let svgEl: SVGSVGElement | undefined = $state();
	let currentStroke: Stroke | null = $state(null);
	let isPointerDown = false;

	// Local $state updated by onChange listener — bypasses cross-closure reactivity issues
	let strokes: Stroke[] = $state([]);

	function refreshStrokes() {
		strokes = drawingState.getStrokes(slideIndex);
	}

	$effect(() => {
		refreshStrokes();
		const unsubscribe = drawingState.onChange(refreshStrokes);
		return unsubscribe;
	});

	// Also refresh when slideIndex changes
	// eslint-disable-next-line -- intentionally captures initial value as previous
	let prevSlide = $state(slideIndex); // svelte-ignore state_referenced_locally
	$effect(() => {
		if (slideIndex !== prevSlide) {
			if (currentStroke && currentStroke.points.length > 1) {
				drawingState.addStroke(prevSlide, currentStroke);
			}
			currentStroke = null;
			isPointerDown = false;
			prevSlide = slideIndex;
			refreshStrokes();
		}
	});

	function screenToSlide(e: PointerEvent): Point | null {
		if (!svgEl) return null;
		const pt = svgEl.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const ctm = svgEl.getScreenCTM();
		if (!ctm) return null;
		const transformed = pt.matrixTransform(ctm.inverse());
		return { x: transformed.x, y: transformed.y };
	}

	function handlePointerDown(e: PointerEvent) {
		if (!drawingState.isDrawing) return;
		e.preventDefault();
		isPointerDown = true;
		(e.target as Element)?.setPointerCapture?.(e.pointerId);

		const point = screenToSlide(e);
		if (!point) return;

		if (drawingState.tool === 'pen') {
			currentStroke = {
				id: crypto.randomUUID(),
				points: [point],
				color: drawingState.color,
				width: drawingState.strokeWidth,
			};
		} else if (drawingState.tool === 'eraser') {
			eraseAt(point);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isPointerDown || !drawingState.isDrawing) return;
		e.preventDefault();

		const point = screenToSlide(e);
		if (!point) return;

		if (drawingState.tool === 'pen' && currentStroke) {
			currentStroke.points = [...currentStroke.points, point];
		} else if (drawingState.tool === 'eraser') {
			eraseAt(point);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isPointerDown) return;
		isPointerDown = false;

		if (drawingState.tool === 'pen' && currentStroke && currentStroke.points.length > 1) {
			drawingState.addStroke(slideIndex, currentStroke);
		}
		currentStroke = null;
	}

	function eraseAt(point: Point) {
		const eraserRadius = drawingState.strokeWidth * 3;
		const r2 = eraserRadius * eraserRadius;
		const currentStrokes = drawingState.getStrokes(slideIndex);

		for (const stroke of currentStrokes) {
			for (const sp of stroke.points) {
				const dx = sp.x - point.x;
				const dy = sp.y - point.y;
				if (dx * dx + dy * dy < r2) {
					drawingState.removeStroke(slideIndex, stroke.id);
					break;
				}
			}
		}
	}
</script>

<div
	class="drawing-layer"
	style:pointer-events={drawingState.isDrawing ? 'auto' : 'none'}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		bind:this={svgEl}
		class="drawing-svg"
		viewBox="0 0 {width} {height}"
		style:touch-action={drawingState.isDrawing ? 'none' : 'auto'}
		style:cursor={drawingState.isDrawing ? (drawingState.tool === 'pen' ? 'crosshair' : 'cell') : 'default'}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
	>
		{#each strokes as stroke (stroke.id)}
			<polyline
				points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')}
				fill="none"
				stroke={stroke.color}
				stroke-width={stroke.width}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/each}

		{#if currentStroke}
			<polyline
				points={currentStroke.points.map(p => `${p.x},${p.y}`).join(' ')}
				fill="none"
				stroke={currentStroke.color}
				stroke-width={currentStroke.width}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}
	</svg>
</div>

<style>
	.drawing-layer {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--slide-width);
		height: var(--slide-height);
		transform: translate(-50%, -50%) scale(var(--slide-scale));
		transform-origin: center center;
		z-index: 1;
	}

	.drawing-svg {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
