import type { EditorState } from './types.js';
import { getPersistedSelection } from './editorSocket.js';

export function createEditorState(): EditorState {
	let selectedSlide = $state(0);
	let selectedElements: string[] = $state(getPersistedSelection());
	let editingElement: string | null = $state(null);
	let hoveredElement: string | null = $state(null);
	let editVersion = $state(0);

	return {
		get selectedSlide() { return selectedSlide; },
		get selectedElements() { return selectedElements; },
		get selectedElement() { return selectedElements[0] ?? null; },
		get editingElement() { return editingElement; },
		get hoveredElement() { return hoveredElement; },
		get editVersion() { return editVersion; },
		get isEditor() { return true; },
		get hasSelection() { return selectedElements.length > 0; },
		get isSingleSelection() { return selectedElements.length === 1; },
		selectSlide(index: number) {
			selectedSlide = index;
			selectedElements = [];
			editingElement = null;
		},
		selectElement(id: string | null) {
			selectedElements = id ? [id] : [];
		},
		toggleElement(id: string) {
			const idx = selectedElements.indexOf(id);
			if (idx >= 0) {
				selectedElements = selectedElements.filter((_, i) => i !== idx);
			} else {
				selectedElements = [...selectedElements, id];
			}
		},
		selectAll(ids: string[]) {
			selectedElements = [...ids];
		},
		clearSelection() {
			selectedElements = [];
		},
		isSelected(id: string) {
			return selectedElements.includes(id);
		},
		setHovered(id: string | null) {
			hoveredElement = id;
		},
		startEditing(id: string) {
			editingElement = id;
			selectedElements = [id];
		},
		stopEditing() {
			editingElement = null;
		},
		bumpVersion() {
			editVersion++;
		},
	};
}
