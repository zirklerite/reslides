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
2. **Use reslides components as structural building blocks.** Always import `Deck`, `Slide`, layouts, `Step`/`Steps` from `'reslides'`. Never replace them with plain HTML or custom Svelte components.
3. **HTML and other Svelte components go inside reslides components** as content, never as siblings or replacements.
4. **One Deck per presentation file.** A presentation has exactly one `<Deck>` containing multiple `<Slide>` components.
5. **Slides are referenced by ordinal position** (first, second, third...) or by a user-given name.
6. **Validate property values** against the API reference below before applying changes. Warn the user and list valid options if a value is invalid.

## Project Setup

When the current directory is not a Svelte 5 + Vite project:

1. Scaffold with: `npm create svelte@latest . -- --template minimal`
2. Install dependencies: `npm install`
3. Install reslides: `npm install reslides`
4. Then proceed with the user's request.

When a project exists but `reslides` is not installed, run `npm install reslides` first.

## Modes

Determine the mode from the user's argument:

- **Create deck** — generate a complete presentation file
- **Add slide** — insert a new slide into an existing presentation
- **Add layout** — create a custom layout component
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
| `DefaultLayout` | Standard centered layout with padding |
| `CenterLayout` | Fully centered content (horizontal + vertical) |
| `CoverLayout` | Full-screen background cover with centered text |
| `TwoColsLayout` | 50/50 two-column split |
| `ImageLayout` | Full-screen image with optional overlay content |
| `SectionLayout` | Section header with left border accent |
| `FullLayout` | Full-screen unpadded layout |

### Deck Props

```typescript
{
  title?: string;                           // Default: 'Untitled'
  aspectRatio?: number;                     // Default: 16/9
  width?: number;                           // Default: 960
  transition?: TransitionPreset;            // Default: 'none'
  theme?: string;                           // Default: 'default'
  colorScheme?: 'light' | 'dark' | 'auto'; // Default: 'light'
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

### Layout Props

| Layout | Props |
|---|---|
| `DefaultLayout` | `children: Snippet` |
| `CenterLayout` | `children: Snippet` |
| `CoverLayout` | `bg?: string` (default: `var(--accent-color)`), `children: Snippet` |
| `TwoColsLayout` | `left: Snippet`, `right: Snippet` |
| `ImageLayout` | `src: string`, `children?: Snippet` (overlay) |
| `SectionLayout` | `children: Snippet` |
| `FullLayout` | `children: Snippet` |

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

## Mode: Create Deck

Generate a `.svelte` file with this structure:

```svelte
<script>
  import { Deck, Slide, CoverLayout, DefaultLayout, /* other layouts as needed */ } from 'reslides';
  import 'reslides/themes/<theme>.css';
</script>

<Deck title="Presentation Title" theme="<theme>" transition="fade">
  <Slide notes="Speaker notes for this slide">
    <CoverLayout>
      <h1>Title</h1>
      <p>Subtitle</p>
    </CoverLayout>
  </Slide>

  <Slide notes="Speaker notes">
    <DefaultLayout>
      <!-- content -->
    </DefaultLayout>
  </Slide>

  <!-- more slides -->
</Deck>
```

Guidelines:
- Choose a theme that fits the topic. Default to `default` if unclear.
- Use `transition="fade"` unless the user specifies otherwise.
- Pick the most appropriate layout for each slide's content.
- Always include `notes` on every slide with speaker talking points.
- If the user provides a script/outline file path, read it first and structure slides to match.

## Mode: Add Slide

1. Read the existing presentation file.
2. Identify where to insert (end by default, or at a position/name specified by the user).
3. Choose an appropriate layout based on the content description.
4. Insert a `<Slide>` block with layout, content, and speaker notes.
5. Add any new layout imports if needed.

## Mode: Add Layout

Create a new `.svelte` layout component following reslides conventions:

- Accept `children` snippet (and optional named snippets like `left`, `right`, `header`, `footer`).
- Use CSS grid or flexbox for positioning.
- Reference CSS custom properties (`var(--text-color)`, `var(--slide-padding)`, etc.) for theming.
- Structure as a Svelte 5 component with `{@render children()}` for snippet rendering.

Example skeleton:

```svelte
<script>
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="layout-custom">
  {@render children()}
</div>

<style>
  .layout-custom {
    width: 100%;
    height: 100%;
    display: grid;
    padding: var(--slide-padding);
    color: var(--text-color);
  }
</style>
```

## Mode: Modify

1. Read the existing presentation file.
2. Identify the target component by ordinal position (first, second, third...) or user-given name.
3. Identify the correct property from the API reference above.
4. **Validate the value:**
   - `theme` must be one of: `default`, `dark`, `minimal`, `academic`, `corporate`, `vibrant`, `monochrome`
   - `transition` must be one of: `none`, `fade`, `slide`, `scale`
   - `colorScheme` must be one of: `light`, `dark`, `auto`
   - `bg` on CoverLayout: any valid CSS color
   - `src` on ImageLayout: a valid URL or path
5. If the value is invalid, **do not apply it**. Warn the user and list the valid options.
6. Apply the change to the correct component.
