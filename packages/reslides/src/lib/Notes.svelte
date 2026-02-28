<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getSlideContext } from './slideContext.js';

	interface Props {
		id?: string;
		editable?: string | boolean;
		children: Snippet;
		[key: string]: unknown;
	}

	let { children, ...restProps }: Props = $props();

	const slideCtx = getSlideContext();

	let notesEl: HTMLDivElement;

	$effect(() => {
		if (notesEl) {
			slideCtx.reportNotes(notesEl.textContent ?? '');
		}
	});
</script>

<div bind:this={notesEl} {...restProps} class="reslides-notes" style:display="none">
	{@render children()}
</div>
