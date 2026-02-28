<script lang="ts">
	import { Deck, Slide, Steps, Notes, CoverLayout, DefaultLayout, TwoColsLayout, CenterLayout } from 'reslides';
	import 'reslides/themes/default.css';
</script>

<Deck title="My Presentation" transition="fade">
	<Slide>
		<CoverLayout>
			<h1>My Presentation</h1>
			<p>Built with reslides</p>
		</CoverLayout>
		<Notes>Welcome your audience and introduce the topic.</Notes>
	</Slide>

	<Slide>
		<DefaultLayout>
			<h2>Getting Started</h2>
			<Steps>
				<p>Edit <code>src/App.svelte</code> to change slides</p>
				<p>Use layouts to structure your content</p>
				<p>Press <strong>Ctrl+Shift+P</strong> for presenter mode, <strong>O</strong> for overview</p>
			</Steps>
		</DefaultLayout>
		<Notes>Share the main points of your talk.</Notes>
	</Slide>

	<Slide>
		<TwoColsLayout>
			{#snippet left()}
				<h2>Left Column</h2>
				<p>Use <code>TwoColsLayout</code> for side-by-side content.</p>
			{/snippet}
			{#snippet right()}
				<h2>Right Column</h2>
				<p>Great for comparisons, code vs output, or image + text.</p>
			{/snippet}
		</TwoColsLayout>
		<Notes>Show how layouts work side by side.</Notes>
	</Slide>

	<Slide>
		<CenterLayout>
			<h2>Thank You!</h2>
			<p>Start building with <code>/reslides</code> in Claude Code</p>
		</CenterLayout>
		<Notes>Wrap up and thank the audience.</Notes>
	</Slide>
</Deck>

<style>
	h1 {
		font-size: 4rem;
		font-family: var(--font-heading, var(--font-sans));
		color: var(--heading-color, inherit);
		margin-bottom: 0.5rem;
	}

	h2 {
		font-size: 2.5rem;
		font-family: var(--font-heading, var(--font-sans));
		color: var(--heading-color, inherit);
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.25rem;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--code-bg, var(--surface-color));
		color: var(--code-color, inherit);
		padding: 0.1em 0.4em;
		border-radius: var(--radius, 4px);
	}

	:global(.layout-cover) p {
		color: rgba(255, 255, 255, 0.8);
	}

	:global(.layout-cover) code {
		background: rgba(255, 255, 255, 0.15);
		color: #ffffff;
	}
</style>
