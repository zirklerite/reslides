/**
 * Send an edit command to the Vite plugin dev server via HMR WebSocket.
 */
export function sendEdit(command: string, payload: Record<string, unknown>): void {
	if (!import.meta.hot) return;
	import.meta.hot.send('reslides:edit', { command, ...payload });
}

/**
 * Listen for edit result responses from the server.
 */
export function onEditResult(callback: (data: { ok?: boolean; error?: string }) => void): void {
	if (!import.meta.hot) return;
	import.meta.hot.on('reslides:edit-result', callback);
}

/**
 * Module-level flag to suppress slide transitions after an edit (HMR remount).
 * Lives here (not in component state) so it survives component tree recreation.
 */
let _suppressTransition = false;

/**
 * Module-level persisted selection — survives HMR component recreation.
 */
let _persistedSelection: string[] = [];
let _persistedSlideSelections: Map<number, string[]> = new Map();
let _persistedCurrentSlide: number = 0;

export function setSuppressTransition(): void {
	_suppressTransition = true;
}

export function consumeSuppressTransition(): boolean {
	if (_suppressTransition) {
		_suppressTransition = false;
		return true;
	}
	return false;
}

export function setPersistedSelection(ids: string[]): void {
	_persistedSelection = ids;
}

export function getPersistedSelection(): string[] {
	return _persistedSelection;
}

export function setPersistedSlideSelections(map: Map<number, string[]>): void {
	_persistedSlideSelections = map;
}

export function getPersistedSlideSelections(): Map<number, string[]> {
	return _persistedSlideSelections;
}

export function setPersistedCurrentSlide(slide: number): void {
	_persistedCurrentSlide = slide;
}

export function getPersistedCurrentSlide(): number {
	return _persistedCurrentSlide;
}

/**
 * Module-level persisted right panel tab — survives HMR component recreation.
 */
let _persistedRightPanelTab: 'properties' | 'layers' = 'properties';

export function setPersistedRightPanelTab(tab: 'properties' | 'layers'): void {
	_persistedRightPanelTab = tab;
}

export function getPersistedRightPanelTab(): 'properties' | 'layers' {
	return _persistedRightPanelTab;
}
