# Obsidian Nova

Obsidian Nova converts an Obsidian vault into a small desktop/dashboard environment. It provides a widget-driven, multi-page workspace with a dock, movable windows, a Finder-like file browser and support for both plain HTML/CSS/JS widgets and Obsidget-compatible templates.


---

## Key features (implemented)

- Desktop grid: place apps, folders and widgets on a grid with x/y coordinates and resizable widgets.
- Multi-directional pages: swipe and navigate pages both horizontally and vertically (2D page canvas).
- Dock: pin apps/widgets to a dock; dock shows running/open items.
- Finder: integrated file browser with grid/list views, previews (images & markdown snippets), drag & drop and file operations (open, move, delete, copy/paste).
- Window system: draggable/resizable windows with minimize/maximize/close controls and z-index management.
- WebView windows: embedded iframe browser with address bar, back/forward, reload, favorites and the ability to add current URL as a desktop item.
- Widgets system:
	- Runner widgets (HTML/CSS/JS executed in a scoped container)
	- React widgets (built-in React components)
	- Obsidget-compatible widgets (rendered in shadow DOM and given a friendly API to interact with the vault)
- Built-in widgets (examples shipped): clock, quick-note, todo, calculator, kanban, pomodoro, breath, games (2048, chifoumi), BTC ticker, mini IDE, ping/radar, system meter, hydration, coffee counter, kanban, and more (see `src/components/Widgets/templates.ts`).
- Persistence: layout, windows and widget state are saved via the plugin data API (per vault).
- Vault integration: API wrappers for listing files/folders, read/write files, create/delete/move files, open files in new leaves, read/update frontmatter, and get resource paths.
- Obsidget integration: if the `obsidian-obsidget` plugin is present, the plugin can load obsidget gallery widgets and reuse obsidget settings such as maximum width units.
- Widget state API: widgets can persist their own state via the provided API (`api.saveWidgetState`, `api.loadWidgetState`) and obsidget widgets can read/update widget JSON stored inside markdown blocks.
- Themes & wallpapers: multiple themes (dark, light, cyberpunk, forest) and wallpapers (images and videos) with a boomerang video option.

---

## Screenshots

Add screenshots or animated GIFs showing:
- Desktop with multiple widgets
- Widget gallery
- Finder view and WebView window with favorites

Example filenames to include in the repo:
- `screenshot-desktop.png`
- `screenshot-widget-gallery.gif`

---

## Install

Option A — Community Plugins
1. Publish the plugin (or install from Community Plugins when available).
2. Settings → Community plugins → Browse → search for "Obsidian Nova".

Option B — Manual install (local / development)
1. Copy this plugin folder into your vault: `.obsidian/plugins/obsidian-nova` (folder name must match the intended plugin id for manual installs).
2. Reload Obsidian and enable the plugin in Settings → Community plugins.

Notes:
- If you rename the folder, ensure `manifest.json` contains a matching `id`/`name` (see "Naming & release" below).

---

## Usage / Quick start

- Open the plugin via the ribbon icon or the command palette (command: "Open Obsidian WebOS").
- Desktop interactions:
	- Long-press / right-click on background to enter edit mode or add widgets.
	- Drag an item to reposition; drag to the dock to pin; drag to the trash to remove.
	- Resize widgets/windows using the resize handle.
- Pages:
	- Swipe / drag to move between pages horizontally and vertically.
	- Pages are organized as a 2D grid — you can create multiple pages and place items by coordinates.
- Finder & files:
	- Open images inline or open markdown files in new leaves.
	- Drag files onto folders in the Finder to move them within the vault.
- WebView windows:
	- Use the address bar, add favorites, and add the current page as a desktop app/widget.

---

## Widgets & templates

- Widgets ship as either:
	- Runner widgets: inject HTML/CSS/JS into a scoped container and supply a cleanup via `container._cleanup`.
	- React widgets: React components included in `src/components/Widgets/` (e.g. `QuickNoteWidget`, `TodoWidget`).
	- Obsidget widgets: run inside a shadow DOM and use a small API proxy to interact with the vault and frontmatter.
- Widgets can save state through the plugin (`saveWidgetState` / `loadWidgetState`) or obsidget-linked blocks.
- See `src/components/Widgets/templates.ts` for shipped templates and example widget implementations.

---

## Developer setup

Requirements:
- Node.js (LTS, e.g. >=16)
- npm (or pnpm)

From the plugin root directory (Windows cmd.exe):

```bat
cd H:\Infinition\.obsidian\plugins\obsidian-webos2
npm ci
npm run dev   REM watch/build during development
npm run build REM production build
```

Notes:
- The build is configured with `esbuild` (`esbuild.config.mjs`) and the output is expected to generate `main.js`.
- `manifest.json` and `styles.css` are required at packaging time.

---

## Testing locally in Obsidian

1. Run `npm run build` and verify `main.js` is produced in the plugin root.
2. Make sure `manifest.json` and `styles.css` are present at the root of the plugin folder.
3. In your vault, enable Community Plugins and enable the plugin.

---

## Release & GitHub Actions notes

- There is a `release.yml` workflow at `.github/workflows/release.yml` that:
	- runs on tag push,
	- installs Node, runs the build, checks for `main.js` and `styles.css`, prepares a `release/` folder and zips the release,
	- creates a GitHub Release and attaches assets.
- Current workflow points to names like `obsidian-obsidget.zip` and lists `obsidian-obsidget.zip` in the release assets. This looks like a copy/paste from another plugin and should be updated to the correct plugin name (for example `obsidian-nova.zip`) to avoid confusion.
- Recommended changes before publishing:
	1. Update `manifest.json` id/name to `obsidian-nova` and `name` to "Obsidian Nova" (or your chosen name).
	2. Update `package.json.name` to `obsidian-nova` for clarity.
	3. Update `.github/workflows/release.yml` to use a consistent zip name and asset list (e.g. `obsidian-nova.zip`).
	4. Run `npm ci` and `npm run build` locally to verify `main.js` is generated.

---

## Files & structure (where to look)

- `src/` — TypeScript + React source code.
	- `src/main.ts` — plugin entry, registers the view and commands.
	- `src/view.tsx` — mounts the React view into Obsidian's leaf.
	- `src/services/bridge.ts` — Obsidian API wrapper used by widgets and UI (file ops, read/write, frontmatter, save/load state).
	- `src/components/` — main UI components: `Desktop`, `Dock`, `Taskbar`, `FinderView`, `WindowFrame`, `WebViewWindow`, and `Widgets/`.
	- `src/components/Widgets/` — shipped widgets and `templates.ts` with built-in templates.
- `manifest.json` — plugin manifest required by Obsidian.
- `package.json`, `esbuild.config.mjs`, `tsconfig.json` — build tooling.
- `.github/workflows/release.yml` — release workflow that builds and packages the plugin.

---

## Contributing

- Bug reports, new widget templates, better accessibility, and translations are welcome.
- Suggested workflow:
	1. Fork the repo, create a branch (e.g. `feat/widget-xyz`).
	2. Run the dev build and test locally in a vault.
	3. Open a PR with a short description and screenshots.

---

## License

See the `LICENSE` file included in the repository.

---
