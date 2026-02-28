<script lang="ts">
	interface Props {
		guides: { x: number[]; y: number[] };
	}

	let { guides }: Props = $props();

	// Convert slide coordinates to canvas pixel position
	function getSlideRect(): { left: number; top: number; width: number; height: number } | null {
		const slideContent = document.querySelector('.editor-canvas .slide-content') as HTMLElement | null;
		const canvas = document.querySelector('.editor-canvas') as HTMLElement | null;
		if (!slideContent || !canvas) return null;
		const slideRect = slideContent.getBoundingClientRect();
		const canvasRect = canvas.getBoundingClientRect();
		return {
			left: slideRect.left - canvasRect.left,
			top: slideRect.top - canvasRect.top,
			width: slideRect.width,
			height: slideRect.height,
		};
	}

	let slideRect = $derived(getSlideRect());
</script>

{#if slideRect}
	{#each guides.x as xVal}
		{@const screenX = slideRect.left + (xVal / 960) * slideRect.width}
		<div
			class="guide guide-vertical"
			style:left="{screenX}px"
			style:top="{slideRect.top}px"
			style:height="{slideRect.height}px"
		></div>
	{/each}
	{#each guides.y as yVal}
		{@const screenY = slideRect.top + (yVal / 540) * slideRect.height}
		<div
			class="guide guide-horizontal"
			style:top="{screenY}px"
			style:left="{slideRect.left}px"
			style:width="{slideRect.width}px"
		></div>
	{/each}
{/if}

<style>
	.guide {
		position: absolute;
		pointer-events: none;
		z-index: 999;
	}

	.guide-vertical {
		width: 1px;
		background: rgba(59, 130, 246, 0.7);
	}

	.guide-horizontal {
		height: 1px;
		background: rgba(59, 130, 246, 0.7);
	}
</style>
