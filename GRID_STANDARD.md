# Grid Standard and Nova Widgets

## Principle: Fixed Logical Grid

Like Notion, Grafana, or Android 12 (targetCellWidth/Height), Nova uses a fixed logical grid:

- **48 columns × 48 rows** per page (`LOGICAL_GRID_COLS`, `LOGICAL_GRID_ROWS`).
- Widget positions and sizes are **always** expressed in logical units (x, y, cols, rows ∈ 1..48).
- On window resize, **only the cell size in pixels** changes; the number of columns/rows does not change.
- A 48×48 grid results in smaller cells (finer granularity, visually smaller widgets). You can switch to 24×24 in `gridEngine.ts` for larger cells.
- Consequences: no reflow, no clamping of widgets, stable placement across screens.

## Grid Engine (`gridEngine.ts`)

- `computeGridMetrics(viewportWidthPx, viewportHeightPx, widgetScale)`
  - Calculates the largest cell size (in px) such that a 24×24 cell grid fits within the viewport. Returns `cellSizePx`, `gridCols`, `gridRows`, `gapColPx`, `gapRowPx`, `totalWidthPx`, and `totalHeightPx`.

- `pxToLogical(widthPx, heightPx, cellSizePx, gapColPx, gapRowPx)`
  - Converts a pixel size into logical units (cols, rows). Used when an Obsidget reports its size in pixels.

- `logicalToPx(cols, rows, ...)`
  - Converts logical units → pixels (useful for debugging or exports).

- Migration
  - `needsMigration(item)`: returns true if the item has coordinates/sizes greater than 48 (e.g., from an older 32×40 or 24×24 grid).
  - `migrateItemToLogicalGrid(item)`: scales x, y, cols, rows into the 1..48 range while preserving proportions.

## Widget Standard (Default + Obsidget)

### Common Properties

All widgets (Nova defaults and Obsidgets) are described by:

| Property | Type | Description |
| --- | ---: | --- |
| **cols** | number | Width in logical units (1..48). |
| **rows** | number | Height in logical units (1..48). |
| **x, y** | number | Position in logical units (1..48). |

### Unified Size Spec (`WidgetSizeSpec`)

Optional on a template:

- **defaultCols / defaultRows**: default size in logical units.
- **minCols, minRows, maxCols, maxRows**: bounds used for resizing.
- **resizeMode**: `'free'` | `'preserveAspect'` | `'fixed'`.

Nova templates provide `cols` and `rows` (e.g. 2×2, 4×4). On add, they are converted to logical units using `(template.cols ?? 3) * (LOGICAL_GRID_COLS / 6)` → producing values roughly in the 8..48 range when using a 48×48 grid.

Obsidget widgets may expose a **defaultSizePx**; when loading the gallery, Nova uses default cols/rows (e.g. 2×2) and then converts to logical units on add. A future improvement could be to call `pxToLogical` at add-time with the current `cellSizePx` to derive cols/rows directly from `defaultSizePx`.

## Data Versions (`dataVersion`)

- **< 2**: legacy data (units 1–4) → migrate with `migrateItemsToSubUnits`.
- **2**: data already in “grid units” (older 32×40 grid).
- **≥ 3**: data in the logical grid (24×24 or 48×48 depending on `LOGICAL_GRID_*`). On load, if `dataVersion < 3` and `needsMigration(item)` is true, `migrateItemToLogicalGrid` is applied.

All saves write `dataVersion: 3`.

## Summary

1. Grid: always 48×48 in logical units (configurable in `gridEngine.ts`); only the cell size (px) depends on the viewport and `widgetScale`. The finer the grid (48), the smaller each cell is.
2. Widgets: x, y, cols, rows are in 1..48; templates with cols/rows or `defaultSizePx` are converted to logical units on add.
3. Migration: legacy positions/sizes (e.g. values > 48 or older 32×40 coordinates) are scaled into the 1..48 range proportionally on first load and the data is saved at `dataVersion: 3`.
