export interface EditorState {
	readonly selectedSlide: number;
	readonly selectedElements: string[];
	/** Backward-compat: returns first selected element or null */
	readonly selectedElement: string | null;
	readonly editingElement: string | null;
	readonly hoveredElement: string | null;
	readonly editVersion: number;
	readonly isEditor: boolean;
	readonly hasSelection: boolean;
	readonly isSingleSelection: boolean;
	selectSlide: (index: number) => void;
	selectElement: (id: string | null) => void;
	toggleElement: (id: string) => void;
	selectAll: (ids: string[]) => void;
	clearSelection: () => void;
	isSelected: (id: string) => boolean;
	setHovered: (id: string | null) => void;
	startEditing: (id: string) => void;
	stopEditing: () => void;
	bumpVersion: () => void;
}
