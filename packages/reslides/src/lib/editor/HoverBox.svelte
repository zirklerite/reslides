<script lang="ts">
	interface Props {
		targetId: string;
		editVersion?: number;
		onclick?: (targetId: string) => void;
	}

	let { targetId, editVersion = 0, onclick }: Props = $props();

	const TYPE_COLORS: Record<string, string> = {
		slide: 'rgba(239, 68, 68, 0.85)',
		step: 'rgba(16, 185, 129, 0.85)',
		text: 'rgba(245, 158, 11, 0.85)',
		image: 'rgba(245, 158, 11, 0.85)',
		code: 'rgba(245, 158, 11, 0.85)',
		list: 'rgba(245, 158, 11, 0.85)',
		group: 'rgba(168, 85, 247, 0.85)',
	};

	let top = $state(0);
	let left = $state(0);
	let boxWidth = $state(0);
	let boxHeight = $state(0);
	let visible = $state(false);
	let color = $state('rgba(245, 158, 11, 0.85)');
	let label = $state('');
	let isGroup = $state(false);

	function getGroupBounds(el: Element): DOMRect {
		const children = el.querySelectorAll('[data-edit-id]');
		if (children.length === 0) return el.getBoundingClientRect();
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const child of children) {
			const r = child.getBoundingClientRect();
			if (r.width === 0 && r.height === 0) continue;
			minX = Math.min(minX, r.left);
			minY = Math.min(minY, r.top);
			maxX = Math.max(maxX, r.right);
			maxY = Math.max(maxY, r.bottom);
		}
		if (minX === Infinity) return el.getBoundingClientRect();
		return new DOMRect(minX, minY, maxX - minX, maxY - minY);
	}

	function updateRect(el: Element) {
		const canvas = el.closest('.editor-canvas');
		if (!canvas) return;
		const canvasRect = canvas.getBoundingClientRect();
		const elRect = isGroup ? getGroupBounds(el) : el.getBoundingClientRect();
		const pad = isGroup ? 8 : 0;
		top = elRect.top - canvasRect.top - pad;
		left = elRect.left - canvasRect.left - pad;
		boxWidth = elRect.width + pad * 2;
		boxHeight = elRect.height + pad * 2;
		visible = true;
	}

	$effect(() => {
		void editVersion;
		const canvas = document.querySelector('.editor-canvas');
		const el = canvas?.querySelector(`[data-edit-id="${targetId}"]`);
		if (!el) {
			visible = false;
			return;
		}

		const htmlEl = el as HTMLElement;
		const editType = htmlEl.dataset.editType ?? 'text';
		color = TYPE_COLORS[editType] ?? TYPE_COLORS.text;
		label = targetId;
		isGroup = editType === 'group';

		updateRect(el);

		const observer = new ResizeObserver(() => updateRect(el));
		observer.observe(el);

		return () => observer.disconnect();
	});
</script>

{#if visible}
	<div
		class="hover-box"
		style:top="{top}px"
		style:left="{left}px"
		style:width="{boxWidth}px"
		style:height="{boxHeight}px"
		style:--hover-color={color}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span class="hover-label" style:background={color} onclick={() => onclick?.(targetId)}>{label}</span>
	</div>
{/if}

<style>
	.hover-box {
		position: absolute;
		border: 2px dashed var(--hover-color);
		box-sizing: border-box;
		pointer-events: none;
		z-index: 999;
	}

	.hover-label {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 9999;
		font-family: monospace;
		font-size: 8px;
		line-height: 1;
		padding: 1px 3px;
		color: #fff;
		pointer-events: auto;
		cursor: pointer;
		white-space: nowrap;
		border-radius: 0 0 3px 0;
	}

</style>
