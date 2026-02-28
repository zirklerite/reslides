<script lang="ts">
	import type { Snippet } from 'svelte';
	import { highlight } from './highlighter.js';

	interface Props {
		id?: string;
		lang?: string;
		theme?: string;
		showLineNumbers?: boolean;
		hScrollbar?: boolean;
		vScrollbar?: boolean;
		role?: string;
		editable?: string | boolean;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { id, lang, theme = 'github-dark', showLineNumbers = false, hScrollbar = false, vScrollbar = false, role, editable, children, ...restProps }: Props = $props();

	let sourceEl: HTMLElement | undefined = $state();
	let sourceText = $state('');
	let highlightedHtml = $state<string | null>(null);
	let mermaidSvg = $state<string | null>(null);
	let mermaidError = $state(false);
	let isMermaid = $derived(lang === 'mermaid');

	// Unique ID for mermaid rendering
	let mermaidId = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

	// Read text from hidden children render
	$effect(() => {
		if (sourceEl) {
			const raw = sourceEl.textContent ?? '';
			// Trim leading/trailing newline from template formatting
			sourceText = raw.replace(/^\n/, '').replace(/\n\s*$/, '');
		}
	});

	// Highlight when sourceText or lang changes
	$effect(() => {
		if (isMermaid) {
			highlightedHtml = null;
			mermaidSvg = null;
			mermaidError = false;
			if (sourceText) renderMermaid(sourceText);
		} else {
			mermaidSvg = null;
			mermaidError = false;
			highlightedHtml = null;
			if (lang && sourceText) {
				highlight(sourceText, lang, theme).then((html) => {
					highlightedHtml = html;
				});
			}
		}
	});

	async function renderMermaid(source: string) {
		try {
			const mermaid = await import('mermaid');
			mermaid.default.initialize({ startOnLoad: false, theme: 'dark' });
			const { svg } = await mermaid.default.render(mermaidId, source);
			mermaidSvg = svg;
		} catch {
			mermaidError = true;
		}
	}

	function wrapWithLineNumbers(html: string): string {
		const codeMatch = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
		if (!codeMatch) return html;
		const inner = codeMatch[1];
		const lines = inner.split('\n');
		if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
			lines.pop();
		}
		return lines
			.map((line, i) => `<span class="line-row"><span class="line-number">${i + 1}</span><span class="line-content">${line}</span></span>`)
			.join('\n');
	}

	function plainLineNumbers(text: string): string {
		const lines = text.split('\n');
		return lines
			.map((line, i) => `<span class="line-row"><span class="line-number">${i + 1}</span><span class="line-content">${escapeHtml(line)}</span></span>`)
			.join('\n');
	}

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
</script>

<!-- Hidden reader for text extraction -->
<span bind:this={sourceEl} class="source-reader" aria-hidden="true">{#if children}{@render children()}{/if}</span>

{#if !sourceText}
	<div
		{...restProps}
		class="reslides-code"
		data-edit-type="code"
		data-edit-role={role ?? undefined}
	></div>
{:else if isMermaid && mermaidSvg}
	<div
		{...restProps}
		class="reslides-code reslides-mermaid"
		data-edit-type="code"
		data-edit-role={role ?? undefined}
	>
		{@html mermaidSvg}
	</div>
{:else if highlightedHtml && !isMermaid}
	<div
		{...restProps}
		class="reslides-code"
		class:has-line-numbers={showLineNumbers}
		class:h-scrollbar={hScrollbar}
		class:v-scrollbar={vScrollbar}
		data-edit-type="code"
		data-edit-role={role ?? undefined}
	>
		{#if showLineNumbers}
			<pre class="shiki-override"><code>{@html wrapWithLineNumbers(highlightedHtml)}</code></pre>
		{:else}
			{@html highlightedHtml}
		{/if}
	</div>
{:else}
	<div
		{...restProps}
		class="reslides-code"
		class:has-line-numbers={showLineNumbers}
		class:h-scrollbar={hScrollbar}
		class:v-scrollbar={vScrollbar}
		data-edit-type="code"
		data-edit-role={role ?? undefined}
	>
		{#if showLineNumbers}
			<pre><code class={lang ? `language-${lang}` : ''}>{@html plainLineNumbers(sourceText)}</code></pre>
		{:else}
			<pre><code class={lang ? `language-${lang}` : ''}>{sourceText}</code></pre>
		{/if}
	</div>
{/if}

<style>
	.source-reader {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.reslides-code {
		position: relative;
		width: 100%;
	}

	.reslides-code :global(pre) {
		margin: 0;
		padding: 1rem;
		background: var(--code-bg, #1e1e1e) !important;
		color: var(--code-color, #d4d4d4);
		border-radius: 6px;
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
		font-family: var(--font-mono, monospace);
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.h-scrollbar :global(pre) {
		white-space: pre;
		word-wrap: normal;
		overflow-wrap: normal;
		overflow-x: auto;
	}

	.v-scrollbar {
		overflow-y: auto;
	}

	.v-scrollbar :global(pre) {
		height: 100%;
	}

	.reslides-code :global(code) {
		font-family: inherit;
	}

	/* Line numbers */
	.reslides-code :global(.line-row) {
		display: inline-flex;
		width: 100%;
	}

	.reslides-code :global(.line-number) {
		display: inline-block;
		width: 2.5em;
		text-align: right;
		padding-right: 1em;
		color: var(--code-color, #d4d4d4);
		opacity: 0.35;
		user-select: none;
		flex-shrink: 0;
	}

	.reslides-code :global(.line-content) {
		flex: 1;
		min-width: 0;
	}

	/* Mermaid container */
	.reslides-mermaid {
		background: var(--code-bg, #1e1e1e);
		border-radius: 6px;
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.reslides-mermaid :global(svg) {
		max-width: 100%;
		height: auto;
	}
</style>
