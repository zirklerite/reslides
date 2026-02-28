<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		width?: number;
		height?: number;
		theme?: string;
		colorScheme?: string;
		children: Snippet;
	}

	let { width = 960, height = 540, theme = 'default', colorScheme = 'light', children }: Props = $props();

	let gridEl: HTMLDivElement | undefined = $state();
	let cellWidth = $state(240);

	// Compute thumbnail scale: cell width / slide width
	let thumbScale = $derived(cellWidth / width);
	// Cell height based on aspect ratio
	let cellHeight = $derived(cellWidth * (height / width));

	$effect(() => {
		if (!gridEl) return;

		const observer = new ResizeObserver(() => {
			// Measure the actual width of the first grid cell
			const firstChild = gridEl!.querySelector('.thumbnail') as HTMLElement | null;
			if (firstChild) {
				cellWidth = firstChild.offsetWidth;
			}
		});

		observer.observe(gridEl);
		return () => observer.disconnect();
	});
</script>

<div
	class="overview-grid"
	bind:this={gridEl}
	data-theme={theme}
	data-color-scheme={colorScheme}
	style:--thumb-scale={thumbScale}
	style:--cell-height="{cellHeight}px"
>
	{@render children()}
</div>

<style>
	.overview-grid {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		background: #111;
		padding: 24px;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 16px;
		align-content: start;
	}

	/* Set thumbnail height via the grid */
	.overview-grid > :global(.thumbnail) {
		height: var(--cell-height);
	}
</style>
