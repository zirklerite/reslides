import type { Stroke, DrawingTool } from './types.js';

export interface DrawingState {
	readonly isDrawing: boolean;
	readonly tool: DrawingTool;
	readonly color: string;
	readonly strokeWidth: number;
	toggleDrawing(): void;
	setTool(tool: DrawingTool): void;
	setColor(color: string): void;
	setStrokeWidth(w: number): void;
	getStrokes(slideIndex: number): Stroke[];
	addStroke(slideIndex: number, stroke: Stroke): void;
	removeStroke(slideIndex: number, strokeId: string): void;
	clearSlide(slideIndex: number): void;
	setStrokes(slideIndex: number, strokes: Stroke[]): void;
	/** Register a listener called whenever strokes change. Returns unsubscribe fn. */
	onChange(callback: () => void): () => void;
	/** Set a callback that fires when strokes change and need syncing. */
	onSync(callback: ((slideIndex: number) => void) | null): void;
	/** Set a callback that fires when a slide is cleared and needs syncing. */
	onClearSync(callback: ((slideIndex: number) => void) | null): void;
}

export function createDrawingState(): DrawingState {
	let isDrawing = $state(false);
	let tool: DrawingTool = $state('pen');
	let color = $state('#ff0000');
	let strokeWidth = $state(3);

	// Plain Map — no $state proxy. Reactivity is driven by onChange listeners.
	const strokesBySlide = new Map<number, Stroke[]>();
	const changeListeners = new Set<() => void>();
	let syncCallback: ((slideIndex: number) => void) | null = null;
	let clearSyncCallback: ((slideIndex: number) => void) | null = null;

	function notifyChange() {
		changeListeners.forEach(fn => fn());
	}

	return {
		get isDrawing() { return isDrawing; },
		get tool() { return tool; },
		get color() { return color; },
		get strokeWidth() { return strokeWidth; },

		toggleDrawing() {
			isDrawing = !isDrawing;
			if (isDrawing) {
				tool = 'pen';
			}
		},

		setTool(t: DrawingTool) { tool = t; },
		setColor(c: string) { color = c; },
		setStrokeWidth(w: number) { strokeWidth = w; },

		getStrokes(slideIndex: number): Stroke[] {
			return strokesBySlide.get(slideIndex) ?? [];
		},

		addStroke(slideIndex: number, stroke: Stroke) {
			const existing = strokesBySlide.get(slideIndex) ?? [];
			const cloned: Stroke = {
				id: stroke.id,
				points: stroke.points.map(p => ({ x: p.x, y: p.y })),
				color: stroke.color,
				width: stroke.width,
			};
			strokesBySlide.set(slideIndex, [...existing, cloned]);
			notifyChange();
			syncCallback?.(slideIndex);
		},

		removeStroke(slideIndex: number, strokeId: string) {
			const existing = strokesBySlide.get(slideIndex);
			if (!existing) return;
			strokesBySlide.set(slideIndex, existing.filter(s => s.id !== strokeId));
			notifyChange();
			syncCallback?.(slideIndex);
		},

		clearSlide(slideIndex: number) {
			strokesBySlide.set(slideIndex, []);
			notifyChange();
			clearSyncCallback?.(slideIndex);
		},

		setStrokes(slideIndex: number, strokes: Stroke[]) {
			strokesBySlide.set(slideIndex, [...strokes]);
			notifyChange();
		},

		onChange(callback: () => void): () => void {
			changeListeners.add(callback);
			return () => changeListeners.delete(callback);
		},

		onSync(callback: ((slideIndex: number) => void) | null) {
			syncCallback = callback;
		},

		onClearSync(callback: ((slideIndex: number) => void) | null) {
			clearSyncCallback = callback;
		},
	};
}
