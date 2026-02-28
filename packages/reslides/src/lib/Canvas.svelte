<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		editable?: string | boolean;
		children: Snippet;
		[key: string]: unknown;
	}

	let { id, editable, children, ...restProps }: Props = $props();
</script>

<div
	{...restProps}
	class="canvas"
	data-edit-type="canvas"
>
	{@render children()}
</div>

<style>
	.canvas {
		position: relative;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
	}
</style>
