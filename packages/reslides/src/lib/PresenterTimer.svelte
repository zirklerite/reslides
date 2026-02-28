<script lang="ts">
	let elapsed = $state(0);
	let running = $state(true);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function start() {
		if (intervalId) return;
		intervalId = setInterval(() => {
			elapsed++;
		}, 1000);
	}

	function stop() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function toggle() {
		if (running) {
			stop();
		} else {
			start();
		}
		running = !running;
	}

	function reset() {
		stop();
		elapsed = 0;
		running = false;
	}

	let display = $derived(() => {
		const h = Math.floor(elapsed / 3600);
		const m = Math.floor((elapsed % 3600) / 60);
		const s = elapsed % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	});

	$effect(() => {
		start();
		return () => stop();
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<button
	class="timer"
	class:paused={!running}
	onclick={toggle}
	ondblclick={reset}
>
	{display()}
</button>

<style>
	.timer {
		font-family: var(--font-mono, monospace);
		font-size: 2rem;
		color: #e0e0e0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		user-select: none;
	}

	.timer:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.timer.paused {
		color: #888;
	}
</style>
