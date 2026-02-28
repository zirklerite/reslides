<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getDeckContext } from '../context.js';
	import { hasSlideContext } from '../slideContext.js';

	interface Props {
		id?: string;
		color?: string;
		gradient?: string;
		editable?: string | boolean;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { id, color, gradient, editable, children, ...restProps }: Props = $props();

	const inSlide = hasSlideContext();
	const deckCtx = getDeckContext();

	// Deck-level: report background config to context
	if (!inSlide) {
		// Set synchronously so slides in the same render cycle see it immediately
		deckCtx.reportBackground({ color, gradient, children });
		// Also track prop changes (e.g. HMR updates)
		$effect(() => {
			deckCtx.reportBackground({ color, gradient, children });
		});
	}
</script>

{#if inSlide}
	<div
		{...restProps}
		class="reslides-background"
		data-edit-type="background"
		style:background-color={color ?? undefined}
		style:background-image={gradient ?? undefined}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}

<style>
	.reslides-background {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
	}
</style>
