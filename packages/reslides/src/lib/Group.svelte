<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id?: string;
		role?: string;
		editable?: string | boolean;
		children: Snippet;
		[key: string]: unknown;
	}

	let { id, role, editable, children, ...restProps }: Props = $props();
</script>

<div
	{...restProps}
	class="reslides-group"
	data-edit-type="group"
	data-edit-role={role ?? undefined}
	style:position="absolute"
	data-group-id={id ?? undefined}
>
	{@render children()}
</div>

<style>
	.reslides-group {
		position: absolute;
	}
</style>
