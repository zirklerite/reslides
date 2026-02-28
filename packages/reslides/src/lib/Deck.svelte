<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TransitionPreset, Direction } from './transitions.js';
	import type { BackgroundConfig } from './context.js';
	import { setDeckContext } from './context.js';
	import SlideContainer from './SlideContainer.svelte';
	import PresenterView from './PresenterView.svelte';
	import OverviewGrid from './OverviewGrid.svelte';
	import EditorView from './editor/EditorView.svelte';
	import { PresenterSync } from './presenterSync.js';
	import { createDrawingState } from './drawing/drawingState.svelte.js';
	import { setDrawingContext } from './drawing/drawingContext.js';

	interface Props {
		title?: string;
		aspectRatio?: number;
		width?: number;
		transition?: TransitionPreset;
		theme?: string;
		colorScheme?: 'light' | 'dark' | 'auto';
		inspect?: boolean;
		children: Snippet;
	}

	let { title = 'Untitled', aspectRatio = 16 / 9, width = 960, transition = 'none', theme = 'default', colorScheme = 'light', inspect = false, children }: Props = $props();

	// Resolve color scheme: 'auto' follows OS preference
	let resolvedColorScheme = $state('light' as 'light' | 'dark');

	$effect(() => {
		if (colorScheme !== 'auto') {
			resolvedColorScheme = colorScheme;
			return;
		}
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		resolvedColorScheme = mq.matches ? 'dark' : 'light';
		const handler = (e: MediaQueryListEvent) => {
			resolvedColorScheme = e.matches ? 'dark' : 'light';
		};
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	let height = $derived(Math.ceil(width / aspectRatio));

	let currentSlide = $state(0);
	let slideCount = $state(0);
	let currentStep = $state(0);
	let slideTotalSteps: number[] = $state([]);
	let slideNotes: string[] = $state([]);
	let slideIds: (string | undefined)[] = $state([]);
	let direction: Direction = $state('forward');
	let overview = $state(false);
	let inspectMode = $state(false);
	let contentCounters: Record<string, number> = $state({});
	let backgroundConfig: BackgroundConfig | null = $state(null);

	// Sync inspectMode from prop
	$effect(() => {
		inspectMode = inspect;
	});

	// Reset slide registration when the rendering container changes.
	// Switching {#if} branches (overview ↔ SlideContainer) remounts all children,
	// causing Slides to re-register. Without reset, indices grow unboundedly.
	// Skip on first run (initial mount) and in editor mode (branch never switches).
	let lastOverview: boolean | undefined = $state(undefined);
	$effect.pre(() => {
		const current = overview;
		if (lastOverview !== undefined && current !== lastOverview && !isEditor) {
			slideCount = 0;
			slideTotalSteps = [];
			slideNotes = [];
			slideIds = [];
		}
		lastOverview = current;
	});

	// Mode detection
	const isPresenter = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('presenter');
	const isEditor = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('editor');

	// BroadcastChannel sync
	let sync: PresenterSync | null = null;
	let ignoreNextSync = false;

	function register(): number {
		const index = slideCount;
		slideCount++;
		slideTotalSteps.push(0);
		slideNotes.push('');
		slideIds.push(undefined);
		return index;
	}

	function reportTotalSteps(slideIndex: number, count: number): void {
		slideTotalSteps[slideIndex] = count;
	}

	function reportNotes(slideIndex: number, notes: string): void {
		slideNotes[slideIndex] = notes;
	}

	function reportSlideId(slideIndex: number, id: string | undefined): void {
		slideIds[slideIndex] = id;
	}

	function registerContent(type: string): number {
		const current = contentCounters[type] || 0;
		const index = current + 1;
		contentCounters[type] = index;
		return index;
	}

	function reportBackground(config: BackgroundConfig): void {
		backgroundConfig = config;
	}

	function next(): void {
		const total = slideTotalSteps[currentSlide] || 0;
		if (currentStep < total) {
			currentStep++;
		} else if (currentSlide < slideCount - 1) {
			direction = 'forward';
			currentSlide++;
			currentStep = 0;
		}
	}

	function prev(): void {
		if (currentStep > 0) {
			currentStep--;
		} else if (currentSlide > 0) {
			direction = 'backward';
			currentSlide--;
			currentStep = slideTotalSteps[currentSlide] || 0;
		}
	}

	function goTo(index: number): void {
		if (index >= 0 && index < slideCount && index !== currentSlide) {
			direction = index > currentSlide ? 'forward' : 'backward';
			currentSlide = index;
			currentStep = 0;
		}
	}

	function openPresenter(): void {
		const url = new URL(window.location.href);
		url.searchParams.set('presenter', '');
		window.open(url.toString(), 'reslides-presenter', 'width=1200,height=800');
	}

	function toggleOverview(): void {
		overview = !overview;
	}

	setDeckContext({
		get currentSlide() { return currentSlide; },
		get totalSlides() { return slideCount; },
		get currentStep() { return currentStep; },
		get totalSteps() { return slideTotalSteps[currentSlide] || 0; },
		get direction() { return direction; },
		get transition() { return transition; },
		get notes() { return slideNotes[currentSlide] || ''; },
		get overview() { return overview; },
		get theme() { return theme; },
		get inspect() { return inspectMode && !overview; },
		get isEditor() { return isEditor; },
		get slideIds() { return slideIds; },
		next,
		prev,
		goTo,
		openPresenter,
		toggleOverview,
		register,
		reportTotalSteps,
		reportNotes,
		reportSlideId,
		registerContent,
		get backgroundConfig() { return backgroundConfig; },
		reportBackground,
	});

	// Drawing state — available in normal and presenter modes only
	const drawingState = (!isEditor) ? createDrawingState() : null;
	if (drawingState) {
		setDrawingContext(drawingState);
	}

	// URL hash sync: read on load (once)
	let initialHashRead = false;
	$effect(() => {
		if (initialHashRead) return;
		if (slideCount === 0) return;
		initialHashRead = true;
		const hash = window.location.hash.slice(1);
		if (!hash) return;
		const parts = hash.split('.');
		const slideNum = parseInt(parts[0], 10);
		if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= slideCount) {
			currentSlide = slideNum - 1;
			if (parts.length > 1) {
				const stepNum = parseInt(parts[1], 10);
				if (!isNaN(stepNum) && stepNum >= 0) {
					currentStep = stepNum;
				}
			}
		}
	});

	// URL hash sync: write on navigate
	$effect(() => {
		const slideNum = currentSlide + 1;
		const hash = currentStep > 0 ? `${slideNum}.${currentStep}` : String(slideNum);
		window.location.hash = hash;
	});

	// BroadcastChannel sync: send on navigate
	$effect(() => {
		const slide = currentSlide;
		const step = currentStep;
		if (sync && !ignoreNextSync) {
			sync.send(slide, step);
		}
		ignoreNextSync = false;
	});

	// BroadcastChannel sync: setup
	$effect(() => {
		sync = new PresenterSync();
		sync.onReceive((msg) => {
			if (msg.slide === currentSlide && msg.step === currentStep) return;
			ignoreNextSync = true;
			if (msg.slide !== currentSlide) {
				direction = msg.slide > currentSlide ? 'forward' : 'backward';
				currentSlide = msg.slide;
			}
			currentStep = msg.step;
		});

		// Drawing sync
		if (drawingState) {
			sync.onDrawReceive((msg) => {
				if (msg.type === 'draw') {
					drawingState.setStrokes(msg.slide, msg.strokes);
				} else if (msg.type === 'draw-clear') {
					drawingState.setStrokes(msg.slide, []);
				}
			});
			drawingState.onSync((slideIndex) => {
				sync?.sendDrawing(slideIndex, drawingState.getStrokes(slideIndex));
			});
			drawingState.onClearSync((slideIndex) => {
				sync?.sendDrawClear(slideIndex);
			});
		}

		return () => {
			if (drawingState) {
				drawingState.onSync(null);
				drawingState.onClearSync(null);
			}
			sync?.destroy();
			sync = null;
		};
	});

	// Keyboard navigation
	function handleKeydown(e: KeyboardEvent): void {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		// When editing inline text (contenteditable), suppress deck navigation
		// but allow Escape through to cancel editing
		const isEditing = (e.target as HTMLElement)?.isContentEditable;
		if (isEditing && e.key !== 'Escape') return;

		// Drawing mode shortcuts (checked first)
		if (drawingState?.isDrawing) {
			switch (e.key) {
				case 'Escape':
					e.preventDefault();
					drawingState.toggleDrawing();
					return;
				case 'e':
					e.preventDefault();
					drawingState.setTool('eraser');
					return;
				case 'p':
					e.preventDefault();
					drawingState.setTool('pen');
					return;
				case 'c':
					e.preventDefault();
					drawingState.clearSlide(currentSlide);
					return;
				case '1':
					e.preventDefault();
					drawingState.setStrokeWidth(2);
					return;
				case '2':
					e.preventDefault();
					drawingState.setStrokeWidth(4);
					return;
				case '3':
					e.preventDefault();
					drawingState.setStrokeWidth(8);
					return;
			}
		}

		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowDown':
			case ' ':
				e.preventDefault();
				next();
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
				e.preventDefault();
				prev();
				break;
			case 'd':
				if (drawingState && !isEditor) {
					e.preventDefault();
					drawingState.toggleDrawing();
				}
				break;
			case 'P':
				if (e.ctrlKey && e.shiftKey) {
					e.preventDefault();
					openPresenter();
				}
				break;
			case 'i':
				if (isEditor) {
					e.preventDefault();
					inspectMode = !inspectMode;
				}
				break;
			case 'o':
				e.preventDefault();
				toggleOverview();
				break;
			case 'Escape':
				if (overview) {
					e.preventDefault();
					overview = false;
				}
				break;
		}
	}

	$effect(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<svelte:head>
	<title>{isEditor ? `Editor — ${title}` : isPresenter ? `Presenter — ${title}` : title}</title>
</svelte:head>

{#if isEditor}
	<EditorView {width} {height} {theme} colorScheme={resolvedColorScheme}>
		{@render children()}
	</EditorView>
{:else if overview}
	<OverviewGrid {width} {height} {theme} colorScheme={resolvedColorScheme}>
		{@render children()}
	</OverviewGrid>
{:else if isPresenter}
	<PresenterView
		{width}
		{height}
		{currentSlide}
		totalSlides={slideCount}
		{currentStep}
		totalSteps={slideTotalSteps[currentSlide] || 0}
		notes={slideNotes[currentSlide] || ''}
		{theme}
		colorScheme={resolvedColorScheme}
	>
		{@render children()}
	</PresenterView>
{:else}
	<SlideContainer {width} {height} {theme} colorScheme={resolvedColorScheme}>
		{@render children()}
	</SlideContainer>
{/if}
