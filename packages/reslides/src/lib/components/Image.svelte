<script lang="ts">
	interface Props {
		id?: string;
		src: string;
		alt?: string;
		fit?: 'cover' | 'contain' | 'fill';
		caption?: string;
		role?: string;
		editable?: string | boolean;
		[key: string]: unknown;
	}

	let { id, src, alt = '', fit = 'contain', caption, role, editable, ...restProps }: Props = $props();
</script>

<figure
	{...restProps}
	class="reslides-image"
	data-edit-type="image"
	data-edit-role={role ?? undefined}
>
	<img {src} {alt} style:object-fit={fit} />
	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>

<style>
	.reslides-image {
		margin: 0;
		position: relative;
		width: 400px;
		height: 300px;
	}

	.reslides-image img {
		max-width: 100%;
		max-height: 100%;
		display: block;
	}

	.reslides-image figcaption {
		font-size: 0.75rem;
		color: var(--text-muted, #888);
		margin-top: 0.5rem;
		text-align: center;
	}
</style>
