<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getSlideContext } from './slideContext.js';
	import { onMount } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const ctx = getSlideContext();
	let wrapperEl: HTMLDivElement | undefined = $state();
	let stepIndices: number[] = [];

	onMount(() => {
		if (!wrapperEl) return;
		const childCount = wrapperEl.children.length;
		for (let i = 0; i < childCount; i++) {
			stepIndices.push(ctx.registerStep());
		}
		updateClasses();
	});

	function updateClasses(): void {
		if (!wrapperEl || stepIndices.length === 0) return;
		const elChildren = wrapperEl.children;
		for (let i = 0; i < elChildren.length && i < stepIndices.length; i++) {
			const child = elChildren[i];
			const idx = stepIndices[i];
			child.classList.remove('step-hidden', 'step-active', 'step-prior');
			if (ctx.currentStep < idx) {
				child.classList.add('step-hidden');
			} else if (ctx.currentStep === idx) {
				child.classList.add('step-active');
			} else {
				child.classList.add('step-prior');
			}
		}
	}

	$effect(() => {
		void ctx.currentStep;
		updateClasses();
	});
</script>

<div bind:this={wrapperEl} style="display: contents;">
	{@render children()}
</div>
