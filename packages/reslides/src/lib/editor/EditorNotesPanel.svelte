<script lang="ts">
	import { getDeckContext } from '../context.js';
	import { sendEdit } from './editorSocket.js';

	const deckCtx = getDeckContext();

	let notesText = $state('');
	let lastSlide = $state(-1);

	// Sync textarea with current slide's notes
	$effect(() => {
		const slide = deckCtx.currentSlide;
		const notes = deckCtx.notes;
		if (slide !== lastSlide) {
			notesText = notes;
			lastSlide = slide;
		}
	});

	function handleBlur() {
		// Find the active slide element
		const slideEl = document.querySelector('.editor-canvas .slide[data-edit-id]') as HTMLElement | null;
		if (!slideEl) return;

		// Try to find existing Notes element
		const notesEl = slideEl.querySelector('.reslides-notes[data-edit-id]') as HTMLElement | null;

		if (notesEl) {
			// Existing Notes — update content
			const file = notesEl.dataset.editFile;
			const elementId = notesEl.dataset.editId;
			if (!file || !elementId) return;
			sendEdit('replaceContent', { file, elementId, content: notesText });
		} else {
			// No Notes component — insert one if user typed something
			if (!notesText.trim()) return;
			const file = slideEl.dataset.editFile;
			const slideId = slideEl.dataset.editId;
			if (!file || !slideId) return;
			const num = slideId.match(/\d+$/)?.[0];
			const notesId = num ? `notes-${num}` : `notes-for-${slideId}`;
			sendEdit('insertNotes', { file, elementId: slideId, notesId, content: notesText });
		}
	}
</script>

<div class="notes-panel">
	<span class="panel-label">Notes</span>
	<textarea
		class="notes-textarea"
		bind:value={notesText}
		onblur={handleBlur}
		placeholder="Speaker notes for this slide..."
	></textarea>
</div>

<style>
	.notes-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
	}

	.panel-label {
		color: #666;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.notes-textarea {
		flex: 1;
		background: #2a2a2a;
		border: 1px solid #444;
		color: #ccc;
		padding: 8px;
		border-radius: 4px;
		font-size: 0.8rem;
		font-family: inherit;
		resize: none;
		line-height: 1.5;
	}

	.notes-textarea:focus {
		outline: 1px solid #4a9eff;
		border-color: #4a9eff;
	}

	.notes-textarea::placeholder {
		color: #555;
	}
</style>
