# reslides

A Svelte 5 presentation framework with AI-assisted authoring. Write slides in Svelte markup, edit them visually with a live editor, and let AI help create and modify presentations through natural language.

## Installation

```bash
npx create-reslides@latest my-presentation
cd my-presentation
```

Add the `/reslides` skill for [Claude Code](https://docs.anthropic.com/en/docs/claude-code):

```bash
claude skill add --from https://github.com/zirklerite/reslides
```

Start the dev server:

```bash
pnpm dev
```

Open `http://localhost:5173` to view, or append `?editor` for the live editor.

## Usage

Use the `/reslides` skill in Claude Code to create and modify presentations through natural language:

```
/reslides create a deck about machine learning with 5 slides
/reslides add a slide with a code comparison between Python and Rust
```

## Components

| Component | Description |
|---|---|
| `Deck` | Root container — manages navigation, themes, transitions |
| `Slide` | Individual slide |
| `Canvas` | Positioning context for slide content |
| `Text` | Themed text block with size, alignment, muted options |
| `Image` | Themed image with cover/contain/fill and optional caption |
| `Code` | Syntax-highlighted code (Shiki) or Mermaid diagrams |
| `List` | Ordered or unordered list |
| `Background` | Full-slide background (color, gradient, or custom content) |
| `Step` | Single-step reveal wrapper |
| `Steps` | Multi-child sequential reveal |
| `Group` | Absolute-positioned container for clustering elements |
| `Notes` | Speaker notes (visible in presenter mode) |

## Live Editor

The live editor is pre-configured when you scaffold with `npx create-reslides`. Open `/?editor` to use it. Components created via the `/reslides` skill automatically include the `editable` and `id` props required for visual editing. The editor supports drag-to-move, resize, text editing, property editing, slide reorder, multi-select, grouping, alignment guides, and undo/redo — all writing directly back to your source files.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Arrow keys / Space | Navigate slides |
| `o` | Toggle overview |
| `d` | Toggle drawing |
| `Ctrl+Shift+P` | Open presenter mode |
| `i` | Toggle inspect mode (editor) |

## URLs

| URL | Mode |
|---|---|
| `/` | Presentation player |
| `/?editor` | Live visual editor |
| `/?presenter` | Presenter view |

## License

MIT
