/**
 * Moteur de grille Nova — standard unique pour placement et redimensionnement des widgets.
 *
 * Principe : grille LOGIQUE FIXE (36×36). Seule la taille des cellules en px dépend du viewport.
 * - Les positions/sizes (x, y, cols, rows) sont toujours en unités logiques 1..36.
 * - Au resize fenêtre : on ne change que cellSizePx → pas de reflow, pas de clamp.
 * - 36×36 = ratio carré par défaut ; réglage utilisateur possible (slider) dans les paramètres.
 */

export const LOGICAL_GRID_COLS = 36;
export const LOGICAL_GRID_ROWS = 36;

/** Bornes pour le réglage utilisateur (slider dans les paramètres). */
export const GRID_SIZE_MIN = 12;
export const GRID_SIZE_MAX = 64;
export const GRID_SIZE_STEP = 4;

/** Même valeur pour les deux : cellules + gaps forment un motif carré (grille visuellement carrée). */
export const GRID_GAP_COL_PX = 16;
export const GRID_GAP_ROW_PX = 16;
/** Plus la grille est fine (ex. 48×48), plus la cellule peut être petite pour tenir dans le viewport. */
export const MIN_CELL_SIZE_PX = 14;
export const MAX_CELL_SIZE_PX = 120;

export interface GridMetrics {
  cellSizePx: number;
  gridCols: number;
  gridRows: number;
  gapColPx: number;
  gapRowPx: number;
  totalWidthPx: number;
  totalHeightPx: number;
}

/**
 * Calcule les métriques de grille pour que la grille logique fixe tienne dans le viewport.
 * Si gridSize est fourni (réglage utilisateur), la grille est gridSize × gridSize ; sinon LOGICAL_GRID_COLS × LOGICAL_GRID_ROWS.
 */
export function computeGridMetrics(params: {
  viewportWidthPx: number;
  viewportHeightPx: number;
  widgetScale?: number;
  /** Optionnel : densité de grille (colonnes × lignes), ex. 48 pour 48×48. Synchronisé horizontal/vertical. */
  gridSize?: number;
}): GridMetrics {
  const { viewportWidthPx, viewportHeightPx, widgetScale = 1, gridSize } = params;
  const scale = Math.max(0.25, Math.min(2, widgetScale));
  const minCell = MIN_CELL_SIZE_PX * scale;
  const maxCell = MAX_CELL_SIZE_PX * scale;

  const gapCol = GRID_GAP_COL_PX;
  const gapRow = GRID_GAP_ROW_PX;
  const size = gridSize != null
    ? Math.max(GRID_SIZE_MIN, Math.min(GRID_SIZE_MAX, gridSize))
    : null;
  const cols = size ?? LOGICAL_GRID_COLS;
  const rows = size ?? LOGICAL_GRID_ROWS;

  const maxCellFromWidth = (viewportWidthPx - (cols - 1) * gapCol) / cols;
  const maxCellFromHeight = (viewportHeightPx - (rows - 1) * gapRow) / rows;
  let cellSizePx = Math.min(maxCellFromWidth, maxCellFromHeight);
  cellSizePx = Math.max(minCell, Math.min(maxCell, cellSizePx));

  const totalWidthPx = cols * cellSizePx + (cols - 1) * gapCol;
  const totalHeightPx = rows * cellSizePx + (rows - 1) * gapRow;

  return {
    cellSizePx,
    gridCols: cols,
    gridRows: rows,
    gapColPx: gapCol,
    gapRowPx: gapRow,
    totalWidthPx,
    totalHeightPx
  };
}

/**
 * Convertit une taille en pixels en unités logiques (cols/rows).
 */
export function pxToLogical(params: {
  widthPx: number;
  heightPx: number;
  cellSizePx: number;
  gapColPx: number;
  gapRowPx: number;
}): { cols: number; rows: number } {
  const { widthPx, heightPx, cellSizePx, gapColPx, gapRowPx } = params;
  const cellW = cellSizePx + gapColPx;
  const cellH = cellSizePx + gapRowPx;
  const cols = Math.max(1, Math.round((widthPx + gapColPx) / cellW));
  const rows = Math.max(1, Math.round((heightPx + gapRowPx) / cellH));
  return {
    cols: Math.min(LOGICAL_GRID_COLS, cols),
    rows: Math.min(LOGICAL_GRID_ROWS, rows)
  };
}

/**
 * Convertit unités logiques en pixels (pour debug ou export).
 */
export function logicalToPx(params: {
  cols: number;
  rows: number;
  cellSizePx: number;
  gapColPx: number;
  gapRowPx: number;
}): { widthPx: number; heightPx: number } {
  const { cols, rows, cellSizePx, gapColPx, gapRowPx } = params;
  const widthPx = cols * cellSizePx + (cols - 1) * gapColPx;
  const heightPx = rows * cellSizePx + (rows - 1) * gapRowPx;
  return { widthPx, heightPx };
}

/** Ancienne grille "display" (avant standard logique) pour migration. */
export const LEGACY_GRID_COLS = 32;
export const LEGACY_GRID_ROWS = 40;

/**
 * Normalise les coordonnées/tailles d'un item depuis l'ancienne grille (32×40) vers la grille logique (48×48).
 * Préserve les proportions relatives.
 */
export function migrateItemToLogicalGrid(item: {
  x?: number;
  y?: number;
  cols?: number;
  rows?: number;
}): { x: number; y: number; cols: number; rows: number } {
  const x = Math.max(1, Math.min(LEGACY_GRID_COLS, item.x ?? 1));
  const y = Math.max(1, Math.min(LEGACY_GRID_ROWS, item.y ?? 1));
  const cols = Math.max(1, Math.min(LEGACY_GRID_COLS - x + 1, item.cols ?? 1));
  const rows = Math.max(1, Math.min(LEGACY_GRID_ROWS - y + 1, item.rows ?? 1));

  const newX = Math.max(1, Math.min(LOGICAL_GRID_COLS, Math.round((x / LEGACY_GRID_COLS) * LOGICAL_GRID_COLS)));
  const newY = Math.max(1, Math.min(LOGICAL_GRID_ROWS, Math.round((y / LEGACY_GRID_ROWS) * LOGICAL_GRID_ROWS)));
  const newCols = Math.max(1, Math.min(LOGICAL_GRID_COLS - newX + 1, Math.round((cols / LEGACY_GRID_COLS) * LOGICAL_GRID_COLS)));
  const newRows = Math.max(1, Math.min(LOGICAL_GRID_ROWS - newY + 1, Math.round((rows / LEGACY_GRID_ROWS) * LOGICAL_GRID_ROWS)));

  return { x: newX, y: newY, cols: newCols, rows: newRows };
}

/**
 * Indique si un item utilise l'ancienne grille (valeurs > LOGICAL_GRID_COLS/ROWS).
 */
export function needsMigration(item: { cols?: number; rows?: number; x?: number; y?: number }): boolean {
  const c = item.cols ?? 1;
  const r = item.rows ?? 1;
  const x = item.x ?? 1;
  const y = item.y ?? 1;
  return c > LOGICAL_GRID_COLS || r > LOGICAL_GRID_ROWS || x > LOGICAL_GRID_COLS || y > LOGICAL_GRID_ROWS;
}
