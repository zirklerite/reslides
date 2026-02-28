import { getContext, setContext } from 'svelte';
import type { EditorState } from './types.js';

const EDITOR_CONTEXT_KEY = Symbol('reslides-editor');

export function setEditorContext(state: EditorState): void {
	setContext(EDITOR_CONTEXT_KEY, state);
}

export function getEditorContext(): EditorState {
	return getContext<EditorState>(EDITOR_CONTEXT_KEY);
}

export function tryGetEditorContext(): EditorState | null {
	return getContext<EditorState | undefined>(EDITOR_CONTEXT_KEY) ?? null;
}
