---
name: reslides
description: Create and modify presentations using the reslides Svelte 5 component library
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: describe what you want (e.g. "create deck about Svelte 5", "add slide with code comparison", "change theme of second slide to dark")
---

# /reslides Skill

You help users create and modify slide presentations using the **reslides** package — a Svelte 5 component library for building presentations.

## Rules

1. **Svelte 5 + Vite only.** This skill only works inside a Svelte 5 project built with Vite. If no project is detected (no `svelte.config.js` or `vite.config.*`), scaffold one first and install `reslides` before proceeding.
2. **Use reslides components as structural building blocks.** Always import `Deck`, `Slide`, `Canvas`, `Step`/`Steps` from `'reslides'`. Never replace them with plain HTML or custom Svelte components.
3. **Use `Text` instead of raw HTML text elements.** Never use `<h1>`–`<h6>`, `<p>`, or `<span>` directly. Use `<Text>` with the `size` prop (number in px) to control font size and `style` prop for additional styling like color or font-weight. Inline elements (`<code>`, `<strong>`, `<em>`) are fine inside `<Text>`.
4. **HTML and other Svelte components go inside reslides components** as content, never as siblings or replacements.
5. **One Deck per presentation file.** A presentation has exactly one `<Deck>` containing multiple `<Slide>` components.
6. **Slides are referenced by ordinal position** (first, second, third...) or by a user-given name.
7. **Validate property values** against the API reference below before applying changes. Warn the user and list valid options if a value is invalid.
8. **Always add an `id` to every component.** Every reslides component (`Slide`, `Text`, `Code`, `List`, `Steps`, `Step`, `Canvas`, `Notes`, `Deck`) must have an `id` prop.
9. **Component IDs follow `{component}-{number}` convention.** Unless the user specifies a custom id, always use the pattern `{component name}-{number}` (e.g. `text-1`, `slide-2`, `code-3`). Number sequentially across the entire deck. Every id must be unique across the whole project — never reuse an id.
10. **Always add `editable` to editable components.** The following components must always have the `editable` prop set: `Slide`, `Background`, `Text`, `Group`, `Code`, `Image`, `List`, `Notes`.
11. **Only use reslides components as direct children of `Steps` and `Step`.** Raw HTML elements (`<div>`, `<span>`, etc.) inside `Steps`/`Step` do not participate in step animations — they will flash and disappear. Always use reslides components (`Text`, `Code`, `List`, etc.) as direct children. Place any custom HTML markup *inside* those reslides components as inline content.
12. **Every Slide must have a Canvas.** All visible content inside a `<Slide>` goes inside `<Canvas>`. `Notes` is the only component placed outside `<Canvas>` (it is non-visible metadata).
13. **Use `role` prop for semantic identification.** Assign `role="title"`, `role="subtitle"`, or `role="body"` to content components so layout presets can reposition them. Components without a role are left untouched by presets.

## Attribute Syntax Rules

- When writing a numeric value, use expression syntax: `size={22}` not `size="22"`.
- When writing a string value, use double-quote syntax: `align="center"`.
- Never create duplicate attributes on an element — Svelte will throw `attribute_duplicate`.

## Project Setup

When the current directory is not a Svelte 5 + Vite project:

1. Scaffold with: `pnpm create svelte@latest . -- --template minimal`
2. Install dependencies: `pnpm install`
3. Install reslides: `pnpm add reslides`
4. Then proceed with the user's request.

When a project exists but `reslides` is not installed, run `pnpm add reslides` first.

## Modes

Determine the mode from the user's argument:

- **Create deck** — generate a complete presentation file
- **Add slide** — insert a new slide into an existing presentation
- **Modify** — change properties or content of existing components

---

## reslides Public API Reference

### Components

All imported from `'reslides'`:

| Component | Purpose |
|---|---|
| `Deck` | Root presentation container (one per file) |
| `Slide` | Individual slide |
| `Step` | Single-step reveal animation |
| `Steps` | Multi-step reveal (each direct child becomes a step) |
| `Canvas` | Container for all visible content inside a Slide |
| `Text` | Themed text block with size/muted/align options |
| `Image` | Themed image with optional caption |
| `Code` | Themed code block with shiki syntax highlighting |
| `List` | Themed ordered or unordered list |
| `Background` | Full-slide background layer (color, gradient, or children) |
| `Group` | Container for grouping elements that move together |
| `Notes` | Speaker notes (non-visible, placed outside Canvas) |

### Deck Props

```typescript
{
  title?: string;                           // Default: 'Untitled'
  aspectRatio?: number;                     // Default: 16/9
  width?: number;                           // Default: 960
  transition?: TransitionPreset;            // Default: 'none'
  theme?: string;                           // Default: 'default'
  colorScheme?: 'light' | 'dark' | 'auto'; // Default: 'light'
  inspect?: boolean;                        // Default: false — show component outlines + labels
  children: Snippet;                        // Required
}
```

### Slide Props

```typescript
{
  transition?: TransitionPreset;  // Override deck transition
  notes?: string;                 // Speaker notes for presenter view
  theme?: string;                 // Override deck theme
  children: Snippet;              // Required
}
```

### Step / Steps Props

```typescript
// Both accept:
{ children: Snippet; }
```

Step CSS classes: `step-hidden`, `step-active`, `step-prior`.

### Canvas Props

```typescript
{
  id?: string;
  editable?: string | boolean;
  children: Snippet;              // Required — all visible slide content
}
```

Canvas provides `position: relative; width: 100%; height: 100%` as the positioning context for absolute children.

### Content Component Props

| Component | Props |
|---|---|
| `Text` | `size?: number` (px, default `24`), `muted?: boolean` (default `false`), `align?: 'left' \| 'center' \| 'right'` (default `'left'`), `role?: string`, `children: Snippet` |
| `Image` | `src: string`, `alt?: string`, `fit?: 'cover' \| 'contain' \| 'fill'` (default `'contain'`), `caption?: string`, `role?: string` |
| `Code` | `lang?: string`, `theme?: string` (default `'github-dark'`), `showLineNumbers?: boolean`, `hScrollbar?: boolean`, `vScrollbar?: boolean`, `role?: string`, `children: Snippet` |
| `List` | `ordered?: boolean` (default `false`), `role?: string`, `children: Snippet` |
| `Group` | `role?: string`, `children: Snippet` |
| `Background` | `color?: string` (CSS color), `gradient?: string` (CSS gradient), `children?: Snippet`. Always fills slide at z-index 0. Place in Deck for global background, inside Canvas for per-slide override. |

### Role Prop

The `role` prop identifies a component's semantic purpose so layout presets can reposition it. Standard roles:

| Role | Typical Component | Purpose |
|---|---|---|
| `title` | `Text` | Main heading |
| `subtitle` | `Text` | Sub-heading or description |
| `body` | `Text`, `List`, `Code`, `Image`, `Group` | Primary content |
| `body-right` | Any | Secondary content column |
| `number` | `Text` | Large featured number |
| `caption` | `Text` | Small caption text |

Custom role strings are allowed. Components without a role are ignored by preset application.

### Layout Presets

Layout presets are data objects (not components) that map roles to positions on a 960×540 slide. Available presets:

| Preset ID | Name | Roles |
|---|---|---|
| `title-slide` | Title Slide | title, subtitle |
| `section-header` | Section Header | title |
| `title-content` | Title + Content | title, body |
| `title-two-cols` | Title + Two Columns | title, body, body-right |
| `title-only` | Title Only | title |
| `one-column` | One Column | title, subtitle, body |
| `main-point` | Main Point | title, body |
| `section-description` | Section + Description | title, subtitle, body |
| `caption` | Caption | body, caption |
| `big-number` | Big Number | number, body |
| `blank` | Blank | (none) |

Presets are applied via the editor UI (Layouts tab in the right panel). They reposition elements with matching `data-edit-role` attributes.

```typescript
import { layoutPresets, getPresetById } from 'reslides';
import type { LayoutPreset, RoleLayout } from 'reslides';
```

### Code Component Rules

Code content is placed as **children**, not as an attribute. Wrap content in a template literal expression (`` {`...`} ``) when it contains characters that Svelte would parse as syntax:

- **Curly braces** (`{`, `}`) — e.g. Mermaid diamond nodes `C{Decision}`, JS objects `{ key: val }`
- **HTML tags** (`<`, `>`) — e.g. `<div>`, `<h1>`
- **Svelte syntax** — `{#if}`, `{#each}`, `{@html}`

```svelte
<!-- Plain text: no wrapping needed -->
<Code lang="js">const x = 1;</Code>

<!-- Contains curly braces or HTML: must use template literal -->
<Code lang="html">{`<div class="foo">Hello</div>`}</Code>
<Code lang="mermaid">{`graph TD; A --> B{Decision}`}</Code>
```

When `lang="mermaid"` and the `mermaid` npm package is installed, the component renders an SVG diagram instead of code text. If mermaid is not installed, it falls back to plain text.

### Themes

Valid theme names: `default`, `dark`, `minimal`, `academic`, `corporate`, `vibrant`, `monochrome`

Import theme CSS: `import 'reslides/themes/<name>.css';`

### Transitions

Valid values for `transition` prop: `'none'`, `'fade'`, `'slide'`, `'scale'`

### Color Schemes

Valid values for `colorScheme` prop: `'light'`, `'dark'`, `'auto'`

### Context Functions

```typescript
import { getDeckContext, getSlideContext } from 'reslides';
```

- `getDeckContext()` — access `currentSlide`, `totalSlides`, `next()`, `prev()`, `goTo(index)`, `openPresenter()`, `toggleOverview()`
- `getSlideContext()` — access `currentStep`, `totalSteps`

### CSS Custom Properties (available in all themes)

```
--font-sans, --font-mono, --font-heading
--slide-bg, --surface-color, --surface-hover
--text-color, --text-muted, --heading-color
--border-color, --accent-color
--code-bg, --code-color
--slide-padding (default: 2rem), --radius (default: 4px)
```

---

## Slide Structure

Every slide follows this structure:

```svelte
<Slide id="slide-1" editable>
  <Canvas>
    <Background id="bg-1" editable color="#1a1a2e" />
    <Text id="text-1" editable role="title" size={36}>Title</Text>
    <Text id="text-2" editable role="subtitle" size={18} muted>Subtitle</Text>
    <List id="list-1" editable role="body">
      <li>Item 1</li>
    </List>
  </Canvas>
  <Notes id="notes-1" editable>Speaker notes here.</Notes>
</Slide>
```

Key points:
- `Canvas` wraps all visible content
- `Background` goes inside `Canvas` for per-slide backgrounds
- `Notes` goes outside `Canvas` (non-visible metadata)
- Content components use `role` for semantic identification
- All elements use absolute positioning within the Canvas

## Mode: Create Deck

Generate a `.svelte` file with this structure:

```svelte
<script>
  import { Deck, Slide, Canvas, Text, List, Code, Image, Background, Notes } from 'reslides';
  import 'reslides/themes/<theme>.css';
</script>

<Deck title="Presentation Title" theme="<theme>" transition="fade">
  <Slide id="slide-1" editable>
    <Canvas>
      <Text id="text-1" editable role="title" size={48} align="center"
        style="position: absolute; left: 130px; top: 170px; width: 700px">Title</Text>
      <Text id="text-2" editable role="subtitle" size={20} muted align="center"
        style="position: absolute; left: 180px; top: 260px; width: 600px">Subtitle</Text>
    </Canvas>
    <Notes id="notes-1" editable>Speaker notes for this slide</Notes>
  </Slide>

  <Slide id="slide-2" editable>
    <Canvas>
      <Text id="text-3" editable role="title" size={36}
        style="position: absolute; left: 60px; top: 40px; width: 840px">Slide Title</Text>
      <Text id="text-4" editable role="body"
        style="position: absolute; left: 60px; top: 120px; width: 840px">Content</Text>
    </Canvas>
    <Notes id="notes-2" editable>Speaker notes</Notes>
  </Slide>
</Deck>
```

Guidelines:
- Choose a theme that fits the topic. Default to `default` if unclear.
- Use `transition="fade"` unless the user specifies otherwise.
- Use layout presets as a guide for positioning (refer to the presets table above).
- Always include `Notes` on every slide with speaker talking points.
- If the user provides a script/outline file path, read it first and structure slides to match.

## Mode: Add Slide

1. Read the existing presentation file.
2. Identify where to insert (end by default, or at a position/name specified by the user).
3. Use an appropriate preset's positions as a guide for placing content.
4. Insert a `<Slide>` block with `<Canvas>`, content components with roles, and `<Notes>`.
5. Ensure all IDs are unique across the deck.

## Mode: Modify

1. Read the existing presentation file.
2. Identify the target component by ordinal position (first, second, third...) or user-given name.
3. Identify the correct property from the API reference above.
4. **Validate the value:**
   - `theme` must be one of: `default`, `dark`, `minimal`, `academic`, `corporate`, `vibrant`, `monochrome`
   - `transition` must be one of: `none`, `fade`, `slide`, `scale`
   - `colorScheme` must be one of: `light`, `dark`, `auto`
5. If the value is invalid, **do not apply it**. Warn the user and list the valid options.
6. Apply the change to the correct component.
