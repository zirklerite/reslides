<script lang="ts">
	import { layoutPresets, type LayoutPreset, type RoleLayout } from '../layoutPresets.js';
	import { sendEdit, setSuppressTransition } from './editorSocket.js';
	import { getDeckContext } from '../context.js';

	const deckCtx = getDeckContext();

	function applyPreset(preset: LayoutPreset) {
		// Find the active slide's canvas children
		const canvas = document.querySelector('.editor-canvas');
		if (!canvas) return;

		// Get all slides, take the last one (incoming during transitions)
		const slides = canvas.querySelectorAll('.slide');
		const slide = slides[slides.length - 1] as HTMLElement | null;
		if (!slide) return;

		// Find all elements with data-edit-role inside the slide
		const roleElements = slide.querySelectorAll('[data-edit-role]');
		if (roleElements.length === 0) return;

		setSuppressTransition();

		for (const el of roleElements) {
			const htmlEl = el as HTMLElement;
			const role = htmlEl.dataset.editRole;
			const file = htmlEl.dataset.editFile;
			const elementId = htmlEl.dataset.editId;
			if (!role || !file || !elementId) continue;

			const layout = preset.roles[role];
			if (!layout) continue;

			// Build style updates
			const styles: Record<string, string> = {
				position: 'absolute',
				left: `${layout.x}px`,
				top: `${layout.y}px`,
				width: `${layout.width}px`,
			};
			if (layout.height !== undefined) {
				styles.height = `${layout.height}px`;
			}

			sendEdit('replaceStyle', { file, elementId, styles });

			// Update component-specific props
			if (layout.size !== undefined) {
				sendEdit('replaceAttribute', { file, elementId, attrName: 'size', attrValue: String(layout.size) });
			}
			if (layout.align !== undefined) {
				sendEdit('replaceAttribute', { file, elementId, attrName: 'align', attrValue: layout.align });
			}
			if (layout.muted === true) {
				sendEdit('addBareAttribute', { file, elementId, attrName: 'muted' });
			} else if (layout.muted === false) {
				sendEdit('removeAttribute', { file, elementId, attrName: 'muted' });
			}
		}
	}

	// Thumbnail role colors
	const ROLE_COLORS: Record<string, string> = {
		title: '#4a9eff',
		subtitle: '#6bb8ff',
		body: '#888',
		'body-right': '#888',
		number: '#4a9eff',
		caption: '#666',
	};
</script>

<div class="layout-panel">
	<div class="preset-grid">
		{#each layoutPresets as preset}
			<button
				class="preset-thumb"
				title={preset.name}
				onclick={() => applyPreset(preset)}
			>
				<svg viewBox="0 0 960 540" class="preset-svg">
					{#each Object.entries(preset.roles) as [role, layout]}
						<rect
							x={layout.x}
							y={layout.y}
							width={layout.width}
							height={layout.height ?? (layout.size ? layout.size * 1.6 : 40)}
							fill={ROLE_COLORS[role] ?? '#888'}
							opacity="0.4"
							rx="4"
						/>
						<text
							x={layout.x + 6}
							y={layout.y + (layout.height ?? (layout.size ? layout.size * 1.6 : 40)) / 2 + 5}
							fill={ROLE_COLORS[role] ?? '#888'}
							font-size="24"
							opacity="0.8"
						>{role}</text>
					{/each}
				</svg>
				<span class="preset-name">{preset.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.layout-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.preset-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}

	.preset-thumb {
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 4px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.preset-thumb:hover {
		border-color: #4a9eff;
		background: #333;
	}

	.preset-svg {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #1a1a1a;
		border-radius: 2px;
	}

	.preset-name {
		font-size: 0.6rem;
		color: #999;
		text-align: center;
		line-height: 1.2;
	}
</style>
