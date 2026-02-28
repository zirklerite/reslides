<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		ordered?: boolean;
		role?: string;
		editable?: string | boolean;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { id, ordered = false, role, editable, children, ...restProps }: Props = $props();
</script>

<div
	{...restProps}
	class="reslides-list"
	data-edit-type="list"
	data-edit-role={role ?? undefined}
>
	{#if ordered}
		<ol>{#if children}{@render children()}{/if}</ol>
	{:else}
		<ul>{#if children}{@render children()}{/if}</ul>
	{/if}
</div>

<style>
	.reslides-list {
		position: relative;
		width: 100%;
		font-family: var(--font-sans, sans-serif);
		color: var(--text-color);
		line-height: 1.6;
	}

	.reslides-list ul,
	.reslides-list ol {
		margin: 0;
		padding-left: 1.5rem;
	}
</style>
