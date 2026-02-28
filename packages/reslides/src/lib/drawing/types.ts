/** A single point in slide coordinate space (0-960, 0-540). */
export interface Point {
	x: number;
	y: number;
}

/** A single stroke drawn by the user. */
export interface Stroke {
	/** Unique ID for this stroke (for eraser targeting). */
	id: string;
	/** Ordered list of points in slide coordinates. */
	points: Point[];
	/** CSS color string. */
	color: string;
	/** Stroke width in slide coordinate units. */
	width: number;
}

/** The active drawing tool. */
export type DrawingTool = 'pen' | 'eraser';
