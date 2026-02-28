<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getSlideContext } from './slideContext.js';

	interface Props {
		id?: string;
		editable?: string | boolean;
		children: Snippet;
		[key: string]: unknown;
	}

	let { id, editable, children, ...restProps }: Props = $props();

	const ctx = getSlideContext();
	const stepIndex = ctx.registerStep();

	let className = $derived(
		ctx.currentStep < stepIndex ? 'step-hidden' :
		ctx.currentStep === stepIndex ? 'step-active' :
		'step-prior'
	);
</script>

<div
	{...restProps}
	class={className}
	data-edit-type="step"
>
	{@render children()}
</div>
