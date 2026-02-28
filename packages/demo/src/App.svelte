<script lang="ts">
	import {
		Deck, Slide, Step, Steps, Notes, Group, Background, Canvas,
		Text, Image, Code, List,
	} from 'reslides';

	import 'reslides/themes/academic.css';
</script>

<Deck title="reslides Demo" aspectRatio={16 / 9} transition="slide" theme="academic">

	<!-- Deck-level background: applies to all slides unless overridden -->
	<Background gradient="linear-gradient(135deg, rgba(30, 30, 60, 0.05), rgba(60, 30, 60, 0.03))">
		<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 960 540" preserveAspectRatio="none" style="opacity: 0.12">
			<!-- top-left cluster -->
			<circle cx="80" cy="60" r="120" fill="#667eea" />
			<circle cx="140" cy="110" r="80" fill="#764ba2" />
			<circle cx="30" cy="140" r="50" fill="#f093fb" />
			<!-- top-right arc -->
			<ellipse cx="880" cy="-20" rx="200" ry="160" fill="#43e97b" />
			<ellipse cx="920" cy="50" rx="100" ry="80" fill="#38f9d7" />
			<!-- bottom-left sweep -->
			<path d="M-40 540 Q120 380 320 460 T600 540Z" fill="#fa709a" />
			<!-- bottom-right cluster -->
			<circle cx="860" cy="480" r="140" fill="#a18cd1" />
			<circle cx="780" cy="520" r="70" fill="#fbc2eb" />
			<!-- scattered accents -->
			<circle cx="480" cy="50" r="30" fill="#fad0c4" />
			<circle cx="600" cy="490" r="25" fill="#ffecd2" />
			<rect x="350" y="440" width="60" height="60" rx="12" fill="#667eea" transform="rotate(25 380 470)" />
			<rect x="700" y="180" width="40" height="40" rx="8" fill="#f093fb" transform="rotate(-15 720 200)" />
			<!-- diagonal line accents -->
			<line x1="200" y1="0" x2="400" y2="540" stroke="#43e97b" stroke-width="2" opacity="0.5" />
			<line x1="750" y1="0" x2="550" y2="540" stroke="#fa709a" stroke-width="2" opacity="0.5" />
		</svg>
	</Background>

	<!-- ===== SLIDE 1: Title Slide ===== -->
	<Slide id="slide-1" editable transition="fade">
		<Canvas>
			<Text id="text-1" editable role="title" size={48} align="center" style="position: absolute; left: 130px; top: 170px; width: 700px; color: var(--heading-color); z-index: 2">reslides</Text>
			<Group id="group-2" editable style="position: absolute; left: 159px; top: 170px; z-index: 1">
				<Text id="text-2" editable role="subtitle" size={20} align="center" style="position: absolute; left: 180px; top: 260px; width: 600px; color: var(--text-muted)" muted>Presentation framework powered by Svelte 5</Text>
				<Text id="text-3" editable size={14} align="center" style="position: absolute; left: -147px; top: 95px; width: 500px; color: var(--text-color)">Press → to navigate, O for overview, Ctrl+Shift+P for presenter</Text>
			</Group>
		</Canvas>
		<Notes id="notes-1" editable>Welcome slide — centered content with accent background.</Notes>
	</Slide>

	<!-- ===== SLIDE 2: Title + Content ===== -->
	<Slide id="slide-2" editable>
		<Canvas>
			<Text id="text-4" editable role="title" size={36} style="position: absolute; left: 60px; top: 50px; width: 840px">Canvas + Roles</Text>
			<Text id="text-5" editable role="subtitle" size={18} muted style="position: absolute; left: 60px; top: 110px; width: 700px">The standard slide structure: Canvas wraps visible content, roles identify semantic parts.</Text>
			<List id="list-1" editable role="body" style="position: absolute; left: 60px; top: 180px; width: 500px">
				<li>Canvas is the visible-content container</li>
				<li>Roles: title, subtitle, body</li>
				<li>Layout presets rearrange by role</li>
			</List>
			<Code id="code-1" editable lang="html" style="position: absolute; left: 60px; top: 370px; width: 500px">{`<Canvas>
  <Text role="title">Your title</Text>
  <Text role="body">Content here</Text>
</Canvas>`}</Code>
		</Canvas>
		<Notes id="notes-2" editable>Canvas + role-based layout — the core slide structure.</Notes>
	</Slide>

	<!-- ===== SLIDE 3: Section Header ===== -->
	<Slide id="slide-3" editable transition="fade">
		<Canvas>
			<Text id="text-6" editable role="title" size={36} style="position: absolute; left: 337px; top: 133px; width: 286px; height: 58px" align="center">Section Divider</Text>
			<Text id="text-7" editable role="subtitle" size={18} muted style="position: absolute; left: 148px; top: 258px; width: 664px; height: 88px">Use a section-header preset to introduce a new topic.</Text>
		</Canvas>
		<Notes id="notes-3" editable>Section header — divides your talk into clear sections.</Notes>
	</Slide>

	<!-- ===== SLIDE 4: Two Columns ===== -->
	<Slide id="slide-4" editable>
		<Canvas>
			<Text id="text-8" editable role="title" size={30} style="position: absolute; left: 60px; top: 20px; width: 840px">Two Columns</Text>
			<Text id="text-9" editable role="subtitle" size={16} muted style="position: absolute; left: 60px; top: 70px; width: 400px">Left column for text, explanations, or key points.</Text>
			<List id="list-2" editable role="body" style="position: absolute; left: 60px; top: 140px; width: 380px">
				<li>Compare ideas side by side</li>
				<li>Pair text with visuals</li>
				<li>Show before and after</li>
			</List>
			<Text id="text-10" editable size={18} style="position: absolute; left: 510px; top: 20px; width: 400px">Right Column</Text>
			<Code id="code-2" editable lang="html" style="position: absolute; left: 510px; top: 70px; width: 380px">{`<Canvas>
  <Text role="title">Title</Text>
  <List role="body">Left col</List>
  <Code>Right col</Code>
</Canvas>`}</Code>
		</Canvas>
		<Notes id="notes-4" editable>Two-column layout — position elements freely with absolute positioning.</Notes>
	</Slide>

	<!-- ===== SLIDE 5: Centered (slide-level background override) ===== -->
	<Slide id="slide-5" editable transition="scale">
		<Canvas>
			<Background id="bg-5" editable color="#1a1a2e" gradient="linear-gradient(135deg, #667eea, #764ba2)" />
			<Text id="text-11" editable role="title" size={36} align="center" style="position: absolute; left: 130px; top: 170px; width: 700px">Centered Layout</Text>
			<Text id="text-12" editable role="subtitle" size={18} muted align="center" style="position: absolute; left: 180px; top: 240px; width: 600px">Apply the title-slide preset for centered content.</Text>
			<Text id="text-13" editable size={16} muted align="center" style="position: absolute; left: 230px; top: 290px; width: 500px">Great for quotes, key takeaways, or single ideas.</Text>
		</Canvas>
		<Notes id="notes-5" editable>Centered layout — perfect for emphasis slides.</Notes>
	</Slide>

	<!-- ===== SLIDE 6: Full-bleed Image ===== -->
	<Slide id="slide-6" editable transition="fade">
		<Canvas>
			<Background id="bg-6" editable>
				<img src="https://picsum.photos/960/540?grayscale" alt="Full bleed background" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.4" />
			</Background>
			<Text id="text-14" editable role="title" size={36} align="center" style="position: absolute; left: 130px; top: 180px; width: 700px">Image Background</Text>
			<Text id="text-15" editable role="subtitle" size={18} align="center" style="position: absolute; left: 180px; top: 250px; width: 600px">Use Background with an image child for full-bleed visuals.</Text>
		</Canvas>
		<Notes id="notes-6" editable>Full-bleed image background with text overlay.</Notes>
	</Slide>

	<!-- ===== SLIDE 7: Content Components ===== -->
	<Slide id="slide-7" editable>
		<Canvas>
			<Text id="text-16" editable role="title" size={30} style="position: absolute; left: 60px; top: 30px; width: 500px">Content Components</Text>
			<Text id="text-17" editable role="subtitle" size={16} muted style="position: absolute; left: 60px; top: 80px; width: 420px">Theme-aware building blocks for structured content.</Text>
			<Code id="code-3" editable lang="javascript" style="position: absolute; left: 60px; top: 140px; width: 400px">const deck = new Presentation('reslides');
</Code>
			<List id="list-3" editable role="body" style="position: absolute; left: 60px; top: 250px; width: 400px">
				<li>Text — sized, muted, aligned</li>
				<li>Image — src, alt, fit, caption</li>
				<li>Code — syntax highlighted</li>
				<li>List — ordered or unordered</li>
			</List>
			<Image id="img-1" editable src="https://picsum.photos/400/200" alt="Sample image" fit="contain" caption="A random sample image" style="position: absolute; left: 520px; top: 80px; width: 380px; height: 220px" />
		</Canvas>
		<Notes id="notes-7" editable>Content components — Text, Image, Code, List.</Notes>
	</Slide>

	<!-- ===== SLIDE 7b: Mermaid Diagram ===== -->
	<Slide id="slide-7b" editable>
		<Canvas>
			<Text id="text-36" editable role="title" size={30} style="position: absolute; left: 60px; top: 30px; width: 500px">Mermaid Diagrams</Text>
			<Text id="text-37" editable role="subtitle" size={16} muted style="position: absolute; left: 60px; top: 80px; width: 700px">Use lang="mermaid" to render diagrams directly from code.</Text>
			<Code id="code-6" editable role="body" lang="mermaid" style="position: absolute; left: 60px; top: 140px; width: 840px; height: 350px">{`graph LR
    A[Write Slides] --> B[Add Components]
    B --> C{Need Diagram?}
    C -->|Yes| D[Use Mermaid]
    C -->|No| E[Use Code/Text]
    D --> F[Present!]
    E --> F`}</Code>
		</Canvas>
		<Notes id="notes-7b" editable>Mermaid support — render diagrams with lang="mermaid".</Notes>
	</Slide>

	<!-- ===== SLIDE 8: Steps ===== -->
	<Slide id="slide-8" editable>
		<Canvas>
			<Text id="text-18" editable role="title" size={36} style="position: absolute; left: 60px; top: 50px; width: 600px">Incremental Reveal</Text>
			<Text id="text-19" editable role="subtitle" size={18} muted style="position: absolute; left: 60px; top: 110px; width: 600px">Use Steps to reveal content one piece at a time.</Text>
			<Steps>
				<Text id="text-20" editable size={22} style="position: absolute; left: 60px; top: 200px; width: 600px">First, introduce the concept</Text>
				<Text id="text-21" editable size={22} style="position: absolute; left: 60px; top: 260px; width: 600px">Then, elaborate with details</Text>
				<Text id="text-22" editable size={22} style="position: absolute; left: 60px; top: 320px; width: 600px">Finally, conclude with impact</Text>
			</Steps>
			<Code id="code-4" editable lang="html" style="position: absolute; left: 560px; top: 200px; width: 340px">{`<Steps>
  <Text>Step 1</Text>
  <Text>Step 2</Text>
</Steps>`}</Code>
		</Canvas>
		<Notes id="notes-8" editable>Steps component for incremental reveals.</Notes>
	</Slide>

	<!-- ===== SLIDE 8b: Steps (copy) ===== -->
	<Slide id="slide-8b" editable>
		<Canvas>
			<Text id="text-31" editable role="title" size={36} style="position: absolute; left: 60px; top: 50px; width: 600px">Incremental Reveal</Text>
			<Text id="text-32" editable role="subtitle" size={18} muted style="position: absolute; left: 60px; top: 110px; width: 600px">Use Steps to reveal content one piece at a time.</Text>
			<Steps>
				<Text id="text-33" editable size={22} style="position: absolute; left: 60px; top: 200px; width: 600px">First, introduce the concept</Text>
				<Text id="text-34" editable size={22} style="position: absolute; left: 60px; top: 260px; width: 600px">Then, elaborate with details</Text>
				<Text id="text-35" editable size={22} style="position: absolute; left: 60px; top: 320px; width: 600px">Finally, conclude with impact</Text>
			</Steps>
			<Code id="code-5" editable lang="html" style="position: absolute; left: 560px; top: 200px; width: 340px">{`<Steps>
  <Text>Step 1</Text>
  <Text>Step 2</Text>
</Steps>`}</Code>
		</Canvas>
		<Notes id="notes-11" editable>Steps component for incremental reveals.</Notes>
	</Slide>

	<!-- ===== SLIDE 9: Groups ===== -->
	<Slide id="slide-9" editable>
		<Canvas>
			<Text id="text-23" editable role="title" size={30} style="position: absolute; left: 40px; top: 30px; width: 880px">Groups</Text>
			<Text id="text-24" editable role="subtitle" size={16} muted style="position: absolute; left: 40px; top: 80px; width: 700px">A minimal container — cluster elements that move together.</Text>
			<Group id="group-1" editable role="body" style="position: absolute; left: 40px; top: 140px; width: 880px; height: 350px">
				<Text id="text-25" editable size={14} muted style="position: absolute; left: 0px; top: 0px; width: 400px">Groups let you cluster elements that move together.</Text>
				<Text id="text-26" editable size={14} muted style="position: absolute; left: 0px; top: 40px; width: 400px">Drag the group to reposition all children at once.</Text>
			</Group>
		</Canvas>
		<Notes id="notes-9" editable>Group component demo.</Notes>
	</Slide>

	<!-- ===== SLIDE 10: Closing ===== -->
	<Slide id="slide-10" editable transition="scale">
		<Canvas>
			<Text id="text-27" editable role="title" size={36} align="center" style="position: absolute; left: 130px; top: 160px; width: 700px">Canvas + Roles + Presets</Text>
			<Text id="text-28" editable role="subtitle" size={18} muted align="center" style="position: absolute; left: 130px; top: 230px; width: 700px">No layout components — just data-driven positioning</Text>
			<Text id="text-29" editable size={18} muted align="center" style="position: absolute; left: 130px; top: 280px; width: 700px">default, dark, minimal, academic, corporate, vibrant, monochrome</Text>
			<Text id="text-30" editable size={14} muted align="center" style="position: absolute; left: 280px; top: 340px; width: 400px">Press ← to go back</Text>
		</Canvas>
		<Notes id="notes-10" editable>Wrap up — Canvas + roles replace layout components.</Notes>
	</Slide>
</Deck>
