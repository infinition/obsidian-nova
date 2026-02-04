<img width="138" height="134" alt="logo" src="https://github.com/user-attachments/assets/12a49e1a-47d8-47a6-b40e-784c6d2e56e4" />

# Obsidian Nova

A desktop-style interface for Obsidian: grid-based layout, widgets, apps, multiple pages, and full keyboard control. Built for power users who want a hacker-friendly dashboard inside their vault.

**Plugin ID:** `obsidian-nova`

- **Repository:** [github.com/infinition/obsidian-nova](https://github.com/infinition/obsidian-nova)
- **ObsidGet** (for imported widgets): [github.com/infinition/obsidian-obsidget](https://github.com/infinition/obsidian-obsidget)

---

## Features

- **Desktop view** — Wallpaper, taskbar, dock. Place widgets and apps on a configurable grid.
- **Multiple pages** — Swipe or use arrow keys to switch pages. Optional page names and atlas (grid of pages).
- **Local widgets** — Built-in widgets: Clock, Quick Note, Mini MD (markdown editor with preview), Pomodoro, 2048, Snake, Tic-Tac-Toe, Chess AI, Calculator, System info, BTC ticker, Ping, Video, YouTube, IDE. All run inside Nova; no external runtime.
- **ObsidGet widgets** — Import widgets from the [ObsidGet](https://github.com/infinition/obsidian-obsidget) plugin (gallery). Kanban, Code Garden, Tamagotchi, etc. Local widgets and ObsidGet widgets are clearly separated in the Widget Gallery (tabs: **All** | **Nova** | **ObsidGet**).
- **Apps** — **Finder** (vault file browser, open notes), **Web** (in-app browser). Both open in panes or fullscreen.
- **Grid engine** — Logical grid (default 36×36, configurable 12–64). Drag to move, resize from bottom-right handle. Widgets can auto-grow when content changes (ObsidGet: optional `allowGrowBeyondTemplate` per widget).
- **Themes** — Dark, Light, Obsidian (native CSS vars), Cyberpunk, Forest.
- **Persistence** — Layout, config, and widget state saved in Obsidian’s plugin data.

---

## Installation

1. (Optional) Install **[ObsidGet](https://github.com/infinition/obsidian-obsidget)** from the community plugins if you want to use widgets from its gallery.
2. Install **Nova** from the community plugins or from **[github.com/infinition/obsidian-nova](https://github.com/infinition/obsidian-nova)** (copy `main.js`, `manifest.json`, `styles.css` into `.obsidian/plugins/obsidian-nova/`).
3. Enable both in Settings → Community plugins.
4. Use the ribbon icon (monitor) or the command **Open Nova** to open the Nova view.

---

## Keyboard Shortcuts

### Global (Nova view focused)

| Key | Action |
|-----|--------|
| **Tab** | Toggle page atlas (grid of pages). |
| **Arrow keys** | Change page: Left/Right = previous/next page; Up/Down = previous/next page (if vertical swipe not locked). |
| **Page Up** | Increase grid density **or** widget/icon scale (see Settings). |
| **Page Down** | Decrease grid density **or** widget/icon scale. |
| **Home** | Increase UI scale (taskbar, menus). |
| **End** | Decrease UI scale. |
| **Escape** | Close modal (e.g. atlas, gallery, settings). |

When **dragging** an item, arrow keys move between pages (e.g. drag to next page with Right).

### Page atlas (when open)

| Key | Action |
|-----|--------|
| **Tab** | Open page under focus. |
| **Enter** / **Space** | Open page under focus. |
| **Escape** | Close atlas. |
| **Arrow keys** | Move focus between page cells. |

### Widget Gallery

- **Tab** — Switch focus; search field is focused when the gallery opens.
- Filter by name; switch tabs **All** | **Nova** | **ObsidGet** to see only local or only ObsidGet widgets.

### Mini MD widget (built-in markdown editor)

| Key | Action |
|-----|--------|
| **Ctrl/Cmd + B** | Bold. |
| **Ctrl/Cmd + I** | Italic. |
| **Ctrl/Cmd + K** | Link. |
| **Ctrl/Cmd + S** | Save. |
| **Ctrl/Cmd + F** | Search. |
| **Ctrl/Cmd + P** | Toggle view (editor/preview/hybrid). |
| **Ctrl/Cmd + Z** | Undo. |
| **Ctrl/Cmd + Y** / **Ctrl/Cmd + Shift + Z** | Redo. |
| **Shift + Enter** (in search) | Previous match. |

### Browser app

- **Alt + Left** — Back.
- **Alt + Right** — Forward.

---

## Obsidian command

- **Open Nova** — Opens the Nova desktop view in the current leaf. You can assign a hotkey in Obsidian: Settings → Hotkeys → search “Nova”.

---

## Settings (gear icon on taskbar)

### General

- **Bar position** — Taskbar/dock: Top, Bottom, Left, Right.
- **View mode** — Desktop (grid) or Grid (legacy).
- **Theme** — Dark, Light, Obsidian (native), Cyberpunk, Forest.
- **Lock vertical swipe** — Disable Up/Down for page change (only Left/Right).
- **Swipe threshold** — Pixels for horizontal swipe to change page.
- **Transparent ObsidGet widgets** — Use transparent background for widgets imported from ObsidGet (when not in edit mode).
- **Fullscreen widget transparent** — Transparent background when a widget is fullscreen.
- **Page dots** — Position (top/center/bottom), size, duration, blur bubble.
- **Debug widget dimensions** — Log cols/rows and position to console on resize/move (for devs).

### Appearance

- **UI scale** — Scale for taskbar, menus, modals (50–150%). Also: **Home** / **End** keys.
- **Widget scale** — Scale for widgets and icons on the desktop (50–150%). Also: **Page Up** / **Page Down** (if “Page Up/Down changes grid density” is off).
- **Grid density** — Grid size (e.g. 36×36). Higher = smaller cells, more precision. Range 12–64. Can be changed via **Page Up** / **Page Down** if “Page Up/Down changes grid density” is on.
- **Page Up/Down changes grid density** — When on, Page Up/Down change grid density; when off, they change widget/icon scale.

### Wallpapers

- **Wallpaper** — URL or vault path (e.g. `folder/image.png`). Supports images and video (e.g. `.mp4`).
- Built-in presets (Unsplash) + vault images listed when you type a path.

---

## Widgets: Local vs ObsidGet

### Local (Nova)

- Shipped with Nova. No extra plugin.
- **Nova** tab in the Widget Gallery.
- Examples: Clock, Quick Note, Mini MD, Pomodoro, 2048, Snake, Tic-Tac-Toe, Chess AI, Calculator, System, BTC, Ping, Video, YouTube, IDE.
- Rendered by Nova; state stored in Nova’s plugin data.

### ObsidGet

- Require the **ObsidGet** plugin (`obsidian-obsidget`).
- **ObsidGet** tab in the Widget Gallery.
- Loaded from ObsidGet’s gallery (HTML/CSS/JS). Nova runs them in a sandbox and syncs size (resize handle bottom-right).
- Optional template fields: `cols`, `rows` (initial size), `allowGrowBeyondTemplate` (if true, widget can grow beyond that size; e.g. Kanban).
- State is stored per widget by ObsidGet/Nova.

---

## Grid and layout

- **Logical grid** — e.g. 36×36 by default; configurable 12–64 in Settings.
- **Placement** — Items have `x`, `y`, `cols`, `rows` in grid units. No overlap; other items shift when needed.
- **Resize** — Drag the bottom-right handle (visible in edit mode or when holding Alt). Some ObsidGet widgets report size so the cell grows/shrinks with content.
- **Edit mode** — Click the edit (pencil) icon on the taskbar to move, resize, or delete items. Click an item to open its edit modal (title, position, etc.); use the delete button there to remove it. Click the pencil again to lock layout.

---

## Files and data

- Nova state: `Plugin data` (Obsidian) → `obsidian-nova` (items, config, windows, widget state).
- No reference to any other product name in saved data; plugin name is **obsidian-nova**.

---

## Requirements

- Obsidian 1.5.0 or later.
- Optional: **[ObsidGet](https://github.com/infinition/obsidian-obsidget)** for ObsidGet widgets.

---

## Author and license

**Author:** [infinition](https://github.com/infinition)  
**Nova:** [github.com/infinition/obsidian-nova](https://github.com/infinition/obsidian-nova)  
**License:** MIT
