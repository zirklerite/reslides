<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		size?: number;
		muted?: boolean;
		align?: 'left' | 'center' | 'right';
		role?: string;
		editable?: string | boolean;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { id, size = 24, muted = false, align = 'left', role, editable, children, ...restProps }: Props = $props();
</script>

<div
	{...restProps}
	class="reslides-text"
	data-edit-type="text"
	data-edit-role={role ?? undefined}
	style:font-size="{size}px"
	style:color={muted ? 'var(--text-muted, #888)' : 'var(--text-color)'}
	style:text-align={align}
>
	{#if children}{@render children()}{/if}
</div>

<style>
	.reslides-text {
		font-family: var(--font-sans, sans-serif);
		line-height: 1.6;
		position: relative;
		width: 100%;
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}
</style>
