
# Nova — Developer User Guide (English)

This is a developer-focused guide for contributors who want to understand, develop, debug and package the Nova plugin for Obsidian. It's concise, pragmatic and oriented for hackers and devs. It documents architecture, the grid engine, widget system, runtime flows, data migration, dev/build steps, settings, keyboard shortcuts and debugging tips.

Table of contents

- Overview
- Key files and entry points
- Runtime flow
- Grid engine (gridEngine)
- Widgets: architecture and templates
- Obsidget integration (third-party widgets)
- Data model and migration
- Settings and configurable options
- Keyboard shortcuts and input modes
- Development, build and packaging
- Tests, linting and quality
- Debugging and diagnostics
- Release & CI
- Contributing / PR checklist
- Appendix: commands and quick references

## Overview

Nova is an Obsidian plugin that provides a workspace UI made of widgets arranged on a fixed logical grid. Core idea: positions and sizes are stored in logical units (x, y, cols, rows) that are resolution-independent — only the pixel cell size changes on viewport resize.

Design goals

- stable, deterministic placement of widgets (no reflow)
- fine granularity (default logical grid 36×36)
- support for built-in widgets (defaults) and third-party Obsidgets
- automatic migration for legacy data formats

## Key files and entry points

- `main.ts` — plugin bootstrap. Handles load/unload and initial state.
- `view.tsx` — main React view for the Nova panel.
- `src/components/*` — UI components (Desktop, Dock, Taskbar, WindowFrame, WebViewWindow, FinderView, etc.).
- `src/components/Widgets/WidgetRunner.tsx` — host for built-in widgets.
- `src/components/Widgets/ObsidgetWidgetRunner.tsx` — adapter for Obsidget widgets.
- `src/components/Widgets/templates.ts` — widget templates and helpers.
- `src/components/Widgets/defaults/*` — bundled widgets (QuickNote, VideoWidget, pomodoro, etc.).
- `src/services/gridEngine.ts` — conversions logical⇄px, computeGridMetrics, migration helpers.
- `src/services/bridge.ts` — communication helpers between UI and backend if used.
- `src/types.ts` — shared TypeScript types (widget spec, size spec, item model, etc.).
- `manifest.json` — Obsidian plugin metadata.
- `package.json`, `esbuild.config.mjs`, `tailwind.config.cjs` — build and tooling.

Also read `GRID_STANDARD.md` for the canonical spec of the logical grid.

## Runtime flow

1. Obsidian loads the plugin and calls the exported lifecycle (via `main.js` / `main.ts`).
2. `main.ts` reads persisted state, initializes services, and mounts the Nova view panel (`view.tsx`).
3. `view.tsx` calls `gridEngine.computeGridMetrics(viewportWidthPx, viewportHeightPx, widgetScale)` to calculate the pixel cell size and grid layout.
4. Widgets are instantiated by `WidgetRunner` (built-ins) or `ObsidgetWidgetRunner` (third-party). Logical properties `x, y, cols, rows` are converted to pixel sizes for rendering.
5. User interactions (drag, resize, open, close) update the model in logical units and persist data. Saves write `dataVersion: 3`.

Note: the logical grid size (default 36×36) is central — changing it requires migration and careful testing.

## Grid engine (gridEngine)

File: `src/services/gridEngine.ts`

Responsibilities

- compute grid metrics for the viewport (cellSizePx, gapPx, totalWidthPx/HeightPx)
- convert px → logical units (cols/rows) and logical units → px
- detect items that need migration (`needsMigration(item)`) and run `migrateItemToLogicalGrid(item)`

Key API (refer to the file for exact signatures)


-- `computeGridMetrics(viewportWidthPx, viewportHeightPx, widgetScale)` → { cellSizePx, gridCols, gridRows, gapColPx, gapRowPx, totalWidthPx, totalHeightPx }
-- `pxToLogical(widthPx, heightPx, cellSizePx, gapColPx, gapRowPx)` → { cols, rows }
-- `logicalToPx(cols, rows, cellSizePx, gapColPx, gapRowPx)` → { widthPx, heightPx }
-- `needsMigration(item)` → boolean
-- `migrateItemToLogicalGrid(item)` → mutated item with coords within logical grid bounds

Behavior notes

- Conversions take the inter-cell gap into account and apply a consistent rounding policy. Check the function for rounding strategy.
- `computeGridMetrics` computes the largest cell size that lets a reference tile (24×24) fit the viewport — see `GRID_STANDARD.md`.

## Widgets: architecture and templates

Widget types

- Built-in defaults: TSX components under `src/components/Widgets/defaults/`.
- Obsidgets: third-party widgets loaded via `ObsidgetWidgetRunner` and normalized to Nova's contract.

Widget contract (summary)

- Input: props { id, x, y, cols, rows, data, config }
- Output: events (onResize, onMove, onAction) — the runner updates global state and persists changes.

WidgetSizeSpec / templates

- fields: `defaultCols`, `defaultRows`, `minCols`, `minRows`, `maxCols`, `maxRows`, `resizeMode` ('free' | 'preserveAspect' | 'fixed').

- Nova templates use `cols` and `rows` (eg. 2×2). On add they are converted to logical units with `(template.cols ?? 3) * (LOGICAL_GRID_COLS / 6)` producing values in the 8..36 range on a 36×36 grid.

How to add a widget (quick)

1. Create a TSX component in `src/components/Widgets/defaults/`.
2. Export a template in `templates.ts` and optionally register it in `defaultsRegistry.ts`.
3. Add types in `src/types.ts` if the widget exposes a custom props contract.

Drag & resize

- UI handlers output sizes in logical units (or px for Obsidgets). `WidgetRunner` calls `pxToLogical` when needed and clamps sizes to `min/max` bounds.

## Obsidget integration (third-party widgets)

Obsidget widgets may provide `defaultSizePx`. Nova currDrag & resize
ently assigns default cols/rows (e.g. 2×2) and converts them to logical units on add. Recommended improvement: call `pxToLogical(defaultSizePx, ...)` at add-time using the current `cellSizePx` to derive cols/rows more accurately.

Security

- Treat third-party Obsidgets as untrusted: avoid eval / remote code execution and sandbox any dynamic content. Limit file system or host API access.

## Data model and migration

Item shape (summary)

- `id: string`
- `x, y: number` (1..LOGICAL_GRID_COLS/ROWS)
- `cols, rows: number` (1..LOGICAL_GRID_COLS/ROWS)
- `type/template: string`
- `data: object` (widget-specific)
- `dataVersion: number`

Data versions

- `< 2`: legacy data (small unit grid 1–4)
- `2`: old grid units (example 32×40)

- `>= 3`: logical grid (24×24 or 36×36 depending on `LOGICAL_GRID_*`) — target version

Migration flow

- On load, call `needsMigration(item)` for each item. If true, apply `migrateItemToLogicalGrid(item)` to scale coords and sizes into 1..36 while preserving proportions.
- After migration, save `dataVersion: 3`.

Practical advice

- Test migration with a realistic dataset and verify no collisions after proportional scaling.

## Settings and configurable options

Settings are exposed in the plugin settings panel (Obsidian). Key options developers and power users should know about:

- Grid configuration
  - Logical grid size: `LOGICAL_GRID_COLS` / `LOGICAL_GRID_ROWS` (default 36). Changing this requires migration.
  - `widgetScale`: UI scale multiplier applied to computed cell size.

- Widget defaults
  - default template sizes for new widgets (cols/rows)
  - default `resizeMode` for templates

- Obsidget behavior
  - `useDefaultSizePx`: when true, Nova will attempt to derive logical cols/rows from an Obsidget's `defaultSizePx` using `pxToLogical`.

- Shortcuts & input
  - Primary edit key (configurable): which modifier toggles or enables edit mode (default: `Alt`). See next section.

- Debug / dev options
  - Verbose logging: log grid metrics and conversions to console.
  - Force migration: apply migration utility on load (dev-only).

**Where to change:** Most settings are wired through the plugin settings UI and persisted alongside plugin data. Inspect `main.ts` for settings load/save; types are in `src/types.ts`.

## Keyboard shortcuts and input modes

This section documents the default keyboard shortcuts and how edit modes behave. Shortcuts can be configured in Obsidian's hotkey settings or in the plugin settings where supported.

Default shortcuts (developer-focused list)

- Toggle Nova panel: (Obsidian command) — configurable in Obsidian commands.
- Add default widget: `Ctrl+Shift+A` (example; define command in `main.ts` and expose to Obsidian command palette).
- Remove focused widget: `Delete` when a widget is focused.
- Toggle widget dev overlay: `Ctrl+Shift+D` (prints widget metrics to console).

Configurable primary modifier

- The plugin exposes a setting "Primary edit modifier" (default `Alt`). This modifier affects interaction modes described below. You can change it to `Ctrl` or `Meta` depending on preference.

Edit modes (important)

- Normal mode (no modifier): pointer interactions perform the default action for a widget (click to open/activate, drag to move if enabled by the widget).

- Edit mode (press configured modifier): while the configured modifier key is held, Nova enters edit mode where drag/resize handles are exposed and direct manipulation changes `x,y,cols,rows` in logical units. This mode is transient (active while the key is pressed).

- Toggle edit mode (optional): some users prefer a toggle instead of hold. The plugin exposes a setting to toggle edit mode on/off with a command (bindable in Obsidian). When toggled on, the UI stays in edit mode until toggled off.

- Alt-hold edit behavior (hold-Alt to edit)

- When the primary modifier is set to `Alt` (default), holding `Alt` enters a precision edit mode: movement snaps to smaller increments (sub-grid) or temporarily reduces `cellSizePx` scaling so small adjustments are possible. This is useful for micro-positioning widgets.

**Implementation notes:** The runner listens for global keydown/keyup events to toggle the transient edit mode and updates component state. Remove listeners on unmount. Expose commands to toggle edit mode in the command palette and provide a visible indicator when in edit mode.

## Development, build and packaging

Prerequisites

- Node.js LTS
- npm (or pnpm)

Install

```cmd
cd h:\Infinition\.obsidian\plugins\obsidian-nova
npm install
```

Common scripts (check `package.json`)

```cmd
npm run dev
npm run build
npm run lint
```

Building for Obsidian

- The production build produces `main.js` referenced by `manifest.json`. For a release:

  1. bump the version in `manifest.json` and `package.json`.
  2. run `npm run build`.
  3. tag the release and publish (CI can automate this via `.github/workflows/release.yml`).

Hot reload

- Use `npm run dev` or esbuild/watch. Reload the plugin in Obsidian's developer mode to pick up new JS.

Packaging

- Release payload: `manifest.json`, `main.js`, and required assets. The workflow `/.github/workflows/release.yml` can automate packaging and publishing.

## Tests, linting and quality

Current state

- No dedicated `test/` folder detected. Adding unit tests for `gridEngine` and migration helpers is high priority.

Recommended minimal tests

- `computeGridMetrics` (small / large viewport cases)
- `pxToLogical` / `logicalToPx` (rounding and boundary cases)
- `migrateItemToLogicalGrid` (scaling correctness and collisions)

Suggested test stack

- Vitest (fast) + minimal fixtures. Add scripts to `package.json`: `test`, `test:watch`.

Linting

- Add ESLint + Prettier rules tailored for the codebase and enable TypeScript strict mode in `tsconfig.json`.

## Debugging and diagnostics

Logging

- Add `console.debug/info/warn/error` logs in `main.ts`, `gridEngine.ts`, and `WidgetRunner` to trace lifecycle and conversions. Control verbosity via a settings flag.

Quick diagnostics

- Wrong grid metrics: open DevTools and inspect the result of `computeGridMetrics(...)`.
- Disappearing widgets: inspect `cols/rows` and `x,y` values and check `dataVersion` and migration logic.

Dev helpers

- Temporary utility: script to force-migrate all items and save them (useful during migration development).
- Expose a command that prints current grid metrics and a list of active widget bounds to the console.

Performance tips

- Debounce resize events and avoid heavy computations in render paths. Keep `computeGridMetrics` cheap; cache results between renders when the viewport size hasn't changed.

## Release & CI

- Workflows live in `.github/workflows/`. `release.yml` automates build and publish. Follow semver for tags.

Release checklist

- bump version in `manifest.json` and `package.json`
- run `npm run build`
- verify `main.js` is updated
- tag & push / create GitHub release

## Contributing / PR checklist

- Small PRs: describe intent, add unit tests, and update CHANGELOG if the public API changes.
- Breaking changes: document migration steps, include automatic migration code and migration notes.

Minimum PR checks

- local build succeeds
- unit tests for modified logic
- TypeScript compiles without errors
- no unintended edits to `manifest.json`/`main.js`

## Appendix: commands and quick references

Commands (Windows cmd)

```cmd
cd h:\Infinition\.obsidian\plugins\obsidian-nova
npm install
npm run dev
npm run build
```

Quick file references

- `GRID_STANDARD.md` — logical grid specification
- `src/services/gridEngine.ts` — conversions and migration helpers
- `src/components/Widgets/WidgetRunner.tsx` — widget lifecycle
- `src/components/Widgets/ObsidgetWidgetRunner.tsx` — third-party widget adapter
- `src/components/Widgets/defaults/` — bundled widget examples

**Contact:** Open an issue for bugs or a PR for improvements. For migration-sensitive changes, include tests and migration notes.
