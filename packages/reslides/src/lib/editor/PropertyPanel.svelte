<script lang="ts">
	import { sendEdit, setSuppressTransition } from './editorSocket.js';

	interface Props {
		selectedIds: string[];
		editVersion?: number;
	}

	let { selectedIds, editVersion = 0 }: Props = $props();

	// Component type detection from DOM class
	type ComponentType = 'Text' | 'Image' | 'Code' | 'List' | 'Slide' | 'Group' | 'Background' | null;

	let componentType: ComponentType = $state(null);
	let isMixed = $state(false);
	let selectionCount = $state(0);

	// Prop values (used for single or batch same-type)
	let editFile: string = $state('');
	let editId: string = $state('');
	let textSize = $state(24);
	let textMuted = $state(false);
	let textAlign = $state('left');
	let imgSrc = $state('');
	let imgAlt = $state('');
	let imgFit = $state('contain');
	let imgCaption = $state('');
	let codeContent = $state('');
	let codeLang = $state('');
	let codeShowLineNumbers = $state(false);
	let listOrdered = $state(false);
	let slideTheme = $state('');
	let slideTransition = $state('');
	let bgColor = $state('');
	let bgGradient = $state('');

	// "mixed" flags for batch mode
	let mixedSize = $state(false);
	let mixedMuted = $state(false);
	let mixedAlign = $state(false);

	function detectType(el: HTMLElement): ComponentType {
		const t = el.dataset.editType;
		switch (t) {
			case 'text': return 'Text';
			case 'image': return 'Image';
			case 'code': return 'Code';
			case 'list': return 'List';
			case 'group': return 'Group';
			case 'background': return 'Background';
			case 'slide': return 'Slide';
			default: return null;
		}
	}

	function readProps(el: HTMLElement, type: ComponentType) {
		editFile = el.dataset.editFile ?? '';
		editId = el.dataset.editId ?? '';

		switch (type) {
			case 'Text': {
				const computed = getComputedStyle(el);
				textSize = parseFloat(computed.fontSize) || 24;
				const isMutedColor = el.style.color?.includes('var(--text-muted');
				textMuted = isMutedColor;
				textAlign = computed.textAlign as 'left' | 'center' | 'right';
				break;
			}
			case 'Image': {
				const img = el.querySelector('img');
				imgSrc = img?.src ?? '';
				imgAlt = img?.alt ?? '';
				imgFit = img?.style.objectFit || 'contain';
				const caption = el.querySelector('figcaption');
				imgCaption = caption?.textContent ?? '';
				break;
			}
			case 'Code': {
				// Read source text from sibling .source-reader (hidden children render)
				const sourceReader = el.previousElementSibling;
				if (sourceReader?.classList.contains('source-reader')) {
					const raw = sourceReader.textContent ?? '';
					codeContent = raw.replace(/^\n/, '').replace(/\n\s*$/, '');
				} else {
					const code = el.querySelector('code');
					codeContent = code?.textContent ?? '';
				}
				const code = el.querySelector('code');
				const langClass = code?.className ?? '';
				const langMatch = langClass.match(/language-(\w+)/);
				codeLang = langMatch ? langMatch[1] : '';
				codeShowLineNumbers = el.classList.contains('has-line-numbers');
				break;
			}
			case 'List': {
				listOrdered = !!el.querySelector('ol');
				break;
			}
			case 'Background': {
				bgColor = el.style.backgroundColor || '';
				bgGradient = el.style.backgroundImage || '';
				break;
			}
			case 'Slide': {
				slideTheme = el.dataset.theme ?? '';
				slideTransition = '';
				break;
			}
		}
	}

	$effect(() => {
		// Depend on editVersion to re-read after HMR
		void editVersion;
		selectionCount = selectedIds.length;

		if (selectedIds.length === 0) {
			componentType = null;
			isMixed = false;
			return;
		}

		// Single selection
		if (selectedIds.length === 1) {
			isMixed = false;
			mixedSize = false;
			mixedMuted = false;
			mixedAlign = false;
			const el = document.querySelector(`[data-edit-id="${selectedIds[0]}"]`) as HTMLElement | null;
			if (!el) {
				componentType = null;
				return;
			}
			const type = detectType(el);
			componentType = type;
			if (type) readProps(el, type);
			return;
		}

		// Multi selection: check types
		const elements: HTMLElement[] = [];
		const types: Set<ComponentType> = new Set();
		for (const id of selectedIds) {
			const el = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
			if (!el) continue;
			elements.push(el);
			types.add(detectType(el));
		}

		if (types.size === 0) {
			componentType = null;
			isMixed = false;
			return;
		}

		if (types.size > 1) {
			componentType = null;
			isMixed = true;
			return;
		}

		// All same type
		isMixed = false;
		const type = [...types][0];
		componentType = type;

		if (elements.length > 0) {
			readProps(elements[0], type);
		}

		// Check for mixed values on Text fields
		if (type === 'Text' && elements.length > 1) {
			const sizes = new Set<number>();
			const muteds = new Set<boolean>();
			const aligns = new Set<string>();
			for (const el of elements) {
				const computed = getComputedStyle(el);
				sizes.add(parseFloat(computed.fontSize) || 24);
				muteds.add(!!el.style.color?.includes('var(--text-muted'));
				aligns.add(computed.textAlign);
			}
			mixedSize = sizes.size > 1;
			mixedMuted = muteds.size > 1;
			mixedAlign = aligns.size > 1;
		} else {
			mixedSize = false;
			mixedMuted = false;
			mixedAlign = false;
		}
	});

	// --- Batch edit helpers ---

	function sendAttrForAll(attrName: string, value: string) {
		if (selectedIds.length > 1) setSuppressTransition();
		for (const id of selectedIds) {
			const el = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
			if (!el) continue;
			const file = el.dataset.editFile ?? '';
			if (file) {
				sendEdit('replaceAttribute', { file, elementId: id, attrName, attrValue: value });
			}
		}
	}

	function sendRemoveAttrForAll(attrName: string) {
		if (selectedIds.length > 1) setSuppressTransition();
		for (const id of selectedIds) {
			const el = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
			if (!el) continue;
			const file = el.dataset.editFile ?? '';
			if (file) {
				sendEdit('removeAttribute', { file, elementId: id, attrName });
			}
		}
	}

	function sendBareAttrForAll(attrName: string) {
		if (selectedIds.length > 1) setSuppressTransition();
		for (const id of selectedIds) {
			const el = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
			if (!el) continue;
			const file = el.dataset.editFile ?? '';
			if (file) {
				sendEdit('addBareAttribute', { file, elementId: id, attrName });
			}
		}
	}

	function handleSelectChange(attrName: string, e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		sendAttrForAll(attrName, value);
	}

	function handleCheckboxChange(attrName: string, e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		if (checked) {
			sendBareAttrForAll(attrName);
		} else {
			sendRemoveAttrForAll(attrName);
		}
	}

	function handleInputBlur(attrName: string, e: Event) {
		const value = (e.target as HTMLInputElement).value;
		sendAttrForAll(attrName, value);
	}

	function handleTextareaBlur(attrName: string, e: Event) {
		const value = (e.target as HTMLTextAreaElement).value;
		sendAttrForAll(attrName, value);
	}

	function sendContentForAll(e: Event) {
		const value = (e.target as HTMLTextAreaElement).value;
		if (selectedIds.length > 1) setSuppressTransition();
		for (const id of selectedIds) {
			const el = document.querySelector(`[data-edit-id="${id}"]`) as HTMLElement | null;
			if (!el) continue;
			const file = el.dataset.editFile ?? '';
			if (file) {
				sendEdit('replaceContent', { file, elementId: id, content: value });
			}
		}
	}
</script>

<div class="property-panel">
	{#if selectionCount === 0}
		<span class="empty-state">No element selected</span>
	{:else if isMixed}
		<span class="empty-state">{selectionCount} elements selected</span>
	{:else if !componentType}
		<span class="empty-state">No element selected</span>
	{:else}
		<div class="panel-header">
			<span class="element-type">{componentType}</span>
			{#if selectionCount === 1}
				<span class="element-id">{editId}</span>
			{:else}
				<span class="element-id">{selectionCount} selected</span>
			{/if}
		</div>

		{#if componentType === 'Text'}
			<div class="field">
				<label for="prop-size">size</label>
				<input id="prop-size" type="number" value={mixedSize ? '' : textSize} placeholder={mixedSize ? 'mixed' : ''} min="8" onblur={(e) => handleInputBlur('size', e)} />
			</div>
			<div class="field">
				<label for="prop-muted">muted</label>
				<input id="prop-muted" type="checkbox" checked={mixedMuted ? false : textMuted} onchange={(e) => handleCheckboxChange('muted', e)} />
				{#if mixedMuted}<span class="mixed-label">mixed</span>{/if}
			</div>
			<div class="field">
				<label for="prop-align">align</label>
				<select id="prop-align" value={mixedAlign ? '' : textAlign} onchange={(e) => handleSelectChange('align', e)}>
					{#if mixedAlign}<option value="" disabled>mixed</option>{/if}
					<option value="left">left</option>
					<option value="center">center</option>
					<option value="right">right</option>
				</select>
			</div>

		{:else if componentType === 'Image'}
			<div class="field">
				<label for="prop-src">src</label>
				<input id="prop-src" type="text" value={imgSrc} onblur={(e) => handleInputBlur('src', e)} />
			</div>
			<div class="field">
				<label for="prop-alt">alt</label>
				<input id="prop-alt" type="text" value={imgAlt} onblur={(e) => handleInputBlur('alt', e)} />
			</div>
			<div class="field">
				<label for="prop-fit">fit</label>
				<select id="prop-fit" value={imgFit} onchange={(e) => handleSelectChange('fit', e)}>
					<option value="cover">cover</option>
					<option value="contain">contain</option>
					<option value="fill">fill</option>
				</select>
			</div>
			<div class="field">
				<label for="prop-caption">caption</label>
				<input id="prop-caption" type="text" value={imgCaption} onblur={(e) => handleInputBlur('caption', e)} />
			</div>

		{:else if componentType === 'Code'}
			<div class="field">
				<label for="prop-lang">lang</label>
				<input id="prop-lang" type="text" value={codeLang} onblur={(e) => handleInputBlur('lang', e)} />
			</div>
			<div class="field">
				<label for="prop-line-numbers">lineNumbers</label>
				<input id="prop-line-numbers" type="checkbox" checked={codeShowLineNumbers} onchange={(e) => handleCheckboxChange('showLineNumbers', e)} />
			</div>
			<div class="field field-wide">
				<label for="prop-code">content</label>
				<textarea id="prop-code" rows="4" onblur={sendContentForAll}>{codeContent}</textarea>
			</div>

		{:else if componentType === 'List'}
			<div class="field">
				<label for="prop-ordered">ordered</label>
				<input id="prop-ordered" type="checkbox" checked={listOrdered} onchange={(e) => handleCheckboxChange('ordered', e)} />
			</div>

		{:else if componentType === 'Background'}
			<div class="field">
				<label for="prop-bg-color">color</label>
				<input id="prop-bg-color" type="text" value={bgColor} onblur={(e) => handleInputBlur('color', e)} />
			</div>
			<div class="field">
				<label for="prop-bg-gradient">gradient</label>
				<input id="prop-bg-gradient" type="text" value={bgGradient} onblur={(e) => handleInputBlur('gradient', e)} />
			</div>

		{:else if componentType === 'Slide'}
			<div class="field">
				<label for="prop-theme">theme</label>
				<select id="prop-theme" value={slideTheme} onchange={(e) => handleSelectChange('theme', e)}>
					<option value="">default</option>
					<option value="dark">dark</option>
					<option value="minimal">minimal</option>
					<option value="academic">academic</option>
					<option value="corporate">corporate</option>
					<option value="vibrant">vibrant</option>
					<option value="monochrome">monochrome</option>
				</select>
			</div>
			<div class="field">
				<label for="prop-transition">transition</label>
				<select id="prop-transition" value={slideTransition} onchange={(e) => handleSelectChange('transition', e)}>
					<option value="">none</option>
					<option value="fade">fade</option>
					<option value="slide">slide</option>
					<option value="scale">scale</option>
				</select>
			</div>
		{/if}
	{/if}
</div>

<style>
	.property-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.empty-state {
		color: #666;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
		padding-bottom: 8px;
		border-bottom: 1px solid #333;
	}

	.element-type {
		font-size: 0.7rem;
		font-weight: 600;
		color: #4a9eff;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.element-id {
		font-size: 0.7rem;
		color: #888;
		font-family: monospace;
	}

	.field {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.field-wide {
		flex-direction: column;
		align-items: stretch;
	}

	.field label {
		font-size: 0.75rem;
		color: #999;
		min-width: 60px;
		font-family: monospace;
	}

	.field select,
	.field input[type="text"],
	.field input[type="number"],
	.field textarea {
		flex: 1;
		background: #2a2a2a;
		border: 1px solid #444;
		color: #ccc;
		padding: 3px 6px;
		border-radius: 3px;
		font-size: 0.75rem;
		font-family: inherit;
	}

	.field textarea {
		font-family: monospace;
		resize: vertical;
	}

	.field select:focus,
	.field input:focus,
	.field textarea:focus {
		outline: 1px solid #4a9eff;
		border-color: #4a9eff;
	}

	.field input[type="checkbox"] {
		accent-color: #4a9eff;
	}

	.mixed-label {
		font-size: 0.65rem;
		color: #888;
		font-style: italic;
	}
</style>
