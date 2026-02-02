import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Grid,
  Maximize2,
  Minimize2,
  Plus,
  X,
  Image as ImageIcon,
  Monitor,
  Layout,
  Settings,
  Sliders,
  Palette,
  Film,
  Compass,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  Play,
  Trash2
} from 'lucide-react';
import type {
  WebOSAPI,
  WebOSAppItem,
  WebOSConfig,
  WebOSData,
  WebOSItem,
  WebOSWidgetItem,
  WebOSWidgetTemplate,
  WebOSWindow
} from '../types';
import {
  LOGICAL_GRID_COLS,
  LOGICAL_GRID_ROWS,
  computeGridMetrics,
  migrateItemToLogicalGrid,
  needsMigration,
  GRID_SIZE_MIN,
  GRID_SIZE_MAX,
  GRID_SIZE_STEP
} from '../services/gridEngine';
import { Dock } from './Dock';
import { FinderView } from './FinderView';
import { ItemEditModal, renderLucideIcon } from './ItemEditModal';
import { Taskbar } from './Taskbar';
import { WebViewWindow } from './WebViewWindow';
import { WindowFrame } from './WindowFrame';
import { ObsidgetWidgetRunner } from './Widgets/ObsidgetWidgetRunner';
import { WidgetRunner } from './Widgets/WidgetRunner';
import { WIDGET_TEMPLATES } from './Widgets/templates';
import { DEFAULT_ITEMS_BASE, BUILT_IN_APP_TEMPLATES } from './Widgets/defaults';
import { DEFAULT_WIDGET_COMPONENTS, normalizeWidgetId } from './Widgets/defaults/tsxRegistry';

const WALLPAPERS = [
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1519681393798-38e43269d877?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2070&q=80'
];

const THEMES = {
  dark: {
    name: 'Sombre',
    text: 'text-white',
    textMuted: 'text-slate-400',
    dock: 'bg-white/20',
    bar: 'bg-slate-900/80',
    barColor: 'rgba(15, 23, 42, 0.9)',
    folder: 'bg-slate-800/90',
    previewBg: '#0f172a',
    modalBg: '#0f172a',
    border: 'border-white/10',
    accent: '#9333ea', // Purple
    hover: 'hover:bg-white/5'
  },
  light: {
    name: 'Clair',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    dock: 'bg-black/10',
    bar: 'bg-white/80',
    barColor: 'rgba(255, 255, 255, 0.9)',
    folder: 'bg-white/90',
    previewBg: '#f1f5f9',
    modalBg: '#ffffff',
    border: 'border-black/10',
    accent: '#2563eb', // Blue
    hover: 'hover:bg-black/5'
  },
  obsidian: {
    name: 'Obsidian (Natif)',
    text: 'text-[var(--text-normal)]',
    textMuted: 'text-[var(--text-muted)]',
    dock: 'bg-[var(--background-secondary)]/80 border border-[var(--background-modifier-border)]',
    bar: 'bg-[var(--background-secondary)] border-t border-[var(--background-modifier-border)]',
    barColor: 'var(--background-secondary)',
    folder: 'bg-[var(--background-primary)] border border-[var(--background-modifier-border)]',
    previewBg: 'var(--background-primary)',
    modalBg: 'var(--background-primary)',
    border: 'border-[var(--background-modifier-border)]',
    accent: 'var(--interactive-accent)',
    hover: 'hover:bg-[var(--background-modifier-hover)]'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    text: 'text-yellow-300',
    textMuted: 'text-yellow-300/60',
    dock: 'bg-purple-900/50',
    bar: 'bg-black/80',
    barColor: 'rgba(0, 0, 0, 0.9)',
    folder: 'bg-slate-900/90',
    previewBg: '#000000',
    modalBg: '#000000',
    border: 'border-yellow-500/30',
    accent: '#facc15', // Yellow
    hover: 'hover:bg-yellow-900/20'
  },
  forest: {
    name: 'Forêt',
    text: 'text-green-100',
    textMuted: 'text-green-100/60',
    dock: 'bg-black/20',
    bar: 'bg-green-900/80',
    barColor: 'rgba(20, 83, 45, 0.9)',
    folder: 'bg-green-800/90',
    previewBg: '#14532d',
    modalBg: '#14532d',
    border: 'border-green-400/20',
    accent: '#4ade80', // Green
    hover: 'hover:bg-green-900/50'
  }
} as const;

const DEFAULT_CONFIG: WebOSConfig = {
  barPosition: 'bottom',
  wallpaper: WALLPAPERS[1],
  viewMode: 'desktop',
  theme: 'dark',
  swipeThreshold: 30,
  lockVerticalSwipe: false,
  transparentObsidgetWidgets: true,
  fullscreenWidgetTransparent: false,
  pageDotsPosition: 'bottom',
  pageDotsSize: 12,
  pageDotsDurationMs: 5000,
  pageDotsBlurBubble: true,
  uiScale: 1,
  widgetScale: 1,
  gridSize: 36,
  pageUpDownChangesGridDensity: false,
  debugWidgetDimensions: false
};

/** Convertit les items par défaut : positions (x,y) en coords 1–8/1–10 → grille ; cols/rows déjà en unités grille, on ne fait que clamper. */
const defaultItemsToGridUnits = (items: WebOSItem[]): WebOSItem[] =>
  items.map((item) => {
    const x = item.x != null && item.x >= 1 ? item.x : 1;
    const y = item.y != null && item.y >= 1 ? item.y : 1;
    const cols = item.cols ?? 6;
    const rows = item.rows ?? 6;
    return {
      ...item,
      x: Math.max(1, Math.min(LOGICAL_GRID_COLS, Math.round((x - 1) * (LOGICAL_GRID_COLS / 8)) + 1)),
      y: Math.max(1, Math.min(LOGICAL_GRID_ROWS, Math.round((y - 1) * (LOGICAL_GRID_ROWS / 10)) + 1)),
      cols: Math.max(1, Math.min(LOGICAL_GRID_COLS, cols)),
      rows: Math.max(1, Math.min(LOGICAL_GRID_ROWS, rows))
    };
  });

/** Migration ancienne grille (unités 1–4) vers unités logiques 1..24 (legacy). */
const migrateItemsToSubUnits = (items: WebOSItem[]): WebOSItem[] => {
  const maxCols = items.reduce((m, i) => Math.max(m, i.cols || 1), 0);
  const maxRows = items.reduce((m, i) => Math.max(m, i.rows || 1), 0);
  if (maxCols > 4 || maxRows > 4) return items;
  return items.map((item) => ({
    ...item,
    x: item.x != null ? (item.x - 1) * 6 + 1 : undefined,
    y: item.y != null ? (item.y - 1) * 6 + 1 : undefined,
    cols: (item.cols || 1) * 6,
    rows: (item.rows || 1) * 6
  }));
};

/** Réorganise les items par défaut pour qu'ils ne se chevauchent pas (premier slot libre par ordre de lecture).
 *  Si aucun slot libre sur la page courante, place l'item sur la page suivante. */
const layoutDefaultItemsNoOverlap = (
  items: WebOSItem[],
  gridCols: number,
  gridRows: number
): WebOSItem[] => {
  const placed: WebOSItem[] = [];
  const maxPages = 20;
  for (const item of items) {
    const cols = item.cols ?? 1;
    const rows = item.rows ?? 1;
    let found = false;
    let pageIndex = 0;
    while (!found && pageIndex < maxPages) {
      const onThisPage = placed.filter((o) => (o.pageIndex ?? 0) === pageIndex);
      for (let y = 1; y <= gridRows - rows + 1 && !found; y += 1) {
        for (let x = 1; x <= gridCols - cols + 1 && !found; x += 1) {
          const overlaps = onThisPage.some((other) => {
            const ox = other.x ?? 1;
            const oy = other.y ?? 1;
            const ocols = other.cols ?? 1;
            const orows = other.rows ?? 1;
            return !(
              x + cols <= ox ||
              ox + ocols <= x ||
              y + rows <= oy ||
              oy + orows <= y
            );
          });
          if (!overlaps) {
            placed.push({ ...item, x, y, pageIndex });
            found = true;
          }
        }
      }
      if (!found) pageIndex += 1;
    }
    if (!found) {
      placed.push({ ...item, x: item.x ?? 1, y: item.y ?? 1, pageIndex: 0 });
    }
  }
  return placed;
};

/** Clamp items so none extend outside the grid (no widget leaves its page). */
const clampItemsToGrid = (
  items: WebOSItem[],
  gridCols: number,
  gridRows: number
): WebOSItem[] =>
  items.map((item) => {
    const x = item.x ?? 1;
    const y = item.y ?? 1;
    const cols = item.cols || 1;
    const rows = item.rows || 1;
    const xClamp = Math.max(1, Math.min(x, gridCols));
    const yClamp = Math.max(1, Math.min(y, gridRows));
    const colsClamp = Math.max(1, Math.min(cols, gridCols - xClamp + 1));
    const rowsClamp = Math.max(1, Math.min(rows, gridRows - yClamp + 1));
    if (x === xClamp && y === yClamp && cols === colsClamp && rows === rowsClamp) return item;
    return { ...item, x: xClamp, y: yClamp, cols: colsClamp, rows: rowsClamp };
  });

const templateById = (id: string, templates: WebOSWidgetTemplate[]) =>
  templates.find((template) => template.id === id);

const buildWidgetItem = (
  templateId: string,
  overrides: Partial<WebOSWidgetItem>,
  templates: WebOSWidgetTemplate[]
): WebOSWidgetItem => {
  const template = templateById(templateId, templates);
  if (!template) {
    return {
      id: overrides.id || templateId,
      type: 'widget',
      title: overrides.title || 'Widget',
      widgetId: templateId,
      cols: overrides.cols || 1,
      rows: overrides.rows || 1,
      bgColor: overrides.bgColor || '#334155'
    };
  }

  const isObsidget = template.source === 'obsidget';
  return {
    id: overrides.id || templateId,
    type: 'widget',
    title: overrides.title || template.title,
    widgetId: template.id,
    cols: overrides.cols ?? template.cols,
    rows: overrides.rows ?? template.rows,
    bgColor: overrides.bgColor ?? template.bgColor,
    html: isObsidget ? undefined : template.html,
    css: isObsidget ? undefined : template.css,
    js: isObsidget ? undefined : template.js,
    ...overrides
  };
};

/** IDs des widgets/apps par défaut (registry + templates runner) — pour savoir si un template existe encore. */
const getAvailableDefaultIds = (templates: WebOSWidgetTemplate[]): Set<string> => {
  const ids = new Set<string>();
  for (const item of DEFAULT_ITEMS_BASE) {
    if (item.type === 'widget') ids.add((item as WebOSWidgetItem).widgetId);
    else ids.add(item.id);
  }
  for (const t of templates) {
    if (t.kind === 'runner') ids.add(t.id);
  }
  return ids;
};

/** Liste dynamique de tous les items par défaut (registry + templates runner non déjà dans le registry). */
const getDefaultItems = (templates: WebOSWidgetTemplate[]): WebOSItem[] => {
  const baseWidgetIds = new Set(
    DEFAULT_ITEMS_BASE.filter((i) => i.type === 'widget').map((i) => (i as WebOSWidgetItem).widgetId)
  );
  const fromTemplates = templates
    .filter((t) => t.kind === 'runner' && !baseWidgetIds.has(t.id))
    .map((t) => buildWidgetItem(t.id, { id: `widget-${t.id}`, pageIndex: 0 }, templates));
  return [...DEFAULT_ITEMS_BASE, ...fromTemplates];
};

/** Trouve le premier slot libre pour un item (cols x rows) sur une page, puis pages suivantes. */
const findFreeSlotForItemsStatic = (
  placed: WebOSItem[],
  cols: number,
  rows: number,
  gridCols: number,
  gridRows: number
): { x: number; y: number; pageIndex: number } => {
  const maxPages = 20;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const onThisPage = placed.filter((o) => (o.pageIndex ?? 0) === pageIndex);
    for (let y = 1; y <= gridRows - rows + 1; y += 1) {
      for (let x = 1; x <= gridCols - cols + 1; x += 1) {
        const overlaps = onThisPage.some((other) => {
          const ox = other.x ?? 1;
          const oy = other.y ?? 1;
          const ocols = other.cols ?? 1;
          const orows = other.rows ?? 1;
          return !(
            x + cols <= ox ||
            ox + ocols <= x ||
            y + rows <= oy ||
            oy + orows <= y
          );
        });
        if (!overlaps) return { x, y, pageIndex };
      }
    }
  }
  return { x: 1, y: 1, pageIndex: 0 };
};

const PROTECTED_ITEM_IDS = new Set(['finder', 'browser']);

interface DesktopProps {
  api: WebOSAPI;
  /** Ref mise à jour avec l'état courant pour que saveWidgetState (bridge) n'écrase pas items/config avec un state disque obsolète (ex. Jukebox). */
  currentStateRef?: React.MutableRefObject<WebOSData | null>;
}

/** Composant stable (défini au niveau module) pour que le modal Pages ne soit pas remonté à chaque frappe — garde le focus dans les champs de renommage */
interface PagesModalStableProps {
  showPages?: boolean;
  config: WebOSConfig;
  setConfig: React.Dispatch<React.SetStateAction<WebOSConfig>>;
  currentPageId: number;
  setCurrentPageId: (id: number) => void;
  setShowPages: (v: boolean) => void;
  setIsPagesEditMode: (v: boolean) => void;
  items: WebOSItem[];
  isPagesEditMode: boolean;
  pages: number[];
  getPageCoord: (pageId: number) => { x: number; y: number };
  currentTheme: { border: string; accent: string; text: string; textMuted: string };
  pageDragIdRef: React.MutableRefObject<number | null>;
  pageRenameFocusedRef: React.MutableRefObject<HTMLInputElement | null>;
  resolveIcon: (icon?: string) => string | undefined;
  gridColsDisplay: number;
  gridMaxRows: number;
  gridGapCol: number;
  gridRowHeightDisplay: number;
  uiScale?: number;
}

const PagesModalStable = React.memo(function PagesModalStable(props: PagesModalStableProps) {
  const {
    config,
    setConfig,
    currentPageId,
    setCurrentPageId,
    setShowPages,
    setIsPagesEditMode,
    items,
    isPagesEditMode,
    pages,
    getPageCoord,
    currentTheme,
    pageDragIdRef,
    pageRenameFocusedRef,
    resolveIcon,
    gridColsDisplay,
    gridMaxRows,
    gridGapCol,
    gridRowHeightDisplay,
    uiScale = 1
  } = props;
  const showPages = true;
  const [atlasFocus, setAtlasFocus] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  // État local pour le renommage : on n’écrit dans config qu’au blur, pour éviter les re-renders
  // (barre mise à jour) qui font perdre le focus à l’input.
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const baseRows = 10;
  const rootCoord = getPageCoord(0);
  const relPages = pages.map((pageId) => {
    const coord = getPageCoord(pageId);
    return { id: pageId, dx: coord.x - rootCoord.x, dy: coord.y - rootCoord.y, coord };
  });
  let extentX = 0;
  let extentY = 0;
  relPages.forEach((entry) => {
    extentX = Math.max(extentX, Math.abs(entry.dx));
    extentY = Math.max(extentY, Math.abs(entry.dy));
  });
  const mapCols = extentX * 2 + 1;
  const mapRows = extentY * 2 + 1;
  const mapGap = 14;
  const baseCardWidth = 210;
  const baseCardHeight = 160;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const panelWidth = viewportWidth;
  const panelHeight = viewportHeight;
  const headerHeight = 0;
  const availableWidth = panelWidth - 48;
  const availableHeight = panelHeight - headerHeight - 48;
  const naturalGridWidth = mapCols * baseCardWidth + (mapCols - 1) * mapGap;
  const naturalGridHeight = mapRows * baseCardHeight + (mapRows - 1) * mapGap;
  const gridScale = Math.min(1, availableWidth / naturalGridWidth, availableHeight / naturalGridHeight);
  const pageByRel = new Map<string, { id: number; coord: { x: number; y: number } }>();
  relPages.forEach((entry) => pageByRel.set(`${entry.dx},${entry.dy}`, { id: entry.id, coord: entry.coord }));
  const closeModal = () => {
    setShowPages(false);
    setIsPagesEditMode(false);
    pageDragIdRef.current = null;
    setEditingPageId(null);
  };
  const goToPage = (pageId: number) => {
    setCurrentPageId(pageId);
    closeModal();
  };
  const swapPageCoords = (sourceId: number, targetId: number) => {
    if (sourceId === 0 || targetId === 0) return;
    setConfig((prev) => {
      const coords = { ...(prev.pageCoords ?? {}) };
      const source = coords[sourceId] ?? { x: 0, y: 0 };
      const target = coords[targetId] ?? { x: 0, y: 0 };
      coords[sourceId] = { x: target.x, y: target.y };
      coords[targetId] = { x: source.x, y: source.y };
      return { ...prev, pageCoords: coords };
    });
  };
  const movePageToCoord = (pageId: number, coord: { x: number; y: number }) => {
    if (pageId === 0) return;
    setConfig((prev) => ({
      ...prev,
      pageCoords: { ...(prev.pageCoords ?? {}), [pageId]: { x: coord.x, y: coord.y } }
    }));
  };
  const canFocusAt = (dx: number, dy: number) => {
    const entry = pageByRel.get(`${dx},${dy}`);
    const isHome = entry?.id === 0;
    const itemsInPage = entry ? items.filter((item) => (item.pageIndex ?? 0) === entry.id) : [];
    const hasContent = itemsInPage.length > 0;
    const isUsefulHere = isHome || hasContent;
    if (isUsefulHere) return true;
    const neighbourRelCoords: Array<[number, number]> = [
      [dx + 1, dy], [dx - 1, dy], [dx, dy + 1], [dx, dy - 1]
    ];
    const hasNeighbourUseful = neighbourRelCoords.some(([nx, ny]) => {
      const neighbourEntry = pageByRel.get(`${nx},${ny}`);
      if (!neighbourEntry) return false;
      if (neighbourEntry.id === 0) return true;
      return items.some((item) => (item.pageIndex ?? 0) === neighbourEntry.id);
    });
    return hasNeighbourUseful;
  };
  const canOpenPageAt = (dx: number, dy: number) => {
    const entry = pageByRel.get(`${dx},${dy}`);
    if (!entry) return false;
    const pageId = entry.id;
    const isHome = pageId === 0;
    const hasContent = items.some((item) => (item.pageIndex ?? 0) === pageId);
    const isUsefulHere = isHome || hasContent;
    const neighbourRelCoords: Array<[number, number]> = [
      [dx + 1, dy], [dx - 1, dy], [dx, dy + 1], [dx, dy - 1]
    ];
    const hasNeighbourUseful = neighbourRelCoords.some(([nx, ny]) => {
      const neighbourEntry = pageByRel.get(`${nx},${ny}`);
      if (!neighbourEntry) return false;
      if (neighbourEntry.id === 0) return true;
      return items.some((item) => (item.pageIndex ?? 0) === neighbourEntry.id);
    });
    return isUsefulHere || hasNeighbourUseful;
  };
  useEffect(() => {
    const current = getPageCoord(currentPageId);
    setAtlasFocus({ dx: current.x - rootCoord.x, dy: current.y - rootCoord.y });
  }, [currentPageId, getPageCoord, rootCoord.x, rootCoord.y]);
  useEffect(() => {
    if (!isPagesEditMode) {
      setEditingPageId(null);
    }
  }, [isPagesEditMode]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
      const tryMove = (moveX: number, moveY: number) => {
        const nextDx = atlasFocus.dx + moveX;
        const nextDy = atlasFocus.dy + moveY;
        if (nextDx >= -extentX && nextDx <= extentX && nextDy >= -extentY && nextDy <= extentY && canFocusAt(nextDx, nextDy)) {
          setAtlasFocus({ dx: nextDx, dy: nextDy });
        }
      };
      if (event.key === 'Tab') {
        event.preventDefault();
        if (canOpenPageAt(atlasFocus.dx, atlasFocus.dy)) {
          const entry = pageByRel.get(`${atlasFocus.dx},${atlasFocus.dy}`);
          if (entry) goToPage(entry.id);
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (canOpenPageAt(atlasFocus.dx, atlasFocus.dy)) {
          const entry = pageByRel.get(`${atlasFocus.dx},${atlasFocus.dy}`);
          if (entry) goToPage(entry.id);
        }
        return;
      }
      if (event.key === 'ArrowLeft') { event.preventDefault(); tryMove(-1, 0); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); tryMove(1, 0); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); tryMove(0, -1); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); tryMove(0, 1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [atlasFocus, extentX, extentY, pageByRel, closeModal, goToPage, items, canFocusAt, canOpenPageAt]);
  const cells: Array<{ dx: number; dy: number; pageId?: number; coord: { x: number; y: number } }> = [];
  for (let y = -extentY; y <= extentY; y += 1) {
    for (let x = -extentX; x <= extentX; x += 1) {
      const entry = pageByRel.get(`${x},${y}`);
      const coord = entry?.coord ?? { x: rootCoord.x + x, y: rootCoord.y + y };
      cells.push({ dx: x, dy: y, pageId: entry?.id, coord });
    }
  }
  return (
    <div className="fixed inset-0 z-[85] bg-black/10 backdrop-blur-[2px]" onPointerDown={(e) => e.stopPropagation()} onClick={closeModal}>
      <div className="absolute inset-0 flex items-center justify-center p-6" onClick={(event) => event.stopPropagation()}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${mapCols}, ${baseCardWidth}px)`,
            gridAutoRows: `${baseCardHeight}px`,
            gap: `${mapGap}px`,
            zoom: uiScale,
            transform: `scale(${gridScale})`,
            transformOrigin: 'top left'
          }}
        >
          {cells.map((cell) => {
            const pageId = cell.pageId;
            const isEmpty = pageId === undefined;
            const isActive = pageId === currentPageId;
            const pageName = pageId !== undefined ? config.pageNames?.[pageId] ?? '' : '';
            const itemsInPage = pageId !== undefined ? items.filter((item) => (item.pageIndex ?? 0) === pageId) : [];
            const isHome = pageId === 0;
            const hasContent = itemsInPage.length > 0;
            const isUsefulHere = isHome || hasContent;
            const neighbourRelCoords: Array<[number, number]> = [
              [cell.dx + 1, cell.dy], [cell.dx - 1, cell.dy], [cell.dx, cell.dy + 1], [cell.dx, cell.dy - 1]
            ];
            const hasNeighbourUseful = neighbourRelCoords.some(([nx, ny]) => {
              const entry = pageByRel.get(`${nx},${ny}`);
              if (!entry) return false;
              if (entry.id === 0) return true;
              return items.some((item) => (item.pageIndex ?? 0) === entry.id);
            });
            const hasCard = isUsefulHere || hasNeighbourUseful;
            const isFocused = atlasFocus.dx === cell.dx && atlasFocus.dy === cell.dy;
            return (
              <div
                key={`${cell.dx},${cell.dy}`}
                draggable={!!pageId && isPagesEditMode && pageId !== 0}
                onDragStart={(event) => {
                  if (!isPagesEditMode || !pageId || pageId === 0) return;
                  pageDragIdRef.current = pageId;
                  event.dataTransfer.setData('text/plain', String(pageId));
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (!isPagesEditMode) return;
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!isPagesEditMode) return;
                  event.preventDefault();
                  const sourceId = pageDragIdRef.current ?? Number(event.dataTransfer.getData('text/plain'));
                  if (!sourceId || sourceId === pageId || sourceId === 0) return;
                  if (pageId) {
                    swapPageCoords(sourceId, pageId);
                  } else {
                    movePageToCoord(sourceId, cell.coord);
                  }
                }}
                onDragEnd={() => {
                  pageDragIdRef.current = null;
                }}
                onClick={() => {
                  if (!hasCard || pageId === undefined) return;
                  if (pageId === 0) {
                    goToPage(0);
                    return;
                  }
                  if (isPagesEditMode) return;
                  goToPage(pageId);
                }}
                onPointerEnter={() => setAtlasFocus({ dx: cell.dx, dy: cell.dy })}
                className={`relative rounded-2xl border transition ${
                  !hasCard && !isPagesEditMode
                    ? 'border-transparent bg-transparent cursor-default'
                    : isEmpty
                      ? isPagesEditMode
                        ? 'border-dashed border-white/20 bg-white/5 cursor-pointer'
                        : 'border-white/5 bg-white/5 cursor-default'
                      : isActive
                        ? 'shadow-lg bg-slate-800/80 cursor-pointer'
                        : 'border-white/10 bg-slate-800/60 hover:border-white/30 cursor-pointer'
                } ${isFocused ? 'ring-2 ring-white/60' : ''}`}
                style={isActive ? { borderColor: currentTheme.accent, shadowColor: `${currentTheme.accent}40` } : {}}
              >
                {pageId !== undefined && hasCard ? (
                  <div className="h-full p-3 flex flex-col">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{cell.coord.x},{cell.coord.y}</span>
                      {isHome && <span className="text-yellow-300">HOME</span>}
                    </div>
                    <div className="flex-1 mt-2 rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
                      <div
                        className="w-full h-full grid gap-px p-2"
                        style={{
                          gridTemplateColumns: `repeat(${gridColsDisplay}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${gridMaxRows}, minmax(0, 1fr))`
                        }}
                      >
                        {itemsInPage.map((item) => {
                          if (!item.x || !item.y) return null;
                          const cols = item.cols || 1;
                          const rows = item.rows || 1;
                          const px = Math.max(1, Math.min(item.x ?? 1, gridColsDisplay));
                          const py = Math.max(1, Math.min(item.y ?? 1, gridMaxRows));
                          const pc = Math.max(1, Math.min(cols, gridColsDisplay - px + 1));
                          const pr = Math.max(1, Math.min(rows, gridMaxRows - py + 1));
                          return (
                            <div
                              key={item.id}
                              className="rounded-[1px] overflow-hidden border border-white/10"
                              style={{
                                gridColumnStart: px,
                                gridColumnEnd: `span ${pc}`,
                                gridRowStart: py,
                                gridRowEnd: `span ${pr}`,
                                backgroundColor: item.bgColor || '#334155'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-2 relative">
                      {isPagesEditMode ? (
                        <>
                          <input
                            value={editingPageId === pageId ? editingValue : pageName}
                            onFocus={(e) => {
                              pageRenameFocusedRef.current = e.currentTarget;
                              if (editingPageId !== null && editingPageId !== pageId) {
                                setConfig((prev) => ({
                                  ...prev,
                                  pageNames: { ...(prev.pageNames ?? {}), [editingPageId]: editingValue }
                                }));
                              }
                              setEditingPageId(pageId);
                              setEditingValue(pageName);
                            }}
                            onBlur={() => {
                              if (editingPageId === pageId) {
                                setConfig((prev) => ({
                                  ...prev,
                                  pageNames: { ...(prev.pageNames ?? {}), [pageId]: editingValue }
                                }));
                                setEditingPageId(null);
                              }
                            }}
                            onChange={(event) => {
                              const val = (event.target as HTMLInputElement).value;
                              if (editingPageId === pageId) setEditingValue(val);
                              else {
                                setEditingPageId(pageId);
                                setEditingValue(val);
                              }
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => event.stopPropagation()}
                            placeholder={`Page ${pageId}`}
                            className="w-full bg-slate-900/70 border border-white/10 rounded-lg pl-2 pr-7 py-1 text-xs"
                          />
                          {(editingPageId === pageId ? editingValue : pageName).length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfig((prev) => ({
                                  ...prev,
                                  pageNames: { ...(prev.pageNames ?? {}), [pageId]: '' }
                                }));
                                if (editingPageId === pageId) {
                                  setEditingPageId(null);
                                  setEditingValue('');
                                }
                                setTimeout(() => pageRenameFocusedRef.current?.focus(), 0);
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-white/10"
                              aria-label="Effacer le nom"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs font-semibold text-white truncate">
                          {pageName && pageName.trim() ? pageName : `Page ${pageId}`}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                    {isPagesEditMode ? 'Déposer ici' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setIsPagesEditMode((prev) => !prev);
          }}
          className={`fixed top-4 right-4 px-3 py-1 rounded-full text-[10px] font-semibold border transition backdrop-blur ${
            isPagesEditMode ? 'text-white' : 'bg-white/10 border-white/10 text-white/80'
          }`}
          style={isPagesEditMode ? { backgroundColor: `${currentTheme.accent}AA`, borderColor: currentTheme.accent } : {}}
        >
          {isPagesEditMode ? 'Terminer' : 'Edit'}
        </button>
      </div>
    </div>
  );
});

/** Composant stable (niveau module) pour que la galerie ne soit pas remontée à chaque frappe — garde le focus dans le champ de recherche */
interface WidgetGalleryStableProps {
  visible: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  tab: 'all' | 'os' | 'obsidget';
  onTabChange: (t: 'all' | 'os' | 'obsidget') => void;
  searchInputRef: React.MutableRefObject<HTMLInputElement | null>;
  currentTheme: { border: string; text: string; textMuted: string; accent: string; hover: string; modalBg?: string };
  uiScale?: number;
  builtInTemplates: WebOSWidgetTemplate[];
  obsidgetTemplates: WebOSWidgetTemplate[];
  osExtraItems: WebOSWidgetItem[];
  items: WebOSItem[];
  addApp: (app: WebOSItem) => void;
  addWidget: (template: WebOSWidgetTemplate) => void;
  addWidgetFromItem: (item: WebOSWidgetItem) => void;
}

const WidgetGalleryStable = React.memo(function WidgetGalleryStable(props: WidgetGalleryStableProps) {
  const {
    visible,
    onClose,
    search,
    onSearchChange,
    tab,
    onTabChange,
    searchInputRef,
    currentTheme,
    uiScale = 1,
    builtInTemplates,
    obsidgetTemplates,
    osExtraItems,
    items,
    addApp,
    addWidget,
    addWidgetFromItem
  } = props;

  if (!visible) return null;

  type GalleryEntry =
    | { kind: 'template'; template: WebOSWidgetTemplate }
    | { kind: 'item'; item: WebOSWidgetItem }
    | { kind: 'app'; app: WebOSItem };
  const appEntries: GalleryEntry[] = BUILT_IN_APP_TEMPLATES.map((app) => ({ kind: 'app' as const, app }));
  const allEntries: GalleryEntry[] = [
    ...appEntries,
    ...builtInTemplates.map((template) => ({ kind: 'template' as const, template })),
    ...osExtraItems.map((item) => ({ kind: 'item' as const, item })),
    ...obsidgetTemplates.map((template) => ({ kind: 'template' as const, template }))
  ];
  const osEntries: GalleryEntry[] = [
    ...appEntries,
    ...builtInTemplates.map((template) => ({ kind: 'template' as const, template })),
    ...osExtraItems.map((item) => ({ kind: 'item' as const, item }))
  ];
  const galleryEntriesBase: GalleryEntry[] =
    tab === 'os'
      ? osEntries
      : tab === 'obsidget'
        ? obsidgetTemplates.map((template) => ({ kind: 'template' as const, template }))
        : allEntries;
  const searchLower = search.trim().toLowerCase();
  const galleryEntries = searchLower
    ? galleryEntriesBase.filter((entry) => {
        const title = entry.kind === 'app' ? entry.app.title : entry.kind === 'template' ? entry.template.title : entry.item.title;
        const id = entry.kind === 'app' ? entry.app.id : entry.kind === 'template' ? entry.template.id : entry.item.id;
        return (
          (title ?? '').toLowerCase().includes(searchLower) ||
          (id ?? '').toLowerCase().includes(searchLower)
        );
      })
    : galleryEntriesBase;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => { onClose(); onSearchChange(''); }}
    >
      <div
        className={`text-white w-full max-w-4xl p-6 rounded-2xl shadow-2xl border max-h-[90vh] overflow-y-auto ${currentTheme.border}`}
        style={{ backgroundColor: currentTheme.modalBg || '#0f172a', zoom: uiScale ?? 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-2xl font-bold ${currentTheme.text}`}>Galerie de Widgets</h3>
          <button onClick={() => { onClose(); onSearchChange(''); }} className={`p-2 rounded-full ${currentTheme.hover} ${currentTheme.text}`}>
            <X size={18} />
          </button>
        </div>
        <div className="mb-4 relative">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Rechercher un widget…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`w-full pl-4 pr-10 py-2.5 rounded-xl border bg-black/30 outline-none transition-colors placeholder:opacity-60 ${currentTheme.border} ${currentTheme.text}`}
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10 transition"
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'os', 'obsidget'].map(t => {
            if (t === 'obsidget' && obsidgetTemplates.length === 0) return null;
            return (
              <button
                key={t}
                onClick={() => onTabChange(t as 'all' | 'os' | 'obsidget')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  tab === t ? 'text-white' : `${currentTheme.textMuted} bg-white/5 border-white/10 hover:bg-white/10`
                }`}
                style={tab === t ? { backgroundColor: currentTheme.accent, borderColor: currentTheme.accent } : {}}
              >
                {t === 'all' ? 'Tout' : t === 'os' ? 'OS' : 'Obsidget'}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryEntries.map((entry) => {
            const isApp = entry.kind === 'app';
            const isTemplate = entry.kind === 'template';
            const template = isTemplate ? entry.template : undefined;
            const item = entry.kind === 'item' ? entry.item : undefined;
            const app = isApp ? entry.app : undefined;
            const title = app?.title ?? template?.title ?? item?.title ?? 'Widget';
            const cols = app?.cols ?? template?.cols ?? item?.cols ?? 1;
            const rows = app?.rows ?? template?.rows ?? item?.rows ?? 1;
            const bgColor = app?.bgColor ?? template?.bgColor ?? item?.bgColor ?? '#334155';
            const html = template?.html ?? item?.html ?? '<div class="text-xs text-white/60">Widget</div>';
            const alreadyAdded = isApp && app && items.some((i) => i.id === app.id);

            return (
              <div
                key={isApp ? `app-${app?.id}` : isTemplate ? `tpl-${template?.id}` : `item-${item?.id}`}
                className={`rounded-xl p-4 border transition ${currentTheme.border} ${currentTheme.text}`}
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <div className="h-32 mb-4 rounded-lg overflow-hidden relative bg-black/20 flex items-center justify-center">
                  {isApp && app ? (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl font-bold rounded-lg"
                      style={{ backgroundColor: bgColor === 'glass' ? 'rgba(255,255,255,0.1)' : bgColor, color: bgColor === '#ffffff' ? '#1e293b' : '#fff' }}
                    >
                      {app.icon ?? app.title?.charAt(0) ?? '?'}
                    </div>
                  ) : (
                    <>
                      <div
                        className="scale-50 origin-center w-[200%] h-[200%] flex items-center justify-center pointer-events-none"
                        style={{ backgroundColor: bgColor === 'glass' ? 'transparent' : bgColor }}
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                      {bgColor === 'glass' && <div className="absolute inset-0 bg-white/10 backdrop-blur-md -z-10" />}
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{title}</div>
                    <div className={`text-xs ${currentTheme.textMuted}`}>
                      {cols}x{rows} {isApp && '• App'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isApp && app && !alreadyAdded) addApp(app);
                      else if (isTemplate && template) addWidget(template);
                      else if (item) addWidgetFromItem(item);
                    }}
                    disabled={isApp && alreadyAdded}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${alreadyAdded ? 'opacity-50 cursor-not-allowed bg-white/10' : 'text-white opacity-90 hover:opacity-100'}`}
                    style={alreadyAdded ? {} : { backgroundColor: currentTheme.accent }}
                  >
                    {isApp && alreadyAdded ? 'Déjà ajouté' : 'Ajouter'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

interface DragPlaceholder {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ResizeHandle {
  id: string;
  startX: number;
  startY: number;
  startCols: number;
  startRows: number;
  currentCols: number;
  currentRows: number;
}

export const Desktop: React.FC<DesktopProps> = ({ api, currentStateRef }) => {
  const [items, setItems] = useState<WebOSItem[]>([]);
  const [config, setConfig] = useState<WebOSConfig>(DEFAULT_CONFIG);
  const [windows, setWindows] = useState<WebOSWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [widgetTemplates, setWidgetTemplates] = useState<WebOSWidgetTemplate[]>(WIDGET_TEMPLATES);
  const [obsidgetSettings, setObsidgetSettings] = useState<{
    maxWidthValue: number;
    maxWidthUnit: 'percent' | 'pixel';
  } | null>(null);
  const [vaultWallpapers, setVaultWallpapers] = useState<string[]>([]);
  const [vaultVideos, setVaultVideos] = useState<string[]>([]);
  const [barSize, setBarSize] = useState(0);
  const [paneHeaderHeight, setPaneHeaderHeight] = useState(0);
  const [currentPageId, setCurrentPageId] = useState(0);
  const [pageDragOffset, setPageDragOffset] = useState({ x: 0, y: 0 });
  const [isPageDragging, setIsPageDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidgetGallery, setShowWidgetGallery] = useState(false);
  const [widgetGalleryTab, setWidgetGalleryTab] = useState<'all' | 'os' | 'obsidget'>('all');
  const [widgetGallerySearch, setWidgetGallerySearch] = useState('');
  const [showPages, setShowPages] = useState(false);
  const [isPagesEditMode, setIsPagesEditMode] = useState(false);
  const [fullscreenWidgetId, setFullscreenWidgetId] = useState<string | null>(null);
  const [showPageDots, setShowPageDots] = useState(true);
  const [dotsExiting, setDotsExiting] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'appearance' | 'wallpapers'>('general');
  const [wallpaperExpandedSection, setWallpaperExpandedSection] = useState<string | null>(null);
  const [pageSnapOffset, setPageSnapOffset] = useState({ x: 0, y: 0 });
  const [editingItem, setEditingItem] = useState<WebOSItem | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPlaceholder, setDragPlaceholder] = useState<DragPlaceholder | null>(null);
  const [swapPreview, setSwapPreview] = useState<{
    targetId: string;
    targetPos: { x: number; y: number };
    draggedPos: { x: number; y: number };
  } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [altKeyHeld, setAltKeyHeld] = useState(false);
  const [edgeDragDirection, setEdgeDragDirection] = useState<'right' | 'left' | 'bottom' | 'top' | null>(null);

  const zIndexCounter = useRef(100);
  const dragItemRef = useRef<WebOSItem | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const backgroundLongPressTimer = useRef<number | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const modifierDragRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pageFlipTimer = useRef<number | null>(null);
  const pageFlipDir = useRef<{ x: number; y: number } | null>(null);
  const pageFlipStableTimer = useRef<number | null>(null);
  const pageFlipStablePos = useRef<{ x: number; y: number } | null>(null);
  const pageDragIdRef = useRef<number | null>(null);
  const pageDotsTimerRef = useRef<number | null>(null);
  const wheelLockRef = useRef<number | null>(null);
  const lastPageChangeTimeRef = useRef<number>(0);
  const PAGE_CHANGE_COOLDOWN_MS = 550;
  const pageSnapRafRef = useRef<number | null>(null);
  const pageDragAxisRef = useRef<'x' | 'y' | null>(null);
  const backgroundDragRef = useRef<{ x: number; y: number } | null>(null);
  const backgroundDragActiveRef = useRef(false);
  const pageDragOffsetRef = useRef({ x: 0, y: 0 });
  const pageDragRaf = useRef<number | null>(null);
  const dockContainerRef = useRef<HTMLDivElement | null>(null);
  const pageCreationBudgetRef = useRef(1);
  const isHydrated = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const prevResizeHandleRef = useRef<ResizeHandle | null>(null);
  const lastResizedByPognetRef = useRef<{ id: string; at: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const ignoreNextClickRef = useRef(false);
  const hasJustDraggedRef = useRef(false);
  const prevViewModeRef = useRef<string>(DEFAULT_CONFIG.viewMode);
  const gallerySearchInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputFocusedRef = useRef<HTMLInputElement | null>(null);
  const pageRenameFocusedRef = useRef<HTMLInputElement | null>(null);
  const swapPreviewTimerRef = useRef<number | null>(null);
  const pendingSwapPreviewRef = useRef<typeof swapPreview>(null);

  const [gridColsDisplay, setGridColsDisplay] = useState(LOGICAL_GRID_COLS);
  const [gridMaxRows, setGridMaxRows] = useState(LOGICAL_GRID_ROWS);
  const [cellSizePx, setCellSizePx] = useState(64);
  const [gridGapCol, setGridGapCol] = useState(16);
  const [gridGapRow, setGridGapRow] = useState(24);

  const gridCols = gridColsDisplay;
  const gridRowHeightDisplay = cellSizePx;
  const totalGridWidth = gridColsDisplay * cellSizePx + (gridColsDisplay - 1) * gridGapCol;
  const totalGridHeight = gridMaxRows * cellSizePx + (gridMaxRows - 1) * gridGapRow;

  const currentTheme = useMemo(() => {
    return THEMES[config.theme] || THEMES.dark;
  }, [config.theme]);

  // ... (Code for pages, pageIndex, etc. unchanged)
  const pages = useMemo(() => {
    const ids = new Set<number>();
    ids.add(0);
    ids.add(Number(currentPageId) || 0);
    items.forEach((item) => ids.add(Math.max(0, Math.floor(Number(item.pageIndex) || 0))));
    if (config.pageCoords) {
      Object.keys(config.pageCoords).forEach((key) => {
        const id = Number(key);
        if (!Number.isNaN(id)) ids.add(id);
      });
    }
    if (config.pageOrder && config.pageOrder.length > 0) {
      config.pageOrder.forEach((id) => ids.add(id));
    }
    const sorted = Array.from(ids).sort((a, b) => a - b);
    if (config.pageOrder && config.pageOrder.length > 0) {
      const ordered = config.pageOrder.filter((id) => ids.has(id));
      sorted.forEach((id) => {
        if (!ordered.includes(id)) ordered.push(id);
      });
      return ordered;
    }
    return sorted;
  }, [items, config.pageOrder, currentPageId]);

  const currentPageIndex = useMemo(() => {
    const idx = pages.indexOf(currentPageId);
    return idx === -1 ? 0 : idx;
  }, [pages, currentPageId]);

  const dockItems = useMemo(
    () => items.filter((item) => item.type === 'app').sort((a, b) => (a.dockOrder ?? 0) - (b.dockOrder ?? 0)),
    [items]
  );

  const currentPageLabel = useMemo(() => {
    const name = config.pageNames?.[currentPageId];
    return name && name.trim() ? name : `Page ${currentPageIndex + 1}`;
  }, [config.pageNames, currentPageId, currentPageIndex]);

  // ... (Utility functions unchanged)
  const isRemotePath = useCallback((value: string) => /^(https?:|data:|app:|file:)/i.test(value), []);
  const isVideoPath = useCallback(
    (value: string) => /^data:video\//i.test(value) || /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(value),
    []
  );

  const obsidgetMaxWidth = useMemo(() => {
    if (!obsidgetSettings) return undefined;
    return { value: obsidgetSettings.maxWidthValue, unit: obsidgetSettings.maxWidthUnit };
  }, [obsidgetSettings?.maxWidthUnit, obsidgetSettings?.maxWidthValue]);

  const defaultWidgetItems = useMemo(
    () => getDefaultItems(widgetTemplates).filter((item): item is WebOSWidgetItem => item.type === 'widget'),
    [widgetTemplates]
  );
  const builtInTemplates = useMemo(
    () => widgetTemplates.filter((template) => template.source !== 'obsidget'),
    [widgetTemplates]
  );
  const obsidgetTemplates = useMemo(
    () => widgetTemplates.filter((template) => template.source === 'obsidget'),
    [widgetTemplates]
  );
  const builtInTemplateIds = useMemo(() => new Set(builtInTemplates.map((template) => template.id)), [builtInTemplates]);
  const obsidgetTemplateIds = useMemo(() => new Set(obsidgetTemplates.map((t) => t.id)), [obsidgetTemplates]);
  const osExtraItems = useMemo(
    () => defaultWidgetItems.filter(
      (item) => !builtInTemplateIds.has(item.widgetId) && !obsidgetTemplateIds.has(item.widgetId)
    ),
    [defaultWidgetItems, builtInTemplateIds, obsidgetTemplateIds]
  );

  const resolveIcon = useCallback(
    (icon?: string) => {
      if (!icon) return undefined;
      if (/^(https?:|data:|app:|file:)/i.test(icon)) return icon;
      if (icon.includes('/')) return api.resolveResourcePath(icon);
      return undefined;
    },
    [api]
  );

  const resolvedWallpaper = useMemo(() => {
    if (!config.wallpaper) return api.resolveResourcePath(DEFAULT_CONFIG.wallpaper);
    const candidate = config.wallpaper.replace(/\\/g, '/');
    if (isRemotePath(candidate)) return candidate;
    return api.resolveResourcePath(candidate);
  }, [api, config.wallpaper, isRemotePath]);

  const [wallpaperSrc, setWallpaperSrc] = useState(resolvedWallpaper);
  const isVideoWallpaper = useMemo(() => isVideoPath(wallpaperSrc), [isVideoPath, wallpaperSrc]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltKeyHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltKeyHeld(false);
    };
    const onBlur = () => setAltKeyHeld(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    setWallpaperSrc(resolvedWallpaper);
  }, [resolvedWallpaper]);

  // ... (EventListeners, normalizations, hooks unchanged)
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-widget]')) {
        isWidgetInteractionRef.current = true;
      }
    };
    const handleFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Element && event.relatedTarget.closest('[data-widget]')) return;
      isWidgetInteractionRef.current = false;
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-widget]')) {
        isWidgetInteractionRef.current = true;
      } else {
        isWidgetInteractionRef.current = false;
      }
    };
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const normalizePageCoords = useCallback(
    (coords: Record<number, { x: number; y: number }> | undefined, pageIds: number[]) => {
      const next: Record<number, { x: number; y: number }> = {};
      let maxX = -1;
      if (coords) {
        Object.entries(coords).forEach(([key, value]) => {
          const id = Number(key);
          if (Number.isNaN(id) || !value) return;
          const x = Number.isFinite(value.x) ? value.x : 0;
          const y = Number.isFinite(value.y) ? value.y : 0;
          next[id] = { x, y };
          maxX = Math.max(maxX, x);
        });
      }
      pageIds.forEach((id) => {
        if (next[id]) return;
        next[id] = { x: maxX + 1, y: 0 };
        maxX += 1;
      });
      return next;
    },
    []
  );

  const arePageCoordsEqual = (a: Record<number, { x: number; y: number }> | undefined, b: Record<number, { x: number; y: number }> | undefined) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      const av = a[Number(key)];
      const bv = b[Number(key)];
      if (!av || !bv) return false;
      if (av.x !== bv.x || av.y !== bv.y) return false;
    }
    return true;
  };

  const pageCoords = useMemo(
    () => normalizePageCoords(config.pageCoords, pages),
    [config.pageCoords, pages, normalizePageCoords]
  );

  useEffect(() => {
    setConfig((prev) => {
      const normalized = normalizePageCoords(prev.pageCoords, pages);
      if (arePageCoordsEqual(prev.pageCoords, normalized)) return prev;
      return { ...prev, pageCoords: normalized };
    });
  }, [pages, normalizePageCoords]);

  const getPageCoord = useCallback(
    (pageId: number) => {
      return pageCoords[pageId] ?? { x: 0, y: 0 };
    },
    [pageCoords]
  );

  const coordToPageId = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach((id) => {
      const coord = getPageCoord(id);
      map.set(`${coord.x},${coord.y}`, id);
    });
    return map;
  }, [pages, getPageCoord]);

  const currentPageCoord = useMemo(() => getPageCoord(currentPageId), [currentPageId, getPageCoord]);

  // ... (Other useEffects and data loading logic unchanged)
  useEffect(() => {
    if (!pages.includes(currentPageId)) {
      setCurrentPageId(pages[0] ?? 0);
    }
  }, [pages, currentPageId]);

  useEffect(() => {
    const prev = prevViewModeRef.current;
    prevViewModeRef.current = config.viewMode;
    if (config.viewMode !== 'grid' || prev === 'grid') return;
    setItems((prevItems) => {
      const updated = prevItems.map((i) => ({ ...i }));
      updated
        .filter((i): i is WebOSItem & { type: 'app' } => i.type === 'app')
        .forEach((app) => {
          const ax = app.x ?? 0;
          const ay = app.y ?? 0;
          const aw = app.cols || 1;
          const ah = app.rows || 1;
          const pageIndex = app.pageIndex ?? 0;
          const overlaps = updated.some(
            (other) =>
              other.id !== app.id &&
              (other.pageIndex ?? 0) === pageIndex &&
              other.x != null &&
              other.y != null &&
              !(
                (other.x ?? 0) + (other.cols || 1) <= ax ||
                ax + aw <= (other.x ?? 0) ||
                (other.y ?? 0) + (other.rows || 1) <= ay ||
                ay + ah <= (other.y ?? 0)
              )
          );
          if (overlaps) {
            const slot = findFreeSlotForItems(updated, aw, ah, pageIndex, app.id);
            app.x = slot.x;
            app.y = slot.y;
          }
        });
      return updated;
    });
  }, [config.viewMode]);

  useEffect(() => {
    let active = true;
    api.loadState().then((data) => {
      if (!active) return;
      const savedGridSize = data?.config?.gridSize != null
        ? Math.max(GRID_SIZE_MIN, Math.min(GRID_SIZE_MAX, data.config.gridSize!))
        : null;
      const baseGridCols = savedGridSize ?? LOGICAL_GRID_COLS;
      const baseGridRowsFull = savedGridSize ?? LOGICAL_GRID_ROWS;
      const gridRowsForPlacement = baseGridRowsFull;
      const availableIds = getAvailableDefaultIds(WIDGET_TEMPLATES);
      if (data?.widgetTemplates?.length) {
        data.widgetTemplates.forEach((t) => availableIds.add(t.id));
      }
      if (data?.items?.length) {
        data.items.forEach((item) => {
          if (item.type === 'widget' && (item as WebOSWidgetItem).widgetId) {
            availableIds.add((item as WebOSWidgetItem).widgetId);
          }
        });
      }
      const defaultItemsList = getDefaultItems(WIDGET_TEMPLATES);

      if (data?.items?.length) {
        const migrated =
          (data.dataVersion ?? 0) >= 2 ? data.items : migrateItemsToSubUnits(data.items);
        let normalized = migrated.map((item) => {
          const pageIndex = Math.max(0, Math.floor(Number(item.pageIndex) || 0));
          const rawX = item.x != null ? Number(item.x) : NaN;
          const rawY = item.y != null ? Number(item.y) : NaN;
          const rawCols = item.cols != null ? Number(item.cols) : NaN;
          const rawRows = item.rows != null ? Number(item.rows) : NaN;
          const x = Number.isFinite(rawX) ? rawX : 1;
          const y = Number.isFinite(rawY) ? rawY : 1;
          const cols = Number.isFinite(rawCols) && rawCols >= 1 ? rawCols : Math.max(1, Math.floor(Number(item.cols) || 1));
          const rows = Number.isFinite(rawRows) && rawRows >= 1 ? rawRows : Math.max(1, Math.floor(Number(item.rows) || 1));
          let out = { ...item, pageIndex, x, y, cols, rows };
          if ((data.dataVersion ?? 0) < 3 && needsMigration(out)) {
            const logical = migrateItemToLogicalGrid(out);
            out = { ...out, ...logical };
          }
          return out;
        });

        const removed = normalized.filter(
          (item) =>
            item.type === 'widget' &&
            (item as WebOSWidgetItem).widgetId &&
            !availableIds.has((item as WebOSWidgetItem).widgetId)
        );
        if (removed.length > 0) {
          console.log(
            '[Nova] Widgets removed (template no longer in defaults):',
            removed.map((i) => (i as WebOSWidgetItem).widgetId)
          );
          normalized = normalized.filter(
            (item) =>
              item.type !== 'widget' ||
              !(item as WebOSWidgetItem).widgetId ||
              availableIds.has((item as WebOSWidgetItem).widgetId)
          );
        }

        const gridCols = baseGridCols;
        const gridRowsFull = baseGridRowsFull;

        const existingKeys = new Set(
          normalized.map((item) => (item.type === 'widget' ? (item as WebOSWidgetItem).widgetId : item.id))
        );
        const missingDefaults = defaultItemsList.filter((d) => {
          const key = d.type === 'widget' ? (d as WebOSWidgetItem).widgetId : d.id;
          return !existingKeys.has(key);
        });
        if (missingDefaults.length > 0) {
          const missingGrid = defaultItemsToGridUnits(missingDefaults);
          const placed = [...normalized];
          for (const item of missingGrid) {
            const cols = item.cols ?? 1;
            const rows = item.rows ?? 1;
            const slot = findFreeSlotForItemsStatic(placed, cols, rows, gridCols, gridRowsForPlacement);
            placed.push({ ...item, x: slot.x, y: slot.y, pageIndex: slot.pageIndex });
          }
          console.log('[Nova] Default widgets added:', missingDefaults.map((d) => (d as WebOSWidgetItem).widgetId ?? d.id));
          normalized = placed;
        }

        setItems(clampItemsToGrid(normalized, gridCols, gridRowsFull));
      } else {
        setItems(
          clampItemsToGrid(
            layoutDefaultItemsNoOverlap(defaultItemsToGridUnits(defaultItemsList), baseGridCols, gridRowsForPlacement),
            baseGridCols,
            baseGridRowsFull
          )
        );
      }

      if (data?.config) setConfig({ ...DEFAULT_CONFIG, ...data.config });
      if (data?.windows) {
        setWindows(data.windows);
        const maxZ = data.windows.reduce((max, win) => Math.max(max, win.zIndex), 100);
        zIndexCounter.current = maxZ + 1;
        const widgetWindow = data.windows.find((win) => win.kind === 'widget' && !win.isMinimized);
        if (widgetWindow?.widgetItemId) setFullscreenWidgetId(widgetWindow.widgetItemId);
        const active = data.windows.filter((win) => !win.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0];
        if (active) setActiveWindowId(active.id);
      }
      if (data?.widgetTemplates) {
        const saved = data.widgetTemplates;
        const savedIds = new Set(saved.map((t) => t.id));
        const merged = [...saved];
        for (const t of WIDGET_TEMPLATES) {
          if (!savedIds.has(t.id)) {
            merged.push(t);
            savedIds.add(t.id);
          }
        }
        setWidgetTemplates(merged);
      }
      isHydrated.current = true;
    });

    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    const updatePaneHeader = () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;
      const viewEl = rootEl.closest('.view');
      const headerEl = viewEl?.querySelector('.view-header') as HTMLElement | null;
      if (!headerEl) {
        setPaneHeaderHeight(0);
        return;
      }
      const headerRect = headerEl.getBoundingClientRect();
      const rootRect = rootEl.getBoundingClientRect();
      const overlap = Math.max(0, headerRect.bottom - rootRect.top);
      setPaneHeaderHeight(overlap);
    };
    updatePaneHeader();
    const onResize = () => updatePaneHeader();
    window.addEventListener('resize', updatePaneHeader);
    const timeoutId = window.setTimeout(updatePaneHeader, 0);
    return () => {
      window.removeEventListener('resize', updatePaneHeader);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    const leafEl = rootEl.closest('.workspace-leaf');
    if (!leafEl) return;
    leafEl.classList.add('webos-hide-header');
    return () => {
      leafEl.classList.remove('webos-hide-header');
    };
  }, []);

  // ... (Obsidget/Files/Video loaders unchanged)
  useEffect(() => {
    let active = true;
    const loadObsidget = async () => {
      const gallery = await api.getObsidgetGallery();
      const settings = await api.getObsidgetSettings();
      if (!active) return;
      if (settings) setObsidgetSettings(settings);
      if (!gallery || gallery.length === 0) return;
      const mapped = (gallery as Array<Record<string, unknown>>).map((entry) => {
        const colsNum = typeof entry.cols === 'number' ? entry.cols : Number(entry.cols);
        const rowsNum = typeof entry.rows === 'number' ? entry.rows : Number(entry.rows);
        return {
        id: String(entry.id || entry.name || `obsidget-${Math.random()}`),
        title: String(entry.name || entry.id || 'Widget'),
        cols: Number.isFinite(colsNum) && colsNum >= 1 ? colsNum : 8,
        rows: Number.isFinite(rowsNum) && rowsNum >= 1 ? rowsNum : 8,
        bgColor: '#1f2937',
        kind: 'runner' as const,
        html: typeof entry.html === 'string' ? entry.html : '',
        css: typeof entry.css === 'string' ? entry.css : '',
        js: typeof entry.js === 'string' ? entry.js : '',
        source: 'obsidget' as const,
        allowGrowBeyondTemplate: Boolean(entry.allowGrowBeyondTemplate)
      };
      });
      setWidgetTemplates((prev) => {
        const map = new Map(prev.map((template) => [template.id, template]));
        mapped.forEach((template) => {
          const existing = map.get(template.id);
          if (existing?.kind === 'react') return;
          if (existing?.source === 'obsidget') return;
          map.set(template.id, template);
        });
        return Array.from(map.values());
      });
    };
    loadObsidget();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!config.wallpaper || isRemotePath(config.wallpaper)) return;
    if (vaultWallpapers.length === 0) return;
    const normalized = config.wallpaper.replace(/\\/g, '/');
    if (vaultWallpapers.includes(normalized)) return;
    const targetName = normalized.split('/').pop()?.toLowerCase();
    if (!targetName) return;
    const match = vaultWallpapers.find((path) => path.split('/').pop()?.toLowerCase() === targetName);
    if (match) {
      setConfig((prev) => ({ ...prev, wallpaper: match }));
    }
  }, [config.wallpaper, vaultWallpapers, isRemotePath]);

  useEffect(() => {
    let active = true;
    const loadVaultWallpapers = async () => {
      const exts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'];
      const files: string[] = [];
      for (const ext of exts) {
        const found = await api.getFiles(ext);
        files.push(...found);
      }
      if (!active) return;
      const unique = Array.from(new Set(files));
      setVaultWallpapers(unique);
    };
    loadVaultWallpapers();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    let active = true;
    const loadVaultVideos = async () => {
      const exts = ['mp4', 'webm', 'mov', 'm4v', 'ogg'];
      const files: string[] = [];
      for (const ext of exts) {
        const found = await api.getFiles(ext);
        files.push(...found);
      }
      if (!active) return;
      const unique = Array.from(new Set(files));
      setVaultVideos(unique);
    };
    loadVaultVideos();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!isHydrated.current) return;
    const hadResizeHandle = prevResizeHandleRef.current != null;
    const releasedResizeId = hadResizeHandle && resizeHandle == null ? prevResizeHandleRef.current?.id ?? null : null;
    prevResizeHandleRef.current = resizeHandle;
    if (releasedResizeId) lastResizedByPognetRef.current = { id: releasedResizeId, at: Date.now() };
    if (hadResizeHandle && resizeHandle == null) {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      api.saveState({ items, config, windows, widgetTemplates, dataVersion: 3 });
      return () => {};
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api.saveState({ items, config, windows, widgetTemplates, dataVersion: 3 });
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [items, config, windows, widgetTemplates, resizeHandle, api]);

  // Mise à jour de la ref d'état courant pour que saveWidgetState (bridge) n'écrase pas items/config avec un state disque obsolète (ex. Jukebox qui enregistre ses paramètres après un déplacement).
  useEffect(() => {
    if (!currentStateRef) return;
    currentStateRef.current = {
      items,
      config,
      windows,
      widgetTemplates,
      dataVersion: 3
    };
    return () => {
      currentStateRef.current = null;
    };
  }, [items, config, windows, widgetTemplates, currentStateRef]);

  // Grille à cellules carrées (même taille en largeur et hauteur) pour éviter la déformation.
  // Taille de cellule minimale pour limiter le tassement au redimensionnement de la fenêtre.
  // On ne compte que les items de la page courante pour que la grille tienne dans le viewport (pas de rognage en bas).
  // Hauteur disponible = viewport (root) moins topInset et bottomInset (taskbar + edge + header) pour ne jamais placer de widgets sous la barre.
  const updateGridMetrics = useCallback(() => {
    const container = gridContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const EDGE_PADDING = 16;
    const MIN_BAR_SIZE = 56;
    const effectiveTopBar = config.barPosition === 'top' ? Math.max(barSize, MIN_BAR_SIZE) : 0;
    const effectiveBottomBar = config.barPosition === 'bottom' ? Math.max(barSize, MIN_BAR_SIZE) : 0;
    const topInset = (config.barPosition === 'top' ? effectiveTopBar + EDGE_PADDING : EDGE_PADDING) + paneHeaderHeight;
    const bottomInset = config.barPosition === 'bottom' ? effectiveBottomBar + EDGE_PADDING : EDGE_PADDING;
    const rootEl = rootRef.current;
    const viewportHeight = rootEl ? rootEl.getBoundingClientRect().height : window.innerHeight;
    const h = Math.max(0, viewportHeight - topInset - bottomInset);
    if (w <= 0 || h <= 0) return;

    const metrics = computeGridMetrics({
      viewportWidthPx: w,
      viewportHeightPx: h,
      widgetScale: config.widgetScale ?? 1,
      gridSize: config.gridSize
    });

    setCellSizePx(metrics.cellSizePx);
    setGridGapCol(metrics.gapColPx);
    setGridGapRow(metrics.gapRowPx);
    setGridColsDisplay(metrics.gridCols);
    setGridMaxRows(metrics.gridRows);
  }, [config.widgetScale, config.gridSize, config.barPosition, barSize, paneHeaderHeight]);

  useEffect(() => {
    updateGridMetrics();
    window.addEventListener('resize', updateGridMetrics);
    const rootEl = rootRef.current;
    if (rootEl) {
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => updateGridMetrics());
      });
      resizeObserver.observe(rootEl);
      return () => {
        window.removeEventListener('resize', updateGridMetrics);
        resizeObserver.disconnect();
      };
    }
    return () => window.removeEventListener('resize', updateGridMetrics);
  }, [updateGridMetrics]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => updateGridMetrics());
    return () => window.cancelAnimationFrame(id);
  }, [updateGridMetrics, currentPageId, barSize, config.barPosition]);

  // Quand l'utilisateur réduit la densité de la grille, clamp les items pour qu'ils restent dans la nouvelle grille (et soient sauvegardés correctement).
  useEffect(() => {
    const size = config.gridSize ?? LOGICAL_GRID_COLS;
    setItems((prev) => clampItemsToGrid(prev, size, size));
  }, [config.gridSize]);

  const ensurePageAtCoord = useCallback(
    (x: number, y: number, allowCreate = true) => {
      const key = `${x},${y}`;
      const existing = coordToPageId.get(key);
      if (existing !== undefined) {
        setCurrentPageId(existing);
        return true;
      }
      if (!allowCreate || pageCreationBudgetRef.current <= 0) return false;
      const nextId = Math.max(...pages) + 1;
      const nextOrder = [...pages, nextId];
      setConfig((prev) => ({
        ...prev,
        pageOrder: nextOrder,
        pageCoords: { ...(prev.pageCoords ?? {}), [nextId]: { x, y } }
      }));
      setCurrentPageId(nextId);
      pageCreationBudgetRef.current = Math.max(0, pageCreationBudgetRef.current - 1);
      return true;
    },
    [coordToPageId, pages]
  );

  const movePageBy = useCallback(
    (dx: number, dy: number, allowCreate = true) => {
      const coord = getPageCoord(currentPageId);
      const hasItems = items.some((item) => (item.pageIndex ?? 0) === currentPageId);
      const canCreate = allowCreate && hasItems;
      return ensurePageAtCoord(coord.x + dx, coord.y + dy, canCreate);
    },
    [ensurePageAtCoord, getPageCoord, currentPageId, items]
  );

  const animatePageChange = useCallback(
    (dx: number, dy: number, allowCreate = true) => {
      if (Date.now() - lastPageChangeTimeRef.current < PAGE_CHANGE_COOLDOWN_MS) return false;
      const moved = movePageBy(dx, dy, allowCreate);
      if (moved) {
        lastPageChangeTimeRef.current = Date.now();
        setPageSnapOffset({ x: dx * 100, y: dy * 100 });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setPageSnapOffset({ x: 0, y: 0 }));
        });
      }
      return moved;
    },
    [movePageBy]
  );

  const isWidgetInteractionRef = useRef(false);
  const isPageNavBlocked = false; 

  // Ne pas intercepter les touches quand le focus est dans un champ (recherche, renommage, etc.)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLElement && document.activeElement.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Tab') {
        const activeEl = document.activeElement;
        if (activeEl instanceof Element && activeEl.closest('input, textarea, [contenteditable="true"]')) return;
        if (showSettings || showWidgetGallery) return;
        if (showPages) return;
        event.preventDefault();
        setShowPages((prev) => !prev);
        setIsPagesEditMode(false);
        return;
      }
      if (draggingId && dragItemRef.current && !showSettings && !showWidgetGallery && !showPages) {
if (event.key === 'ArrowRight') {
        event.preventDefault();
        pageCreationBudgetRef.current = 1;
        if (animatePageChange(1, 0)) {
          setDragPlaceholder(null);
          setSwapPreview(null);
        }
          return;
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          pageCreationBudgetRef.current = 1;
          if (animatePageChange(-1, 0)) {
            setDragPlaceholder(null);
            setSwapPreview(null);
          }
          return;
        }
        if (event.key === 'ArrowUp') {
          if (config.lockVerticalSwipe) return;
          event.preventDefault();
          pageCreationBudgetRef.current = 1;
          if (animatePageChange(0, -1)) {
            setDragPlaceholder(null);
            setSwapPreview(null);
          }
          return;
        }
        if (event.key === 'ArrowDown') {
          if (config.lockVerticalSwipe) return;
          event.preventDefault();
          pageCreationBudgetRef.current = 1;
          if (animatePageChange(0, 1)) {
            setDragPlaceholder(null);
            setSwapPreview(null);
          }
          return;
        }
      }
        
      // Vérifier que le focus est dans notre plugin (ou que le body est actif et notre plugin visible)
      const isInInput = document.activeElement instanceof HTMLElement && 
        document.activeElement.closest('input, textarea, select, [contenteditable="true"]');
      const isPluginVisible = rootRef.current && rootRef.current.offsetParent !== null;
      const focusInPlugin = rootRef.current?.contains(document.activeElement) || 
        document.activeElement?.closest('.webos-root');
      const isPluginActive = isPluginVisible && (focusInPlugin || document.activeElement === document.body);
      
      // PageUp/PageDown : densité grille (si option activée) ou scale widgets/icônes
      if (event.key === 'PageUp' || event.key === 'PageDown') {
        if (!isPluginActive && !showSettings && !showWidgetGallery && !showPages) return;
        if (isInInput) return;
        event.preventDefault();
        if (config.pageUpDownChangesGridDensity) {
          const step = event.key === 'PageUp' ? GRID_SIZE_STEP : -GRID_SIZE_STEP;
          const current = config.gridSize ?? LOGICAL_GRID_COLS;
          const newSize = Math.max(GRID_SIZE_MIN, Math.min(GRID_SIZE_MAX, current + step));
          const newConfig = { ...config, gridSize: newSize };
          setConfig((prev) => ({ ...prev, gridSize: newSize }));
          api.saveState({ items, config: newConfig, windows, widgetTemplates, dataVersion: 3 });
          api.showNotice(`Grille : ${newSize} × ${newSize}`, 1500);
        } else {
          const delta = event.key === 'PageUp' ? 0.05 : -0.05;
          const newScale = Math.max(0.5, Math.min(1.5, (config.widgetScale ?? 1) + delta));
          const newConfig = { ...config, widgetScale: newScale };
          setConfig((prev) => ({ ...prev, widgetScale: newScale }));
          api.saveState({ items, config: newConfig, windows, widgetTemplates, dataVersion: 3 });
          api.showNotice(`Widgets / icônes : ${Math.round(newScale * 100)} %`, 1500);
        }
        return;
      }

      // Home/End (Début/Fin) pour le scale UI (persistant)
      if (event.key === 'Home' || event.key === 'End') {
        if (!isPluginActive && !showSettings && !showWidgetGallery && !showPages) return;
        if (isInInput) return;
        event.preventDefault();
        const delta = event.key === 'Home' ? 0.05 : -0.05;
        const newScale = Math.max(0.5, Math.min(1.5, (config.uiScale ?? 1) + delta));
        const newConfig = { ...config, uiScale: newScale };
        setConfig((prev) => ({ ...prev, uiScale: newScale }));
        api.saveState({ items, config: newConfig, windows, widgetTemplates, dataVersion: 3 });
        api.showNotice(`Interface (barre, menus) : ${Math.round(newScale * 100)} %`, 1500);
        return;
      }

      if (showSettings || showWidgetGallery || showPages) return;
      if (isWidgetInteractionRef.current) return;
      const activeEl = document.activeElement;
      if (activeEl instanceof Element && activeEl.closest('[data-widget]')) return;
      if (event.target instanceof Element && event.target.closest('[data-widget]')) return;
      if (event.key === 'ArrowRight') {
        pageCreationBudgetRef.current = 1;
        animatePageChange(1, 0);
      } else if (event.key === 'ArrowLeft') {
        pageCreationBudgetRef.current = 1;
        animatePageChange(-1, 0);
      } else if (event.key === 'ArrowUp') {
        if (config.lockVerticalSwipe) return;
        pageCreationBudgetRef.current = 1;
        animatePageChange(0, -1);
      } else if (event.key === 'ArrowDown') {
        if (config.lockVerticalSwipe) return;
        pageCreationBudgetRef.current = 1;
        animatePageChange(0, 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draggingId, showSettings, showWidgetGallery, showPages, isPageNavBlocked, animatePageChange, config, items, windows, widgetTemplates, api]);

  useEffect(() => {
    if (showWidgetGallery) {
      const t = window.setTimeout(() => gallerySearchInputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [showWidgetGallery]);

  // Scroll horizontal sur les bords (100px de chaque côté) - event listener non-passive pour permettre preventDefault
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    
    const handleWheel = (event: WheelEvent) => {
      if (showSettings || showWidgetGallery || showPages) return;
      const rect = el.getBoundingClientRect();
      const edgeThreshold = 100;
      const isLeftEdge = event.clientX - rect.left < edgeThreshold;
      const isRightEdge = rect.right - event.clientX < edgeThreshold;
      
      if ((isLeftEdge || isRightEdge) && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        const direction = event.deltaY > 0 ? (isRightEdge ? 1 : -1) : (isRightEdge ? -1 : 1);
        pageCreationBudgetRef.current = 1;
        animatePageChange(direction, 0);
      }
    };
    
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [showSettings, showWidgetGallery, showPages, animatePageChange]);

  const pageDotsDurationMs = config.pageDotsDurationMs ?? 5000;
  useEffect(() => {
    setShowPageDots(true);
    setDotsExiting(false);
    if (pageDotsTimerRef.current) {
      window.clearTimeout(pageDotsTimerRef.current);
      pageDotsTimerRef.current = null;
    }
    if (isPageDragging) return;
    pageDotsTimerRef.current = window.setTimeout(() => {
      pageDotsTimerRef.current = null;
      setDotsExiting(true);
      window.setTimeout(() => {
        setShowPageDots(false);
      }, 1000);
    }, pageDotsDurationMs);
    return () => {
      if (pageDotsTimerRef.current) {
        window.clearTimeout(pageDotsTimerRef.current);
        pageDotsTimerRef.current = null;
      }
    };
  }, [currentPageId, isPageDragging, pageDotsDurationMs]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isEditing || showSettings || showWidgetGallery || showPages) return;
      if (isWidgetInteractionRef.current) return;
      if (event.target instanceof Element && (event.target.closest('[data-widget]') || event.target.closest('[data-window]'))) return;
        
      if (Math.abs(event.deltaX) < 20 && Math.abs(event.deltaY) < 20) return;
      if (wheelLockRef.current) return;
      pageCreationBudgetRef.current = 1;
      let moved = false;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        moved = event.deltaX > 0 ? animatePageChange(1, 0) : animatePageChange(-1, 0);
      } else {
        if (config.lockVerticalSwipe) return;
        moved = event.deltaY > 0 ? animatePageChange(0, 1) : animatePageChange(0, -1);
      }
      if (moved) {
        if (wheelLockRef.current) window.clearTimeout(wheelLockRef.current);
        wheelLockRef.current = window.setTimeout(() => {
          wheelLockRef.current = null;
        }, 350);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (wheelLockRef.current) {
        window.clearTimeout(wheelLockRef.current);
        wheelLockRef.current = null;
      }
    };
  }, [isEditing, showSettings, showWidgetGallery, showPages, isPageNavBlocked, animatePageChange, config.lockVerticalSwipe]);

  // Taille de cellule fixe (carrée) pour positionnement et redimensionnement
  const getCellHeightPx = useCallback(() => cellSizePx, [cellSizePx]);
  const getCellWidthPx = useCallback(() => cellSizePx, [cellSizePx]);

  const pixelsToGrid = useCallback(
    (x: number, y: number, rect: DOMRect, cols?: number, rows?: number) => {
      const cellWidth = cellSizePx + gridGapCol;
      const cellHeight = cellSizePx + gridGapRow;
      const gridX = Math.floor((x - rect.left) / cellWidth) + 1;
      const gridY = Math.floor((y - rect.top) / cellHeight) + 1;
      const maxX = cols != null ? Math.max(1, gridColsDisplay - cols + 1) : gridColsDisplay;
      const maxY = rows != null ? Math.max(1, gridMaxRows - rows + 1) : gridMaxRows;
      return {
        x: Math.max(1, Math.min(gridX, maxX)),
        y: Math.max(1, Math.min(gridY, maxY))
      };
    },
    [gridColsDisplay, gridMaxRows, gridGapCol, gridGapRow, cellSizePx]
  );

  const getItemStyle = (item: WebOSItem) => {
    const layout = !item.x || !item.y ? layoutOverrides.get(item.id) : undefined;
    let x = layout?.x ?? item.x ?? 1;
    let y = layout?.y ?? item.y ?? 1;
    if (swapPreview && draggingId && item.id === swapPreview.targetId) {
      x = swapPreview.draggedPos.x;
      y = swapPreview.draggedPos.y;
    }
    // Clamp pour qu'aucun widget ne sorte de la page/grille : position et taille dans les limites.
    const xClamp = Math.max(1, Math.min(x, gridColsDisplay));
    const yClamp = Math.max(1, Math.min(y, gridMaxRows));
    const rawCols = item.cols || 1;
    const rawRows = item.rows || 1;
    const colsClamp = Math.max(1, Math.min(rawCols, gridColsDisplay - xClamp + 1));
    const rowsClamp = Math.max(1, Math.min(rawRows, gridMaxRows - yClamp + 1));
    const style: React.CSSProperties = {
      gridColumnStart: xClamp,
      gridRowStart: yClamp,
      gridColumnEnd: `span ${colsClamp}`,
      gridRowEnd: `span ${rowsClamp}`,
      minWidth: 0,
      minHeight: 0,
      alignSelf: 'stretch',
      justifySelf: 'stretch'
    };
    return style;
  };

  const updateItem = (id: string, updates: Partial<WebOSItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    if (PROTECTED_ITEM_IDS.has(id)) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const findFreeSlot = (cols: number, rows: number): { x: number; y: number; pageIndex: number } => {
    const gridItems =
      config.viewMode === 'desktop' ? items.filter((i) => i.type !== 'app') : items;
    const maxPagesTry = 10;
    for (let pageOffset = 0; pageOffset < maxPagesTry; pageOffset += 1) {
      const pageId = currentPageId + pageOffset;
      for (let y = 1; y <= gridMaxRows; y += 1) {
        for (let x = 1; x <= gridColsDisplay - cols + 1; x += 1) {
          const overlaps = gridItems.some((item) => {
            if ((item.pageIndex ?? 0) !== pageId) return false;
            if (!item.x || !item.y) return false;
            const width = item.cols || 1;
            const height = item.rows || 1;
            return !(item.x + width <= x || x + cols <= item.x || item.y + height <= y || y + rows <= item.y);
          });
          if (!overlaps) return { x, y, pageIndex: pageId };
        }
      }
    }
    return { x: 1, y: 1, pageIndex: currentPageId };
  };

  const findFreeSlotForItems = (
    list: WebOSItem[],
    cols: number,
    rows: number,
    pageIndex: number,
    ignoreId?: string
  ) => {
    for (let y = 1; y <= gridMaxRows; y += 1) {
      for (let x = 1; x <= gridColsDisplay - cols + 1; x += 1) {
        const overlaps = list.some((item) => {
          if (item.id === ignoreId) return false;
          if ((item.pageIndex ?? 0) !== pageIndex) return false;
          if (!item.x || !item.y) return false;
          const width = item.cols || 1;
          const height = item.rows || 1;
          return !(item.x + width <= x || x + cols <= item.x || item.y + height <= y || y + rows <= item.y);
        });
        if (!overlaps) return { x, y };
      }
    }
    return { x: 1, y: 1 };
  };

  // ... (Resolve overlaps, Window handling unchanged)
  const resolveOverlapsAfterResize = (resizedId: string) => {
    setItems((prev) => {
      const updated = [...prev];
      const resized = updated.find((item) => item.id === resizedId);
      if (!resized || !resized.x || !resized.y) return prev;
      const pageIndex = resized.pageIndex ?? 0;
      const width = resized.cols || 1;
      const height = resized.rows || 1;
      const overlaps = (item: WebOSItem) => {
        if (!item.x || !item.y) return false;
        const w = item.cols || 1;
        const h = item.rows || 1;
        return !(
          item.x + w <= resized.x! ||
          resized.x! + width <= item.x ||
          item.y + h <= resized.y! ||
          resized.y! + height <= item.y
        );
      };

      const listToCheck =
        config.viewMode === 'desktop' ? updated.filter((i) => i.type !== 'app') : updated;
      updated.forEach((item) => {
        if (item.id === resizedId) return;
        if ((item.pageIndex ?? 0) !== pageIndex) return;
        if (overlaps(item)) {
          const slot = findFreeSlotForItems(listToCheck, item.cols || 1, item.rows || 1, pageIndex, resizedId);
          item.x = slot.x;
          item.y = slot.y;
        }
      });
      return updated;
    });
  };

  // Dimensions Obsidget : centralisées dans l'item grille (cols/rows). Le widget reste 100%
  // et remplit la cellule ; onSizeChange met à jour cols/rows → la poignée suit en bas à droite.
  // Les widgets qui s'agrandissent (kanban, todo list, etc.) peuvent faire grandir la cellule
  // dynamiquement ; la poignée de redimensionnement Nova reste au bord et suit.
  const handleObsidgetSizeChange = useCallback(
    (id: string, size: { width: number; height: number }) => {
      if (!size || size.width <= 0 || size.height <= 0) return;
      // Ne pas mettre à jour la grille pendant que la galerie est ouverte : évite les re-renders
      // qui font perdre le focus du champ recherche.
      if (showWidgetGallery) return;
      // En mode édition, ne pas appliquer les rapports de taille : évite que les widgets
      // qui se mettent à jour (timer, etc.) fassent grandir la cellule à chaque refresh.
      if (isEditing) return;
      // Bloquer seulement si l'utilisateur est en train de redimensionner/déplacer via Nova
      if (resizeHandle?.id === id || draggingId === id) return;
      // Ne pas écraser la taille juste après un redimensionnement manuel (pognet) : le widget peut rapporter une taille plus petite
      const lastPognet = lastResizedByPognetRef.current;
      if (lastPognet?.id === id && Date.now() - lastPognet.at < 800) return;

      const container = gridRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      // Ignorer un rapport "quasi pleine largeur/hauteur" uniquement si la cellule est encore
      // toute petite (évite le premier paint qui prétend remplir tout). Sinon autoriser la mise à jour.
      const item = items.find((i) => i.id === id);
      const currentCols = item?.cols || 1;
      const currentRows = item?.rows || 1;
      const isTinyCell = (currentCols <= 2 && currentRows <= 2);
      if (
        isTinyCell &&
        (size.width >= rect.width * 0.92 || size.height >= (rect.height || 1) * 0.92)
      )
        return;
      const cellWidth = cellSizePx + gridGapCol;
      const cellHeightPx = cellSizePx + gridGapRow;
      const nextColsRaw = Math.max(1, Math.ceil((size.width + gridGapCol) / cellWidth));
      const nextRowsRaw = Math.max(1, Math.ceil((size.height + gridGapRow) / cellHeightPx));
      const template = widgetTemplates.find((tpl) => tpl.id === (item as WebOSWidgetItem | undefined)?.widgetId);
      const templateCols = template?.cols != null ? template.cols : undefined;
      const templateRows = template?.rows != null ? template.rows : undefined;

      setItems((prev) => {
        let changed = false;
        const updated = prev.map((item) => {
          if (item.id !== id) return item;
          const maxCols = item.x ? Math.max(1, gridColsDisplay - item.x + 1) : gridColsDisplay;
          const maxRows = item.y ? Math.max(1, gridMaxRows - item.y + 1) : gridMaxRows;
          const currentCols = item.cols || 1;
          const currentRows = item.rows || 1;
          const estimatedCurrentWidth = currentCols * cellWidth - gridGapCol;
          const estimatedCurrentHeight = currentRows * cellHeightPx - gridGapRow;
          const widthDelta = size.width - estimatedCurrentWidth;
          const heightDelta = size.height - estimatedCurrentHeight;
          const threshold = cellWidth * 0.4;
          const allowWidthShrink = widthDelta < -threshold;
          const allowHeightShrink = heightDelta < -threshold;
          const allowWidthGrow = widthDelta > threshold;
          const allowHeightGrow = heightDelta > threshold;
          // Par défaut plafonné au template (Code Garden reste 7×14). Si allowGrowBeyondTemplate (Kanban), peut dépasser.
          const allowGrow = template?.allowGrowBeyondTemplate === true;
          const capCols =
            templateCols != null && !allowGrow ? Math.min(maxCols, templateCols) : maxCols;
          const capRows =
            templateRows != null && !allowGrow ? Math.min(maxRows, templateRows) : maxRows;
          const nextCols = allowWidthShrink
            ? Math.max(1, Math.min(nextColsRaw, currentCols, maxCols))
            : allowWidthGrow
              ? Math.min(Math.max(nextColsRaw, currentCols), capCols)
              : currentCols;
          const nextRows = allowHeightShrink
            ? Math.max(1, Math.min(nextRowsRaw, currentRows, maxRows))
            : allowHeightGrow
              ? Math.min(Math.max(nextRowsRaw, currentRows), capRows)
              : currentRows;
          // Plancher template : ne jamais rétrécir en dessous (Code Garden garde 7×14, etc.).
          const finalCols = templateCols != null ? Math.max(nextCols, templateCols) : nextCols;
          const finalRows = templateRows != null ? Math.max(nextRows, templateRows) : nextRows;
          if (currentCols === finalCols && currentRows === finalRows) return item;
          changed = true;
          return { ...item, cols: finalCols, rows: finalRows };
        });
        if (!changed) return prev;

        const resized = updated.find((item) => item.id === id);
        if (!resized || !resized.x || !resized.y) return updated;
        const pageIndex = resized.pageIndex ?? 0;
        const resizedOld = prev.find((i) => i.id === id);
        const resizedOldRows = resizedOld?.rows ?? 1;
        const resizedOldCols = resizedOld?.cols ?? 1;
        const width = resized.cols || 1;
        const height = resized.rows || 1;
        const deltaRows = height - resizedOldRows;
        const deltaCols = width - resizedOldCols;

        const listToCheck =
          config.viewMode === 'desktop' ? updated.filter((i) => i.type !== 'app') : updated;

        // Quand le widget grandit : décaler vers le bas les widgets en dessous (même colonne), vers la droite ceux à droite (même ligne).
        if (deltaRows > 0 || deltaCols > 0) {
          const overlapsX = (it: WebOSItem) => {
            if (!it.x) return false;
            const w = it.cols || 1;
            return !(it.x + w <= resized.x! || resized.x! + width <= it.x);
          };
          const overlapsY = (it: WebOSItem) => {
            if (!it.y) return false;
            const h = it.rows || 1;
            return !(it.y + h <= resized.y! || resized.y! + height <= it.y);
          };
          // Widgets en dessous : même page, chevauchent en x, et commencent à ou sous l’ancien bas du widget agrandi → décaler vers le bas.
          if (deltaRows > 0) {
            const newBottom = resized.y! + height;
            const below = listToCheck.filter(
              (it) =>
                it.id !== id &&
                (it.pageIndex ?? 0) === pageIndex &&
                overlapsX(it) &&
                (it.y ?? 0) < newBottom &&
                (it.y ?? 0) + (it.rows ?? 1) > resized.y!
            );
            below.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
            below.forEach((it) => {
              const idx = updated.findIndex((i) => i.id === it.id);
              if (idx >= 0) updated[idx] = { ...it, y: (it.y ?? 0) + deltaRows };
            });
          }
          // Widgets à droite : même page, chevauchent en y, et commencent à ou après l’ancienne fin du widget agrandi → décaler vers la droite.
          if (deltaCols > 0) {
            const newRight = resized.x! + width;
            const right = listToCheck.filter(
              (it) =>
                it.id !== id &&
                (it.pageIndex ?? 0) === pageIndex &&
                overlapsY(it) &&
                (it.x ?? 0) < newRight &&
                (it.x ?? 0) + (it.cols ?? 1) > resized.x!
            );
            right.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
            right.forEach((it) => {
              const idx = updated.findIndex((i) => i.id === it.id);
              if (idx >= 0) updated[idx] = { ...it, x: (it.x ?? 0) + deltaCols };
            });
          }
        }

        // Pour tout chevauchement restant (ex. rétrécissement ou cas limites), replacer dans une case libre (utiliser updated pour refléter les décalages déjà faits).
        const listAfterPush =
          config.viewMode === 'desktop' ? updated.filter((i) => i.type !== 'app') : updated;
        const overlaps = (item: WebOSItem) => {
          if (!item.x || !item.y) return false;
          const w = item.cols || 1;
          const h = item.rows || 1;
          return !(
            item.x + w <= resized.x! ||
            resized.x! + width <= item.x ||
            item.y + h <= resized.y! ||
            resized.y! + height <= item.y
          );
        };
        updated.forEach((item) => {
          if (item.id === id) return;
          if ((item.pageIndex ?? 0) !== pageIndex) return;
          if (overlaps(item)) {
            const slot = findFreeSlotForItems(listAfterPush, item.cols || 1, item.rows || 1, pageIndex, id);
            item.x = slot.x;
            item.y = slot.y;
          }
        });
        return updated;
      });
    },
    [
      config.viewMode,
      cellSizePx,
      draggingId,
      gridColsDisplay,
      gridGapCol,
      gridGapRow,
      gridMaxRows,
      isEditing,
      items,
      resizeHandle,
      showWidgetGallery,
      widgetTemplates
    ]
  );

  const openWindowForItem = (item: WebOSItem, details: Partial<WebOSWindow>) => {
    const existing = windows.find((win) => win.itemId === item.id && win.kind === details.kind);
    if (existing) {
      focusWindow(existing.id);
      if (existing.isMinimized) minimizeWindow(existing.id);
      return;
    }

    const newWindow: WebOSWindow = {
      id: `${Date.now()}`,
      itemId: item.id,
      title: details.title || item.title,
      kind: details.kind || 'custom',
      url: details.url,
      path: details.path,
      history: details.url ? [details.url] : [],
      historyIndex: details.url ? 0 : -1,
      x: 100 + windows.length * 20,
      y: 100 + windows.length * 20,
      w: 840,
      h: 560,
      zIndex: zIndexCounter.current + 1,
      isMinimized: false,
      isMaximized: false
    };

    zIndexCounter.current += 1;
    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  };

  const closeWindow = (id: string) => {
    const closed = windows.find((win) => win.id === id);
    setWindows((prev) => prev.filter((win) => win.id !== id));
    if (closed?.kind === 'widget' && closed.widgetItemId) {
      setFullscreenWidgetId((prev) => (prev === closed.widgetItemId ? null : prev));
    }
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const focusWindow = (id: string) => {
    zIndexCounter.current += 1;
    setWindows((prev) =>
      prev.map((win) => (win.id === id ? { ...win, zIndex: zIndexCounter.current } : win))
    );
    setActiveWindowId(id);
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((win) => {
        if (win.id !== id) return win;
        const next = { ...win, isMinimized: !win.isMinimized };
        if (next.kind === 'widget' && next.isMinimized && next.widgetItemId) {
          setFullscreenWidgetId((current) => (current === next.widgetItemId ? null : current));
        }
        if (next.isMinimized && activeWindowId === id) {
          setActiveWindowId(null);
        }
        return next;
      })
    );
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, isMaximized: !win.isMaximized } : win)));
  };

  const updateWindow = (id: string, updates: Partial<WebOSWindow>) => {
    setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, ...updates } : win)));
  };

  const openWidgetWindow = (
    widgetItem: WebOSWidgetItem,
    options: { itemId?: string; fullscreen?: boolean }
  ) => {
    const itemId = options.itemId ?? widgetItem.id;
    const existing = windows.find(
      (w) => w.kind === 'widget' && (options.itemId ? w.itemId === options.itemId : w.widgetItemId === widgetItem.id)
    );
    if (existing) {
      focusWindow(existing.id);
      if (existing.isMinimized) minimizeWindow(existing.id);
      return;
    }
    const newWindow: WebOSWindow = {
      id: `widget-${itemId}-${Date.now()}`,
      itemId,
      widgetItemId: widgetItem.id,
      title: widgetItem.title || 'Widget',
      kind: 'widget',
      x: 80,
      y: 80,
      w: 900,
      h: 650,
      zIndex: zIndexCounter.current + 1,
      isMinimized: false,
      isMaximized: options.fullscreen ?? false
    };
    zIndexCounter.current += 1;
    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    if (options.fullscreen) setFullscreenWidgetId(widgetItem.id);
  };

  const launchItem = (item: WebOSItem) => {
    if (item.type !== 'app') return;
    const appItem = item as WebOSAppItem;
    if (appItem.appId === 'pinned-widget' && appItem.pinnedWidgetItemId) {
      const widgetItem = items.find(
        (i): i is WebOSWidgetItem => i.type === 'widget' && i.id === appItem.pinnedWidgetItemId
      );
      if (widgetItem) openWidgetWindow(widgetItem, { itemId: item.id });
      return;
    }
    if (appItem.appId === 'finder') {
      openWindowForItem(item, { kind: 'finder', title: 'Finder' });
      return;
    }

    if (appItem.url) {
      if (appItem.external) window.open(appItem.url, '_blank');
      else openWindowForItem(item, { kind: 'url', url: appItem.url, title: item.title });
    }
  };

  // ... (Pointer/Touch handlers for Drag & Drop - largely unchanged)
  const handlePointerDown = (event: React.PointerEvent, item: WebOSItem) => {
    pointerDownPos.current = { x: event.clientX, y: event.clientY };
    pageCreationBudgetRef.current = 1;
    setPageSnapOffset({ x: 0, y: 0 });
    if (pageSnapRafRef.current) {
      window.cancelAnimationFrame(pageSnapRafRef.current);
      pageSnapRafRef.current = null;
    }
    pageDragAxisRef.current = null;
    const hasModifier = event.shiftKey || event.ctrlKey || event.altKey;
    if (hasModifier) {
      modifierDragRef.current = true;
      event.preventDefault();
      startDrag(event, item);
      return;
    }
    modifierDragRef.current = false;
    if (!isEditing) {
      longPressTimer.current = window.setTimeout(() => {
        setIsEditing(true);
        startDrag(event, item);
      }, 600);
      return;
    }
    event.preventDefault();
    startDrag(event, item);
  };

  const startDrag = (event: React.PointerEvent, item: WebOSItem) => {
    const element = document.getElementById(item.id);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setDragPos({ x: event.clientX, y: event.clientY });
    dragItemRef.current = item;
    setDraggingId(item.id);
    if (event.target instanceof Element && event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (backgroundLongPressTimer.current && pointerDownPos.current) {
      const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
      if (dist > 30) {
        window.clearTimeout(backgroundLongPressTimer.current);
        backgroundLongPressTimer.current = null;
      }
    }

    if (
      backgroundDragActiveRef.current &&
      backgroundDragRef.current &&
      !isEditing &&
      !draggingId &&
      !isPageNavBlocked
    ) {
      const dx = event.clientX - backgroundDragRef.current.x;
      const dy = event.clientY - backgroundDragRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (!pageDragAxisRef.current && (absDx > 6 || absDy > 6)) {
        pageDragAxisRef.current = absDx >= absDy ? 'x' : 'y';
      }
      if (pageDragAxisRef.current === 'x') {
        const rect = gridRef.current?.getBoundingClientRect();
        const containerWidth = rect && rect.width > 50 ? rect.width : window.innerWidth;
        const dragPercent = Math.max(-100, Math.min(100, (dx / containerWidth) * 100));
        setIsPageDragging(true);
        setPageDragOffsetRaf({ x: dragPercent, y: 0 });
      } else if (pageDragAxisRef.current === 'y') {
        if (config.lockVerticalSwipe) return;
        const rect = gridRef.current?.getBoundingClientRect();
        const containerHeight = rect && rect.height > 50 ? rect.height : window.innerHeight;
        const dragPercent = Math.max(-100, Math.min(100, (dy / containerHeight) * 100));
        setIsPageDragging(true);
        setPageDragOffsetRaf({ x: 0, y: dragPercent });
      } else if (isPageDragging) {
        setPageDragOffsetRaf({ x: 0, y: 0 });
      }
    }
    if (pointerDownPos.current && !draggingId && !resizeHandle) {
      const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
      if (dist > 10 && longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    if (resizeHandle) {
      event.preventDefault();
      const diffX = event.clientX - resizeHandle.startX;
      const diffY = event.clientY - resizeHandle.startY;
      const rect = gridRef.current?.getBoundingClientRect();
      const cellWidthPx = cellSizePx + gridGapCol;
      const cellHeightPx = cellSizePx + gridGapRow;
      const colDiff = Math.round(diffX / cellWidthPx);
      const rowDiff = Math.round(diffY / cellHeightPx);
      const rawCols = Math.max(1, resizeHandle.startCols + colDiff);
      const rawRows = Math.max(1, resizeHandle.startRows + rowDiff);
      const resizedItem = items.find((item) => item.id === resizeHandle.id);
      if (resizedItem?.x && resizedItem?.y) {
        const maxCols = Math.max(1, gridColsDisplay - resizedItem.x + 1);
        const maxRows = Math.max(1, gridMaxRows - resizedItem.y + 1);
        const newCols = Math.min(rawCols, maxCols);
        const newRows = Math.min(rawRows, maxRows);
        const overlaps = items.some((item) => {
          if (item.id === resizeHandle.id) return false;
          if (config.viewMode === 'desktop' && item.type === 'app') return false;
          if ((item.pageIndex ?? 0) !== (resizedItem.pageIndex ?? 0)) return false;
          if (!item.x || !item.y) return false;
          const w = item.cols || 1;
          const h = item.rows || 1;
          return !(
            item.x + w <= resizedItem.x! ||
            resizedItem.x! + newCols <= item.x ||
            item.y + h <= resizedItem.y! ||
            resizedItem.y! + newRows <= item.y
          );
        });
        if (newCols !== resizeHandle.currentCols || newRows !== resizeHandle.currentRows) {
          updateItem(resizeHandle.id, { cols: newCols, rows: newRows });
          setResizeHandle({ ...resizeHandle, currentCols: newCols, currentRows: newRows });
          if (overlaps) resolveOverlapsAfterResize(resizeHandle.id);
        }
      }
      return;
    }

    if (!draggingId || !dragItemRef.current) return;
    event.preventDefault();
    setDragPos({ x: event.clientX, y: event.clientY });

    if (!isPageNavBlocked) {
      const edgeThreshold = 24;
      const stableMs = 350;
      const stillThresholdPx = 10;
      const flipDelayMs = 1000;
      const containerRect = gridRef.current?.getBoundingClientRect();
      const rightEdge = containerRect ? containerRect.right : window.innerWidth;
      const leftEdge = containerRect ? containerRect.left : 0;
      const topEdge = containerRect ? containerRect.top : 0;
      const bottomEdge = containerRect ? containerRect.bottom : window.innerHeight;

      const scheduleFlip = (dx: number, dy: number) => {
        if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
        pageFlipStableTimer.current = null;
        pageFlipStablePos.current = null;
        const currentDir = pageFlipDir.current;
        if (currentDir && currentDir.x === dx && currentDir.y === dy && pageFlipTimer.current) return;
        if (pageFlipTimer.current) window.clearTimeout(pageFlipTimer.current);
        pageFlipDir.current = { x: dx, y: dy };
        pageFlipTimer.current = window.setTimeout(() => {
          movePageBy(dx, dy);
        }, flipDelayMs);
      };

      const clearFlip = () => {
        if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
        pageFlipStableTimer.current = null;
        pageFlipStablePos.current = null;
        if (pageFlipTimer.current) window.clearTimeout(pageFlipTimer.current);
        pageFlipTimer.current = null;
        pageFlipDir.current = null;
      };

      const px = event.clientX;
      const py = event.clientY;
      const inRight = px > rightEdge - edgeThreshold;
      const inLeft = px < leftEdge + edgeThreshold;
      const inBottom = py > bottomEdge - edgeThreshold;
      const inTop = py < topEdge + edgeThreshold;

      if (inRight) {
        setEdgeDragDirection('right');
        const last = pageFlipStablePos.current;
        const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
        if (!still) {
          if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
          pageFlipStableTimer.current = null;
          pageFlipStablePos.current = { x: px, y: py };
        } else if (!pageFlipStableTimer.current) {
          pageFlipStablePos.current = { x: px, y: py };
          pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(1, 0), stableMs);
        }
      } else if (inLeft) {
        setEdgeDragDirection('left');
        const last = pageFlipStablePos.current;
        const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
        if (!still) {
          if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
          pageFlipStableTimer.current = null;
          pageFlipStablePos.current = { x: px, y: py };
        } else if (!pageFlipStableTimer.current) {
          pageFlipStablePos.current = { x: px, y: py };
          pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(-1, 0), stableMs);
        }
      } else if (inBottom) {
        setEdgeDragDirection('bottom');
        const last = pageFlipStablePos.current;
        const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
        if (!still) {
          if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
          pageFlipStableTimer.current = null;
          pageFlipStablePos.current = { x: px, y: py };
        } else if (!pageFlipStableTimer.current) {
          pageFlipStablePos.current = { x: px, y: py };
          pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(0, 1), stableMs);
        }
      } else if (inTop) {
        setEdgeDragDirection('top');
        const last = pageFlipStablePos.current;
        const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
        if (!still) {
          if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
          pageFlipStableTimer.current = null;
          pageFlipStablePos.current = { x: px, y: py };
        } else if (!pageFlipStableTimer.current) {
          pageFlipStablePos.current = { x: px, y: py };
          pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(0, -1), stableMs);
        }
      } else {
        clearFlip();
        setEdgeDragDirection(null);
      }
    }

    const container = gridRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const itemX = event.clientX - dragOffset.x;
      const itemY = event.clientY - dragOffset.y;
      const w = dragItemRef.current.cols || 1;
      const h = dragItemRef.current.rows || 1;
      const { x, y } = pixelsToGrid(itemX, itemY, rect, w, h);
      const placeholder = { x, y, w, h };
      setDragPlaceholder(placeholder);

      const draggedX = dragItemRef.current.x ?? layoutOverrides.get(dragItemRef.current.id)?.x;
      const draggedY = dragItemRef.current.y ?? layoutOverrides.get(dragItemRef.current.id)?.y;
      const overlapTarget = items.find((item) => {
        if (item.id === draggingId) return false;
        if (config.viewMode === 'desktop' && item.type === 'app') return false;
        if ((item.pageIndex ?? 0) !== currentPageId) return false;
        const ix = item.x ?? layoutOverrides.get(item.id)?.x;
        const iy = item.y ?? layoutOverrides.get(item.id)?.y;
        if (!ix || !iy) return false;
        const iw = item.cols || 1;
        const ih = item.rows || 1;
        return !(
          ix + iw <= placeholder.x ||
          placeholder.x + placeholder.w <= ix ||
          iy + ih <= placeholder.y ||
          placeholder.y + placeholder.h <= iy
        );
      });

      const nextPreview =
        overlapTarget && draggedX && draggedY
          ? {
              targetId: overlapTarget.id,
              targetPos: {
                x: overlapTarget.x ?? layoutOverrides.get(overlapTarget.id)?.x ?? 0,
                y: overlapTarget.y ?? layoutOverrides.get(overlapTarget.id)?.y ?? 0
              },
              draggedPos: { x: draggedX, y: draggedY }
            }
          : null;

      // Délai avant de réorganiser (swap) : 1 s pour pouvoir survoler un widget sans l'affecter
      const SWAP_DELAY_MS = 1000;
      const pendingTarget = pendingSwapPreviewRef.current?.targetId;
      const nextTarget = nextPreview?.targetId;
      const isSameTarget = pendingTarget != null && nextTarget != null && pendingTarget === nextTarget;
      
      if (!nextPreview) {
        // Plus de cible : annuler immédiatement
        if (swapPreviewTimerRef.current) {
          window.clearTimeout(swapPreviewTimerRef.current);
          swapPreviewTimerRef.current = null;
        }
        pendingSwapPreviewRef.current = null;
        setSwapPreview(null);
      } else if (!isSameTarget) {
        // Nouvelle cible : redémarrer le timer et annuler le swap actuel
        if (swapPreviewTimerRef.current) {
          window.clearTimeout(swapPreviewTimerRef.current);
        }
        pendingSwapPreviewRef.current = nextPreview;
        setSwapPreview(null); // Annuler l'ancien swap pendant l'attente
        swapPreviewTimerRef.current = window.setTimeout(() => {
          if (pendingSwapPreviewRef.current && pendingSwapPreviewRef.current.targetPos.x && pendingSwapPreviewRef.current.targetPos.y) {
            setSwapPreview(pendingSwapPreviewRef.current);
          }
          swapPreviewTimerRef.current = null;
        }, SWAP_DELAY_MS);
      }
      // Si même cible, on ne fait rien (le timer est déjà en cours)
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (backgroundLongPressTimer.current) {
      window.clearTimeout(backgroundLongPressTimer.current);
      backgroundLongPressTimer.current = null;
    }
    if (pageFlipStableTimer.current) {
      window.clearTimeout(pageFlipStableTimer.current);
      pageFlipStableTimer.current = null;
      pageFlipStablePos.current = null;
    }
    if (pageFlipTimer.current) {
      window.clearTimeout(pageFlipTimer.current);
      pageFlipTimer.current = null;
      pageFlipDir.current = null;
    }
    if (
      backgroundDragActiveRef.current &&
      backgroundDragRef.current &&
      !isEditing &&
      !draggingId &&
      !isPageNavBlocked
    ) {
      const dx = event.clientX - backgroundDragRef.current.x;
      const dy = event.clientY - backgroundDragRef.current.y;
      const dragOffset = pageDragOffsetRef.current;
      if (isPageDragging) {
        let snapped = false;
        if (Math.abs(dragOffset.x) >= 30 && Math.abs(dragOffset.x) >= Math.abs(dragOffset.y)) {
          const dirX = dragOffset.x < 1 ? 1 : -1;
          const snapped = movePageBy(dirX, 0);
          schedulePageSnap({ x: dragOffset.x + dirX * 100, y: dragOffset.y });
        } else if (Math.abs(dragOffset.y) >= 30 && Math.abs(dragOffset.y) >= Math.abs(dragOffset.x)) {
          if (!config.lockVerticalSwipe) {
            const dirY = dragOffset.y < 0 ? 1 : -1;
            const snapped = movePageBy(0, dirY);
            schedulePageSnap({ x: dragOffset.x, y: dragOffset.y + dirY * 100 });
          }
        }
        if (!snapped) {
          schedulePageSnap({ x: dragOffset.x, y: dragOffset.y });
        }
      } else if (Math.abs(dx) > swipeThreshold && Math.abs(dy) < swipePerpTolerance) {
        animatePageChange(dx < 0 ? 1 : -1, 0);
      } else if (Math.abs(dy) > swipeThreshold && Math.abs(dx) < swipePerpTolerance) {
        if (!config.lockVerticalSwipe) animatePageChange(0, dy < 0 ? 1 : -1);
      }
    }
    if (isPageDragging) {
      setIsPageDragging(false);
    }
    backgroundDragRef.current = null;
    backgroundDragActiveRef.current = false;

    if (resizeHandle) {
      if (config.debugWidgetDimensions) {
        const item = items.find((i) => i.id === resizeHandle.id);
        if (item) {
          const cols = resizeHandle.currentCols;
          const rows = resizeHandle.currentRows;
          const widthPx = Math.round(cols * (cellSizePx + gridGapCol) - gridGapCol);
          const heightPx = Math.round(rows * (cellSizePx + gridGapRow) - gridGapRow);
          const label = item.type === 'widget' ? (item as WebOSWidgetItem).widgetId : item.title;
          console.log('[Nova] Widget redimensionné', {
            id: item.id,
            label,
            grille: { x: item.x, y: item.y, cols, rows },
            px: { width: widthPx, height: heightPx },
            pourCode: `cols: ${cols}, rows: ${rows}`,
          });
        }
      }
      setResizeHandle(null);
      modifierDragRef.current = false;
      setSwapPreview(null);
      return;
    }

    if (!draggingId && pointerDownPos.current) {
      const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
      if (dist < 8) {
        if (!modifierDragRef.current) {
          const target = event.target instanceof Element ? event.target.closest('[data-id]') : null;
          const id = target?.getAttribute('data-id');
          const item = items.find((candidate) => candidate.id === id);
          if (item && !isEditing) launchItem(item);
        }
      }
    }

    pointerDownPos.current = null;
    modifierDragRef.current = false;

    if (draggingId && dragItemRef.current) {
      hasJustDraggedRef.current = true;
      const container = gridRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const itemX = event.clientX - dragOffset.x;
          const itemY = event.clientY - dragOffset.y;
          const draggedItem = items.find((item) => item.id === draggingId);
          const dragCols = draggedItem?.cols || 1;
          const dragRows = draggedItem?.rows || 1;
          const { x, y } = pixelsToGrid(itemX, itemY, rect, dragCols, dragRows);
          
          // Utiliser swapPreview si actif (le délai a été respecté), sinon pas d'échange
          if (swapPreview && swapPreview.targetId) {
            // Échange confirmé par le délai
            if (draggedItem) {
              updateItem(draggingId, { x, y, pageIndex: currentPageId });
              updateItem(swapPreview.targetId, { x: draggedItem.x, y: draggedItem.y, pageIndex: currentPageId });
            }
          } else {
            // Pas d'échange, vérifier collision avec tous les widgets (multi-cellules inclus)
            
            const colliding = items.find((item) => {
              if (item.id === draggingId) return false;
              if ((item.pageIndex ?? 0) !== currentPageId) return false;
              if (config.viewMode === 'desktop' && item.type === 'app') return false;
              if (!item.x || !item.y) return false;
              
              const itemCols = item.cols || 1;
              const itemRows = item.rows || 1;
              
              // Vérifier si les rectangles se chevauchent
              const overlapX = x < (item.x + itemCols) && (x + dragCols) > item.x;
              const overlapY = y < (item.y + itemRows) && (y + dragRows) > item.y;
              return overlapX && overlapY;
            });
            
            if (!colliding) {
              updateItem(draggingId, { x, y, pageIndex: currentPageId });
            }
          }
          if (config.debugWidgetDimensions) {
            const itemForLog = items.find((item) => item.id === draggingId);
            if (itemForLog) {
              const cols = itemForLog.cols || 1;
              const rows = itemForLog.rows || 1;
              const widthPx = Math.round(cols * (cellSizePx + gridGapCol) - gridGapCol);
              const heightPx = Math.round(rows * (cellSizePx + gridGapRow) - gridGapRow);
              const label = itemForLog.type === 'widget' ? (itemForLog as WebOSWidgetItem).widgetId : itemForLog.title;
              console.log('[Nova] Widget déplacé', {
                id: draggingId,
                label,
                grille: { x, y, cols, rows },
                px: { width: widthPx, height: heightPx },
                pourCode: `x: ${x}, y: ${y}, cols: ${cols}, rows: ${rows}`,
              });
            }
          }
        }
    }

    setDraggingId(null);
    setDragPlaceholder(null);
    setSwapPreview(null);
    setEdgeDragDirection(null);
    dragItemRef.current = null;
    if (swapPreviewTimerRef.current) {
      window.clearTimeout(swapPreviewTimerRef.current);
      swapPreviewTimerRef.current = null;
    }
    pendingSwapPreviewRef.current = null;
  };

  const addWidget = (template: WebOSWidgetTemplate) => {
    const id = `widget-${Date.now()}`;
    const gridSize = config.gridSize ?? LOGICAL_GRID_COLS;
    const defaultSize = 6;
    const isObsidget = template.source === 'obsidget';
    const cols = isObsidget
      ? Math.max(1, Math.min(gridSize, template.cols ?? 8))
      : Math.max(defaultSize, Math.min(gridSize, Math.round((template.cols ?? 3) * (gridSize / 6))));
    const rows = isObsidget
      ? Math.max(1, Math.min(gridSize, template.rows ?? 8))
      : Math.max(defaultSize, Math.min(gridSize, Math.round((template.rows ?? 3) * (gridSize / 6))));
    const { x, y, pageIndex } = findFreeSlot(cols, rows);
    const newItem: WebOSWidgetItem = {
      id,
      type: 'widget',
      title: template.title,
      widgetId: template.id,
      cols,
      rows,
      bgColor: template.bgColor,
      html: template.source === 'obsidget' ? undefined : template.html,
      css: template.source === 'obsidget' ? undefined : template.css,
      js: template.source === 'obsidget' ? undefined : template.js,
      x,
      y,
      pageIndex
    };
    setItems((prev) => [...prev, newItem]);
    setShowWidgetGallery(false);
  };

  const addWidgetFromItem = (item: WebOSWidgetItem) => {
    const gridSize = config.gridSize ?? LOGICAL_GRID_COLS;
    const defaultSize = 6;
    const cols = Math.max(defaultSize, Math.min(gridSize, item.cols ?? defaultSize));
    const rows = Math.max(defaultSize, Math.min(gridSize, item.rows ?? defaultSize));
    const { x, y, pageIndex } = findFreeSlot(cols, rows);
    const newItem: WebOSWidgetItem = {
      id: `widget-${Date.now()}`,
      type: 'widget',
      title: item.title,
      widgetId: item.widgetId,
      cols,
      rows,
      bgColor: item.bgColor ?? '#334155',
      html: item.html,
      css: item.css,
      js: item.js,
      x,
      y,
      pageIndex
    };
    setItems((prev) => [...prev, newItem]);
    setShowWidgetGallery(false);
  };

  const addApp = (template: WebOSItem) => {
    if (template.type !== 'app') return;
    const existingIds = new Set(items.map((i) => i.id));
    if (template.id === 'finder' && existingIds.has('finder')) return;
    const id =
      template.id === 'browser' && existingIds.has('browser')
        ? `browser-${Date.now()}`
        : template.id;
    const cols = template.cols ?? 1;
    const rows = template.rows ?? 1;
    const { x, y, pageIndex } = findFreeSlot(cols, rows);
    const newItem: WebOSItem = {
      ...template,
      id,
      x,
      y,
      pageIndex
    };
    setItems((prev) => [...prev, newItem]);
    setShowWidgetGallery(false);
  };

  const layoutOverrides = useMemo(() => {
    const overrides = new Map<string, { x: number; y: number }>();
    const byPage = new Map<number, WebOSItem[]>();
    items.forEach((item) => {
      const pageIndex = item.pageIndex ?? 0;
      const list = byPage.get(pageIndex) ?? [];
      list.push(item);
      byPage.set(pageIndex, list);
    });

    byPage.forEach((pageItems, pageIndex) => {
      const sorted = [...pageItems].sort((a, b) => {
        const ay = a.y ?? 999;
        const by = b.y ?? 999;
        if (ay !== by) return ay - by;
        return (a.x ?? 999) - (b.x ?? 999);
      });
      const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
      const place = (item: WebOSItem) => {
        const cols = item.cols || 1;
        const rows = item.rows || 1;
        for (let y = 1; y <= gridMaxRows; y += 1) {
          for (let x = 1; x <= gridColsDisplay - cols + 1; x += 1) {
            const overlaps = occupied.some((cell) => {
              return !(
                cell.x + cell.w <= x ||
                x + cols <= cell.x ||
                cell.y + cell.h <= y ||
                y + rows <= cell.y
              );
            });
            if (!overlaps) {
              occupied.push({ x, y, w: cols, h: rows });
              overrides.set(item.id, { x, y });
              return;
            }
          }
        }
        overrides.set(item.id, { x: 1, y: 1 });
      };
      sorted.forEach((item) => {
        if (config.viewMode === 'desktop' && item.type === 'app') return;
        const x = item.x ?? 1;
        const y = item.y ?? 1;
        const cols = item.cols || 1;
        const rows = item.rows || 1;
        if (x + cols - 1 <= gridColsDisplay) {
          const overlaps = occupied.some((cell) => {
            return !(
              cell.x + cell.w <= x ||
              x + cols <= cell.x ||
              cell.y + cell.h <= y ||
              y + rows <= cell.y
            );
          });
          if (!overlaps) {
            occupied.push({ x, y, w: cols, h: rows });
            return;
          }
        }
        place(item);
      });
    });

    return overrides;
  }, [items, gridColsDisplay, gridMaxRows, config.viewMode]);

  const openDockIds = useMemo(() => {
    return new Set(windows.filter((win) => win.itemId).map((win) => win.itemId as string));
  }, [windows]);

  const openWidgetIds = useMemo(() => {
    return new Set(
      windows
        .filter((win) => win.kind === 'widget' && win.widgetItemId)
        .map((win) => win.widgetItemId as string)
    );
  }, [windows]);

  const setPageDragOffsetRaf = useCallback((value: { x: number; y: number }) => {
    pageDragOffsetRef.current = value;
    if (pageDragRaf.current) return;
    pageDragRaf.current = window.requestAnimationFrame(() => {
      setPageDragOffset(pageDragOffsetRef.current);
      pageDragRaf.current = null;
    });
  }, []);

  const schedulePageSnap = useCallback(
    (offset: { x: number; y: number }) => {
      setPageSnapOffset(offset);
      if (pageSnapRafRef.current) {
        window.cancelAnimationFrame(pageSnapRafRef.current);
        pageSnapRafRef.current = null;
      }
      pageSnapRafRef.current = window.requestAnimationFrame(() => {
        pageSnapRafRef.current = window.requestAnimationFrame(() => {
          setPageSnapOffset({ x: 0, y: 0 });
          setPageDragOffsetRaf({ x: 0, y: 0 });
          pageSnapRafRef.current = null;
        });
      });
    },
    [setPageDragOffsetRaf]
  );
  
  const handleTouchStart = (event: React.TouchEvent) => {
    if (showSettings || showWidgetGallery || showPages) return;
    const isSwipeBlockedTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return (
        !!target.closest('[data-widget]') ||
        !!target.closest('[data-window]') ||
        !!target.closest('.webos-dock') ||
        !!target.closest('.webos-taskbar')
      );
    };
    if (isSwipeBlockedTarget(event.target)) return;
    if (isEditing) return;
    if (isPageNavBlocked || isWidgetInteractionRef.current) return;
    pageCreationBudgetRef.current = 1;
    setPageSnapOffset({ x: 0, y: 0 });
    if (pageSnapRafRef.current) {
      window.cancelAnimationFrame(pageSnapRafRef.current);
      pageSnapRafRef.current = null;
    }
    pageDragAxisRef.current = null;
    if (backgroundLongPressTimer.current) window.clearTimeout(backgroundLongPressTimer.current);
    backgroundLongPressTimer.current = window.setTimeout(() => {
      setIsEditing(true);
    }, 2000);
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (showSettings || showWidgetGallery || showPages) return;
    if (!touchStartRef.current || isEditing || isPageNavBlocked) return;
    if (isWidgetInteractionRef.current) return;
    const touch = event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (backgroundLongPressTimer.current && (absDx > 30 || absDy > 30)) {
      window.clearTimeout(backgroundLongPressTimer.current);
      backgroundLongPressTimer.current = null;
    }
    if (absDx < 6 && absDy < 6) return;
    event.preventDefault();
    if (!pageDragAxisRef.current && (absDx > 6 || absDy > 6)) {
      pageDragAxisRef.current = absDx >= absDy ? 'x' : 'y';
    }
    if (pageDragAxisRef.current === 'x') {
      const rect = gridRef.current?.getBoundingClientRect();
      const containerWidth = rect && rect.width > 50 ? rect.width : window.innerWidth;
      const dragPercent = Math.max(-100, Math.min(100, (dx / containerWidth) * 100));
      setIsPageDragging(true);
      setPageDragOffsetRaf({ x: dragPercent, y: 0 });
    } else if (pageDragAxisRef.current === 'y') {
      if (config.lockVerticalSwipe) return;
      const rect = gridRef.current?.getBoundingClientRect();
      const containerHeight = rect && rect.height > 50 ? rect.height : window.innerHeight;
      const dragPercent = Math.max(-100, Math.min(100, (dy / containerHeight) * 100));
      setIsPageDragging(true);
      setPageDragOffsetRaf({ x: 0, y: dragPercent });
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (showSettings || showWidgetGallery || showPages) return;
    const isSwipeBlockedTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return (
        !!target.closest('[data-widget]') ||
        !!target.closest('[data-window]') ||
        !!target.closest('.webos-dock') ||
        !!target.closest('.webos-taskbar')
      );
    };
    if (backgroundLongPressTimer.current) {
      window.clearTimeout(backgroundLongPressTimer.current);
      backgroundLongPressTimer.current = null;
    }
    if (isEditing && !isSwipeBlockedTarget(event.target)) {
      setIsEditing(false);
      touchStartRef.current = null;
      return;
    }
    if (!touchStartRef.current || isEditing || isPageNavBlocked) return;
    if (isWidgetInteractionRef.current) return;
    const diffX = touchStartRef.current.x - event.changedTouches[0].clientX;
    const diffY = touchStartRef.current.y - event.changedTouches[0].clientY;
    const dragOffset = pageDragOffsetRef.current;
    if (isPageDragging) {
      let snapped = false;
        if (Math.abs(dragOffset.x) >= 30 && Math.abs(dragOffset.x) >= Math.abs(dragOffset.y)) {
          const dirX = dragOffset.x < 0 ? 1 : -1;
          snapped = movePageBy(dirX, 0);
          schedulePageSnap({ x: dragOffset.x + dirX * 100, y: dragOffset.y });
        } else if (Math.abs(dragOffset.y) >= 30 && Math.abs(dragOffset.y) >= Math.abs(dragOffset.x)) {
          if (!config.lockVerticalSwipe) {
            const dirY = dragOffset.y < 0 ? 1 : -1;
            snapped = movePageBy(0, dirY);
            schedulePageSnap({ x: dragOffset.x, y: dragOffset.y + dirY * 100 });
          }
        }
      if (!snapped) {
        schedulePageSnap({ x: dragOffset.x, y: dragOffset.y });
      }
    } else if (Math.abs(diffX) > swipeThreshold && Math.abs(diffY) < swipePerpTolerance) {
      animatePageChange(diffX > 0 ? 1 : -1, 0);
    } else if (Math.abs(diffY) > swipeThreshold && Math.abs(diffX) < swipePerpTolerance) {
      if (!config.lockVerticalSwipe) {
        animatePageChange(0, diffY > 0 ? 1 : -1);
      }
    }
    if (isPageDragging) {
      setIsPageDragging(false);
    }
    pageDragAxisRef.current = null;
    touchStartRef.current = null;
  };

  const renderWidget = (
    item: WebOSWidgetItem,
    options?: {
      isEditingOverride?: boolean;
      onSizeChange?: (size: { width: number; height: number }) => void;
    }
  ) => {
    const editing = options?.isEditingOverride ?? isEditing;
    const onSizeChange = options?.onSizeChange;
    const template = widgetTemplates.find((tpl) => tpl.id === item.widgetId);
    const html = item.html ?? template?.html;
    const css = item.css ?? template?.css;
    const js = item.js ?? template?.js;
    const isObsidget = template?.source === 'obsidget';

    const normalizedWidgetId = normalizeWidgetId(item.widgetId || '');
    const ReactWidget = DEFAULT_WIDGET_COMPONENTS[normalizedWidgetId];
    if (ReactWidget) return <ReactWidget api={api} instanceId={item.id} />;
    if (!html && !css && !js && !isObsidget) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
          Widget introuvable
        </div>
      );
    }
    if (isObsidget) {
      return (
        <ObsidgetWidgetRunner
          key={`${item.id}-${template?.id || 'loading'}-${obsidgetSettings ? 'ready' : 'waiting'}`}
          id={item.id}
          html={html}
          css={css}
          js={js}
          isEditing={editing}
          api={api}
          maxWidth={obsidgetMaxWidth}
          onSizeChange={onSizeChange}
        />
      );
    }
    return (
      <WidgetRunner
        id={item.id}
        html={html}
        css={css}
        js={js}
        isEditing={editing}
        api={api}
        onSizeChange={onSizeChange}
      />
    );
  };

  const renderWindowContent = (win: WebOSWindow) => {
    if (win.kind === 'url' && win.url) {
      return (
        <WebViewWindow
          window={win}
          onNavigate={(url) => {
            setWindows((prev) =>
              prev.map((entry) => {
                if (entry.id !== win.id) return entry;
                const history = entry.history ? [...entry.history] : [];
                const index = entry.historyIndex ?? -1;
                const nextHistory = history.slice(0, Math.max(index + 1, 0));
                if (nextHistory[nextHistory.length - 1] !== url) nextHistory.push(url);
                return {
                  ...entry,
                  url,
                  history: nextHistory,
                  historyIndex: nextHistory.length - 1
                };
              })
            );
          }}
          onBack={() => {
            setWindows((prev) =>
              prev.map((entry) => {
                if (entry.id !== win.id) return entry;
                const history = entry.history ?? [];
                const index = entry.historyIndex ?? history.length - 1;
                const nextIndex = Math.max(0, index - 1);
                const nextUrl = history[nextIndex];
                if (!nextUrl) return entry;
                return { ...entry, url: nextUrl, historyIndex: nextIndex };
              })
            );
          }}
          onForward={() => {
            setWindows((prev) =>
              prev.map((entry) => {
                if (entry.id !== win.id) return entry;
                const history = entry.history ?? [];
                const index = entry.historyIndex ?? history.length - 1;
                const nextIndex = Math.min(history.length - 1, index + 1);
                const nextUrl = history[nextIndex];
                if (!nextUrl) return entry;
                return { ...entry, url: nextUrl, historyIndex: nextIndex };
              })
            );
          }}
          onAddWidget={(url) => {
            const { x, y, pageIndex } = findFreeSlot(4, 4);
            const id = `web-${Date.now()}`;
            const newItem: WebOSItem = {
              id,
              type: 'app',
              title: win.title || 'Web',
              icon: '🌐',
              cols: 4,
              rows: 4,
              x,
              y,
              pageIndex,
              dockOrder: items.length,
              bgColor: '#111827',
              url: url || win.url,
              external: false
            };
            setItems((prev) => [...prev, newItem]);
          }}
          onUpdate={(updates) => updateWindow(win.id, updates)}
          barColor={currentTheme.barColor}
        />
      );
    }

    if (win.kind === 'finder') {
      return (
        <div className={`h-full w-full flex flex-col overflow-hidden min-h-0 ${currentTheme.folder} ${currentTheme.text}`}>
          <FinderView
            api={api}
            initialFavorites={config.finderFavorites ?? []}
            onFavoritesChange={(favs) => setConfig((prev) => ({ ...prev, finderFavorites: favs }))}
            onOpenImage={(path) =>
              openWindowForItem({ id: `${path}-img`, title: path, type: 'app' } as WebOSItem, {
                kind: 'image',
                title: path.split('/').pop() || 'Image',
                path
              })
            }
          />
        </div>
      );
    }

    if (win.kind === 'image' && win.path) {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <img src={api.resolveResourcePath(win.path)} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }

    if (win.kind === 'widget' && win.widgetItemId) {
      const item = items.find((entry) => entry.id === win.widgetItemId);
      if (item && item.type === 'widget') {
        // Redimensionnement dynamique : quand le widget (kanban, todo, etc.) rapporte une nouvelle
        // taille, on met à jour la fenêtre ; la poignée (WindowFrame) reste en bas à droite.
        const windowSizeHandler = (size: { width: number; height: number }) => {
          if (win.isMaximized) return;
          if (size.width > 0 && size.height > 0) {
            const padding = 24;
            updateWindow(win.id, {
              w: Math.max(360, Math.min(size.width + padding, window.innerWidth - 80)),
              h: Math.max(240, Math.min(size.height + padding, window.innerHeight - 120))
            });
          }
        };
        return (
          <div className="w-full h-full" data-widget="true" style={{ backgroundColor: currentTheme.modalBg }}>
            {renderWidget(item as WebOSWidgetItem, {
              isEditingOverride: false,
              onSizeChange: windowSizeHandler
            })}
          </div>
        );
      }
    }

    return <div className="w-full h-full flex items-center justify-center text-slate-400">Contenu indisponible</div>;
  };

  const toggleWidgetFullscreen = (item: WebOSWidgetItem) => {
    const existing = windows.find((win) => win.kind === 'widget' && win.widgetItemId === item.id);
    if (existing) {
      setWindows((prev) => prev.filter((win) => win.id !== existing.id));
      setFullscreenWidgetId(null);
      return;
    }
    openWidgetWindow(item, { itemId: item.id, fullscreen: true });
  };

  const addWidgetToDock = (widgetItem: WebOSWidgetItem) => {
    const alreadyPinned = items.some(
      (i) => i.type === 'app' && (i as WebOSAppItem).pinnedWidgetItemId === widgetItem.id
    );
    if (alreadyPinned) return;
    const appItems = items.filter((i): i is WebOSAppItem => i.type === 'app');
    const maxDockOrder = Math.max(0, ...appItems.map((i) => i.dockOrder ?? 0));
    const newItem: WebOSAppItem = {
      id: `dock-widget-${widgetItem.id}`,
      type: 'app',
      title: widgetItem.title || 'Widget',
      icon: widgetItem.icon,
      bgColor: widgetItem.bgColor,
      appId: 'pinned-widget',
      pinnedWidgetItemId: widgetItem.id,
      dockOrder: maxDockOrder + 1
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handlePinToDock = (win: WebOSWindow) => {
    if (win.kind !== 'widget' || !win.widgetItemId) return;
    const widgetItem = items.find(
      (i): i is WebOSWidgetItem => i.type === 'widget' && i.id === win.widgetItemId
    );
    if (!widgetItem) return;
    addWidgetToDock(widgetItem);
  };

  const renderItem = (item: WebOSItem) => {
    const icon = resolveIcon(item.icon);
    const isWidget = item.type === 'widget';
    const showIconLabel = !isWidget && (item.cols || 1) === 1 && (item.rows || 1) === 1;
    const isObsidgetWidget =
      isWidget && widgetTemplates.find((tpl) => tpl.id === (item as WebOSWidgetItem).widgetId)?.source === 'obsidget';
    const shouldHideWidgetBg = isObsidgetWidget;
  // ✅ TOUJOURS passer le handler pour tous les widgets (Obsidget + default), même en mode édition.
  // handleObsidgetSizeChange décidera lui-même s'il doit bloquer ou non ; la poignée s'adapte si le widget grandit/rétrécit.
  const widgetSizeHandler = isWidget
    ? (size: { width: number; height: number }) => handleObsidgetSizeChange(item.id, size)
    : undefined;

    return (
      <div
        key={item.id}
        id={item.id}
        data-id={item.id}
        data-widget={isWidget ? 'true' : undefined}
        onClick={(event) => {
            if (hasJustDraggedRef.current) {
              hasJustDraggedRef.current = false;
              return;
            }
            // En mode édition, ouvrir le modal d'édition pour les apps/icons (pas les widgets)
            if (isEditing && !isWidget) {
              event.stopPropagation();
              setEditingItem(item);
              return;
            }
            if (isEditing) return;
            launchItem(item);
        }}
        onPointerEnter={() => {
          if (isWidget) isWidgetInteractionRef.current = true;
        }}
        onPointerLeave={() => {
          if (isWidget) isWidgetInteractionRef.current = false;
        }}
        onFocusCapture={() => {
          if (isWidget) isWidgetInteractionRef.current = true;
        }}
        onBlurCapture={(event) => {
          if (!isWidget) return;
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          isWidgetInteractionRef.current = false;
        }}
        onPointerDown={(event) => {
          const hasModifier = event.shiftKey || event.ctrlKey || event.altKey;
          if (!isEditing && isWidget && !hasModifier) return;
          handlePointerDown(event, item);
        }}
        onDoubleClick={(event) => {
          if (!isEditing) return;
          event.stopPropagation();
        }}
        className={`relative group transition-transform duration-200 select-none touch-none
          ${isWidget ? 'flex flex-col min-h-0' : ''}
          ${isEditing ? 'cursor-move animate-jiggle' : isWidget ? '' : 'cursor-pointer active:scale-95 hover:scale-105'}
          ${draggingId === item.id ? 'opacity-0' : 'opacity-100'}
        `}
        style={getItemStyle(item)}
      >
        {/* Bouton de suppression en mode édition ou Alt */}
        {(isEditing || altKeyHeld) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              deleteItem(item.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-2 -left-2 z-50 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
            title="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        )}
        {isWidget && !isEditing && (
          <div className="widget-fullscreen-hotspot">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleWidgetFullscreen(item as WebOSWidgetItem);
              }}
              className="widget-fullscreen-toggle p-1.5 rounded-full bg-black/70 text-white shadow-lg"
              title={fullscreenWidgetId === item.id ? 'Réduire' : 'Agrandir'}
            >
              {fullscreenWidgetId === item.id ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        )}
        {/* Contenu widget : overflow-auto pour ne pas rogner ; la cellule grandit via onSizeChange. */}
        {isWidget && shouldHideWidgetBg ? (
          <div className="flex-1 min-h-0 min-w-0 overflow-auto relative">
            <div className="absolute inset-0 min-w-0 min-h-0 overflow-auto">
              {renderWidget(item as WebOSWidgetItem, { onSizeChange: widgetSizeHandler })}
            </div>
          </div>
        ) : isWidget ? (
          <div className="flex-1 min-h-0 min-w-0 relative rounded-2xl shadow-lg overflow-hidden">
            <div
              className={`absolute inset-0 overflow-hidden flex flex-col items-center justify-center
                ${item.bgColor === 'glass' ? 'bg-white/20 backdrop-blur-md border border-white/20' : ''}
                ${isEditing ? 'border-2 border-white/20' : ''}
              `}
              style={
                item.bgColor !== 'glass'
                  ? { backgroundColor: item.fullSize ? 'transparent' : item.bgColor, border: undefined }
                  : {}
              }
            >
              {renderWidget(item as WebOSWidgetItem, { onSizeChange: widgetSizeHandler })}
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl shadow-lg flex flex-col items-center justify-center overflow-hidden w-full h-full
              ${item.bgColor === 'glass' ? 'bg-white/20 backdrop-blur-md border border-white/20' : ''}
              ${isEditing ? 'border-2 border-white/20' : ''}
            `}
            style={
              item.bgColor !== 'glass'
                ? {
                    backgroundColor: item.fullSize ? 'transparent' : item.bgColor,
                    border: undefined
                  }
                : {}
            }
          >
            <>
              {showIconLabel ? (
                <div className="w-full h-full flex flex-col items-center justify-between py-2">
                  <div className="w-full flex-1 flex items-center justify-center">
                    {icon ? (
                      <img
                        src={icon}
                        alt={item.title}
                        className={item.fullSize ? 'w-full h-full object-cover' : 'max-w-[48px] max-h-[48px] w-1/2 h-1/2 object-contain'}
                      />
                    ) : item.icon?.startsWith('lucide:') ? (
                      renderLucideIcon(item.icon, 22, 'text-white drop-shadow-md')
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="text-[10px] md:text-xs font-medium text-white text-center px-2 truncate w-full pointer-events-none">
                    {item.title}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-1 filter drop-shadow-md w-full h-full flex items-center justify-center">
                    {icon ? (
                      <img
                        src={icon}
                        alt={item.title}
                        className={item.fullSize ? 'w-full h-full object-cover' : 'max-w-[48px] max-h-[48px] w-1/2 h-1/2 object-contain'}
                      />
                    ) : item.icon?.startsWith('lucide:') ? (
                      renderLucideIcon(item.icon, 24, 'text-white drop-shadow-md')
                    ) : (
                      item.icon
                    )}
                  </div>
                  {(item.rows || 1) > 1 && (
                    <div className="text-xs font-bold text-white px-2 text-center pointer-events-none">
                      {item.title}
                    </div>
                  )}
                </>
              )}
            </>
          </div>
        )}
        {/* Poignée en enfant direct de l'item grille : position 0 du bas de la cellule, reste correcte après agrandissement/rétrécissement dynamique du widget */}
        {(isEditing || altKeyHeld) && isWidget && (
          <div
            className="absolute bottom-0 right-0 p-1.5 cursor-se-resize z-30 opacity-60 hover:opacity-100 bg-black/50 rounded-tl-lg pointer-events-auto"
            style={{ minHeight: 24 }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setResizeHandle({
                id: item.id,
                startX: event.clientX,
                startY: event.clientY,
                startCols: item.cols || 1,
                startRows: item.rows || 1,
                currentCols: item.cols || 1,
                currentRows: item.rows || 1
              });
            }}
          >
            <Grid size={12} className="text-white rotate-90" />
          </div>
        )}
      </div>
    );
  };
  
  const SettingsModal = () => {
    if (!showSettings) return null;
    const [visibleImageCount, setVisibleImageCount] = useState(24);
    const [visibleVideoCount, setVisibleVideoCount] = useState(24);
    const [showImageNames, setShowImageNames] = useState(false);
    const [videoViewMode, setVideoViewMode] = useState<'list' | 'filmstrip'>('list');

    const expandedSection = wallpaperExpandedSection;
    const toggleSection = (id: string) => setWallpaperExpandedSection(prev => prev === id ? null : id);

    return (
      <div
        className={`fixed inset-0 z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200 ${settingsTab === 'wallpapers' ? 'bg-black/20' : 'bg-black/60 backdrop-blur-md'}`}
        onClick={() => {
          api.saveState({ items, config, windows, widgetTemplates, dataVersion: 3 });
          setShowSettings(false);
        }}
      >
        <div
          className={`text-slate-200 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl border flex overflow-hidden ${currentTheme.border}`}
          style={{ backgroundColor: currentTheme.modalBg || '#0f172a', zoom: config.uiScale ?? 1 }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Sidebar */}
          <div className={`w-64 border-r flex flex-col ${currentTheme.border}`} style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="p-6">
              <h3 className={`text-xl font-bold ${currentTheme.text}`}>Réglages</h3>
              <p className={`text-xs mt-1 ${currentTheme.textMuted}`}>Personnalisez votre expérience</p>
            </div>
            
            <nav className="flex-1 px-3 space-y-1">
              <button
                onClick={() => setSettingsTab('general')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  settingsTab === 'general' ? 'bg-white/10 text-white' : `${currentTheme.hover} ${currentTheme.textMuted}`
                }`}
                style={settingsTab === 'general' ? { backgroundColor: currentTheme.accent } : {}}
              >
                <Sliders size={18} />
                Général
              </button>
              <button
                onClick={() => setSettingsTab('appearance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  settingsTab === 'appearance' ? 'bg-white/10 text-white' : `${currentTheme.hover} ${currentTheme.textMuted}`
                }`}
                style={settingsTab === 'appearance' ? { backgroundColor: currentTheme.accent } : {}}
              >
                <Palette size={18} />
                Apparence
              </button>
              <button
                onClick={() => setSettingsTab('wallpapers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settingsTab === 'wallpapers' ? 'bg-white/10 text-white' : `${currentTheme.hover} ${currentTheme.textMuted}`
                  }`}
                  style={settingsTab === 'wallpapers' ? { backgroundColor: currentTheme.accent } : {}}
              >
                <ImageIcon size={18} />
                Fonds d'écran
              </button>
            </nav>

            <div className={`p-4 border-t ${currentTheme.border}`}>
                <button 
                    onClick={() => {
                      api.saveState({ items, config, windows, widgetTemplates, dataVersion: 3 });
                      setShowSettings(false);
                    }} 
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold transition ${currentTheme.textMuted}`}
                >
                    Fermer
                </button>
            </div>
          </div>

          {/* Content - overflow-y-scroll + touch pour que le trackpad défile correctement */}
          <div
            className="flex-1 overflow-y-scroll custom-scrollbar p-8"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            
            {/* Général */}
            {settingsTab === 'general' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <section>
                    <h4 className={`text-sm uppercase tracking-wider font-bold mb-4 ${currentTheme.textMuted}`}>Affichage & Navigation</h4>
                    
                    <div className="space-y-4">
                        <div className={`rounded-xl p-4 border flex items-center justify-between ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div>
                                <div className={`font-medium mb-1 ${currentTheme.text}`}>Mode d'affichage</div>
                                <div className={`text-xs ${currentTheme.textMuted}`}>Choisir entre une vue grille classique ou style bureau</div>
                            </div>
                            <div className="flex bg-black/40 p-1 rounded-lg">
                                <button
                                    onClick={() => setConfig((prev) => ({ ...prev, viewMode: 'grid' }))}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                                    config.viewMode === 'grid' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                    }`}
                                    style={config.viewMode === 'grid' ? { backgroundColor: currentTheme.accent } : {}}
                                >
                                    Grille
                                </button>
                                <button
                                    onClick={() => setConfig((prev) => ({ ...prev, viewMode: 'desktop' }))}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                                    config.viewMode === 'desktop' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                    }`}
                                    style={config.viewMode === 'desktop' ? { backgroundColor: currentTheme.accent } : {}}
                                >
                                    Bureau
                                </button>
                            </div>
                        </div>

                        <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div className={`font-medium mb-3 ${currentTheme.text}`}>Position de la barre des tâches</div>
                            <div className="grid grid-cols-4 gap-2">
                                {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                                    <button
                                    key={pos}
                                    onClick={() => setConfig((prev) => ({ ...prev, barPosition: pos }))}
                                    className={`py-2 rounded-lg border capitalize text-sm transition ${
                                        config.barPosition === pos ? 'text-white' : `border-white/10 bg-black/20 hover:bg-white/5 ${currentTheme.textMuted}`
                                    }`}
                                    style={config.barPosition === pos ? { backgroundColor: currentTheme.accent, borderColor: currentTheme.accent } : {}}
                                    >
                                    {pos}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div className={`flex items-center justify-between mb-2 ${currentTheme.text}`}>
                                <span className="font-medium">Densité de la grille</span>
                                <span className={`text-xs bg-black/40 px-2 py-1 rounded ${currentTheme.textMuted}`}>{config.gridSize ?? 36} × {config.gridSize ?? 36}</span>
                            </div>
                            <p className={`text-xs mb-3 ${currentTheme.textMuted}`}>Nombre de colonnes et lignes (grille synchronisée). Plus la valeur est élevée, plus les cellules sont petites et les widgets denses.</p>
                            <input
                                type="range"
                                min={GRID_SIZE_MIN}
                                max={GRID_SIZE_MAX}
                                step={GRID_SIZE_STEP}
                                value={config.gridSize ?? 36}
                                onChange={(e) => setConfig((prev) => ({ ...prev, gridSize: Number(e.target.value) }))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: currentTheme.accent }}
                            />
                            <div className={`text-[10px] mt-2 flex justify-between ${currentTheme.textMuted}`}>
                                <span>Moins dense (12)</span>
                                <span>Plus dense (64)</span>
                            </div>
                            <label className={`flex items-center gap-2 mt-3 cursor-pointer ${currentTheme.text}`}>
                                <input
                                    type="checkbox"
                                    checked={config.pageUpDownChangesGridDensity ?? false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, pageUpDownChangesGridDensity: e.target.checked }))}
                                    className="rounded border-slate-500 accent-current"
                                />
                                <span className="text-sm">Page Up / Page Down modifient la densité de la grille</span>
                            </label>
                        </div>

                        <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                             <div className="flex items-center justify-between mb-2">
                                <span className={`font-medium ${currentTheme.text}`}>Sensibilité du swipe</span>
                                <span className={`text-xs bg-black/40 px-2 py-1 rounded ${currentTheme.textMuted}`}>{config.swipeThreshold ?? 30}px</span>
                             </div>
                             <input
                                type="range"
                                min={15}
                                max={80}
                                step={1}
                                value={config.swipeThreshold ?? 30}
                                onChange={(event) =>
                                setConfig((prev) => ({ ...prev, swipeThreshold: Number(event.target.value) }))
                                }
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: currentTheme.accent }}
                            />
                            <div className={`text-[10px] mt-2 flex justify-between ${currentTheme.textMuted}`}>
                                <span>Sensible</span>
                                <span>Moins sensible</span>
                            </div>
                        </div>

                        <div className={`flex items-center justify-between rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div>
                                <div className={`font-medium ${currentTheme.text}`}>Verrouillage swipe vertical</div>
                                <div className={`text-xs ${currentTheme.textMuted}`}>Empêche de changer de page vers le haut/bas</div>
                            </div>
                            <button
                                onClick={() => setConfig((prev) => ({...prev, lockVerticalSwipe: !prev.lockVerticalSwipe}))}
                                className={`w-12 h-6 rounded-full transition-colors relative`}
                                style={{ backgroundColor: config.lockVerticalSwipe ? currentTheme.accent : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                    config.lockVerticalSwipe ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        <div className={`flex items-center justify-between rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div>
                                <div className={`font-medium ${currentTheme.text}`}>Debug dimensions widgets</div>
                                <div className={`text-xs ${currentTheme.textMuted}`}>Afficher en console (F12) position et dimensions (grille + px) quand vous redimensionnez ou déplacez un widget</div>
                            </div>
                            <button
                                onClick={() => setConfig((prev) => ({ ...prev, debugWidgetDimensions: !prev.debugWidgetDimensions }))}
                                className={`w-12 h-6 rounded-full transition-colors relative`}
                                style={{ backgroundColor: config.debugWidgetDimensions ? currentTheme.accent : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                    config.debugWidgetDimensions ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                    </div>
                </section>
              </div>
            )}

            {/* Apparence */}
            {settingsTab === 'appearance' && (
               <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                 <section>
                    <h4 className={`text-sm uppercase tracking-wider font-bold mb-4 ${currentTheme.textMuted}`}>Taille de l'interface</h4>
                    <div className="space-y-4">
                        <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div className={`flex items-center justify-between mb-2 ${currentTheme.text}`}>
                                <span className="font-medium">Échelle des widgets & icônes</span>
                                <span className={`text-xs bg-black/40 px-2 py-1 rounded ${currentTheme.textMuted}`}>{Math.round((config.widgetScale ?? 1) * 100)} %</span>
                            </div>
                            <input
                                type="range"
                                min={50}
                                max={150}
                                step={5}
                                value={Math.round((config.widgetScale ?? 1) * 100)}
                                onChange={(e) => setConfig((prev) => ({ ...prev, widgetScale: Number(e.target.value) / 100 }))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: currentTheme.accent }}
                            />
                            <div className={`text-xs mt-1 ${currentTheme.textMuted}`}>Page Up / Page Down pour ajuster au clavier</div>
                        </div>
                        <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div className={`flex items-center justify-between mb-2 ${currentTheme.text}`}>
                                <span className="font-medium">Échelle de l'UI (barre, menus)</span>
                                <span className={`text-xs bg-black/40 px-2 py-1 rounded ${currentTheme.textMuted}`}>{Math.round((config.uiScale ?? 1) * 100)} %</span>
                            </div>
                            <input
                                type="range"
                                min={50}
                                max={150}
                                step={5}
                                value={Math.round((config.uiScale ?? 1) * 100)}
                                onChange={(e) => setConfig((prev) => ({ ...prev, uiScale: Number(e.target.value) / 100 }))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-current"
                                style={{ color: currentTheme.accent }}
                            />
                            <div className={`text-xs mt-1 ${currentTheme.textMuted}`}>Ctrl + Page Up / Page Down pour ajuster au clavier</div>
                        </div>
                    </div>
                 </section>
                 <section>
                    <h4 className={`text-sm uppercase tracking-wider font-bold mb-4 ${currentTheme.textMuted}`}>Thème & Couleurs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(THEMES).map(([key, theme]) => (
                            <button
                            key={key}
                            onClick={() => setConfig((prev) => ({ ...prev, theme: key as WebOSConfig['theme'] }))}
                            className={`group relative overflow-hidden rounded-xl border transition-all text-left p-4 ${
                                config.theme === key ? 'ring-1' : `border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20`
                            }`}
                            style={config.theme === key ? { borderColor: theme.accent, backgroundColor: `${theme.accent}10`, ringColor: theme.accent } : {}}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div 
                                        className="w-10 h-10 rounded-full shadow-lg border border-white/10"
                                        style={{ backgroundColor: key === 'obsidian' ? 'var(--background-secondary)' : theme.previewBg || theme.barColor }}
                                    />
                                    <div>
                                        <div className={`font-bold ${config.theme === key ? currentTheme.text : 'text-slate-300'}`}>{theme.name}</div>
                                        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Cliquez pour appliquer</div>
                                    </div>
                                </div>
                                {config.theme === key && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: theme.accent, color: theme.accent }} />
                                )}
                            </button>
                        ))}
                    </div>
                 </section>

                 <section>
                    <h4 className={`text-sm uppercase tracking-wider font-bold mb-4 ${currentTheme.textMuted}`}>Widgets</h4>
                    <div className="space-y-4">
                         <div className={`flex items-center justify-between rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div>
                                <div className={`font-medium ${currentTheme.text}`}>Fond transparent (Obsidget)</div>
                                <div className={`text-xs ${currentTheme.textMuted}`}>Retire le fond par défaut des widgets Obsidget</div>
                            </div>
                            <button
                                onClick={() => setConfig((prev) => ({...prev, transparentObsidgetWidgets: !prev.transparentObsidgetWidgets}))}
                                className={`w-12 h-6 rounded-full transition-colors relative`}
                                style={{ backgroundColor: config.transparentObsidgetWidgets ? currentTheme.accent : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                    config.transparentObsidgetWidgets ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                         <div className={`flex items-center justify-between rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                            <div>
                                <div className={`font-medium ${currentTheme.text}`}>Fond transparent (Plein écran)</div>
                                <div className={`text-xs ${currentTheme.textMuted}`}>Rend le fond transparent lorsqu'un widget est agrandi</div>
                            </div>
                            <button
                                onClick={() => setConfig((prev) => ({...prev, fullscreenWidgetTransparent: !prev.fullscreenWidgetTransparent}))}
                                className={`w-12 h-6 rounded-full transition-colors relative`}
                                style={{ backgroundColor: config.fullscreenWidgetTransparent ? currentTheme.accent : 'rgba(255,255,255,0.1)' }}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                    config.fullscreenWidgetTransparent ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>

                        <h4 className={`text-sm uppercase tracking-wider font-bold mb-4 mt-8 ${currentTheme.textMuted}`}>Indicateurs de page</h4>
                        <div className="space-y-4">
                            <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                <div className={`font-medium mb-3 ${currentTheme.text}`}>Position</div>
                                <div className={`text-xs mb-2 ${currentTheme.textMuted}`}>Milieu haut, centre ou milieu bas (au-dessus du dock si dock en bas, en dessous si dock en haut)</div>
                                <div className="flex flex-wrap gap-2">
                                    {(['top', 'center', 'bottom'] as const).map((pos) => (
                                        <button
                                            key={pos}
                                            onClick={() => setConfig((prev) => ({ ...prev, pageDotsPosition: pos }))}
                                            className={`px-3 py-2 rounded-lg border text-sm capitalize transition ${
                                                (config.pageDotsPosition ?? 'bottom') === pos ? 'text-white' : `border-white/10 bg-black/20 hover:bg-white/5 ${currentTheme.textMuted}`
                                            }`}
                                            style={(config.pageDotsPosition ?? 'bottom') === pos ? { backgroundColor: currentTheme.accent, borderColor: currentTheme.accent } : {}}
                                        >
                                            {pos === 'top' ? 'Milieu haut' : pos === 'center' ? 'Milieu' : 'Milieu bas'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                <div className={`flex items-center justify-between mb-2 ${currentTheme.text}`}>
                                    <span className="font-medium">Taille des points</span>
                                    <span className={`text-xs bg-black/40 px-2 py-1 rounded ${currentTheme.textMuted}`}>{config.pageDotsSize ?? 12}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={8}
                                    max={24}
                                    step={1}
                                    value={config.pageDotsSize ?? 12}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, pageDotsSize: Number(e.target.value) }))}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-current"
                                    style={{ color: currentTheme.accent }}
                                />
                            </div>
                            <div className={`rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                <label className={`font-medium block mb-2 ${currentTheme.text}`}>Durée d'affichage (ms)</label>
                                <input
                                    type="number"
                                    min={1000}
                                    max={30000}
                                    step={500}
                                    value={config.pageDotsDurationMs ?? 5000}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, pageDotsDurationMs: Math.max(1000, Math.min(30000, Number(e.target.value) || 5000)) }))}
                                    className={`w-full max-w-[120px] bg-black/40 p-2 rounded-lg border text-sm ${currentTheme.border} ${currentTheme.text}`}
                                />
                                <div className={`text-xs mt-1 ${currentTheme.textMuted}`}>Temps avant que les points disparaissent (1–30 s)</div>
                            </div>
                            <div className={`flex items-center justify-between rounded-xl p-4 border ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                <div>
                                    <div className={`font-medium ${currentTheme.text}`}>Bulle floutée</div>
                                    <div className={`text-xs ${currentTheme.textMuted}`}>Flou derrière les points pour mieux les voir sur le fond</div>
                                </div>
                                <button
                                    onClick={() => setConfig((prev) => ({ ...prev, pageDotsBlurBubble: !(prev.pageDotsBlurBubble !== false) }))}
                                    className={`w-12 h-6 rounded-full transition-colors relative`}
                                    style={{ backgroundColor: (config.pageDotsBlurBubble !== false) ? currentTheme.accent : 'rgba(255,255,255,0.1)' }}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                        (config.pageDotsBlurBubble !== false) ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                 </section>
               </div>
            )}

            {/* Fonds d'écran */}
            {settingsTab === 'wallpapers' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* Input Custom */}
                    <div className={`p-4 rounded-xl border sticky top-0 z-10 backdrop-blur-md ${currentTheme.border}`} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <label className={`text-xs font-bold uppercase mb-2 block ${currentTheme.textMuted}`}>URL personnalisée</label>
                        <div className="flex gap-2 relative">
                             <input
                                ref={wallpaperInputFocusedRef}
                                value={config.wallpaper}
                                onChange={(event) => {
                                  setConfig((prev) => ({ ...prev, wallpaper: event.target.value }));
                                  setTimeout(() => wallpaperInputFocusedRef.current?.focus(), 0);
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                                className={`flex-1 bg-black/40 p-2.5 rounded-lg border text-sm outline-none transition-colors pr-10 ${currentTheme.border} ${currentTheme.text}`}
                                placeholder="https://... ou chemin local"
                            />
                            {config.wallpaper.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setConfig((prev) => ({ ...prev, wallpaper: '' })); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10"
                                aria-label="Effacer"
                              >
                                <X size={14} />
                              </button>
                            )}
                        </div>
                    </div>

                    {/* Presets - Accordéon */}
                    <div className={`border rounded-xl overflow-hidden ${currentTheme.border}`}>
                        <button 
                            onClick={() => toggleSection('presets')}
                            className={`w-full flex items-center justify-between p-4 transition-colors ${currentTheme.hover}`}
                            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                        >
                            <h4 className={`flex items-center gap-2 text-sm uppercase tracking-wider font-bold ${currentTheme.textMuted}`}>
                                <Compass size={16} /> Sélection en ligne
                            </h4>
                            {expandedSection === 'presets' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        
                        {expandedSection === 'presets' && (
                            <div className={`p-4 bg-black/20 border-t ${currentTheme.border}`} onClick={(e) => e.stopPropagation()}>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {WALLPAPERS.map((url) => (
                                        <button
                                        key={url}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfig((prev) => ({ ...prev, wallpaper: url })); }}
                                        className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                                            config.wallpaper === url ? '' : 'border-transparent hover:border-white/30'
                                        }`}
                                        style={config.wallpaper === url ? { borderColor: currentTheme.accent } : {}}
                                        >
                                            <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                                            <img src={url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                                            {config.wallpaper === url && (
                                                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${currentTheme.accent}30` }}>
                                                    <div className="rounded-full p-1" style={{ backgroundColor: currentTheme.accent }}><div className="w-2 h-2 bg-white rounded-full" /></div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Local Images - Galerie pellicule */}
                    <div className={`border rounded-xl overflow-hidden ${currentTheme.border}`}>
                        <button 
                            onClick={() => toggleSection('images')}
                            className={`w-full flex items-center justify-between p-4 transition-colors ${currentTheme.hover}`}
                            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                        >
                            <h4 className={`flex items-center gap-2 text-sm uppercase tracking-wider font-bold ${currentTheme.textMuted}`}>
                                <ImageIcon size={16} /> Images du Vault ({vaultWallpapers.length})
                            </h4>
                            {expandedSection === 'images' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expandedSection === 'images' && (
                            <div className={`p-4 bg-black/20 border-t ${currentTheme.border}`} onClick={(e) => e.stopPropagation()}>
                                {vaultWallpapers.length === 0 ? (
                                    <div className={`p-4 text-center border border-dashed rounded-xl text-sm ${currentTheme.border} ${currentTheme.textMuted}`}>
                                        Aucune image trouvée dans votre coffre.
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <label className={`flex items-center gap-2 text-xs cursor-pointer select-none ${currentTheme.textMuted}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={showImageNames}
                                                    onChange={(e) => setShowImageNames(e.target.checked)}
                                                    className="rounded border-white/30 bg-black/40"
                                                />
                                                Afficher les noms
                                            </label>
                                        </div>
                                        <div
                                            className="grid gap-3 overflow-y-auto custom-scrollbar pr-2 gpu-layer wallpaper-gallery-grid"
                                            style={{
                                                gridTemplateColumns: 'repeat(auto-fill, 140px)',
                                                gridAutoRows: '140px',
                                                maxHeight: '420px'
                                            }}
                                        >
                                            {vaultWallpapers.map((path) => (
                                                <button
                                                    key={path}
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfig((prev) => ({ ...prev, wallpaper: path })); }}
                                                    className={`relative w-full h-full min-h-[140px] rounded-xl overflow-hidden border-2 transition-all bg-slate-900 group gpu-layer ${
                                                        config.wallpaper === path ? '' : 'border-white/5 hover:border-white/30'
                                                    }`}
                                                    style={config.wallpaper === path ? { borderColor: currentTheme.accent } : {}}
                                                >
                                                    <img
                                                        src={api.resolveResourcePath(path)}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity gpu-layer"
                                                        loading="lazy"
                                                        alt=""
                                                    />
                                                    {config.wallpaper === path && (
                                                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${currentTheme.accent}30` }}>
                                                            <div className="rounded-full p-1" style={{ backgroundColor: currentTheme.accent }}><div className="w-2 h-2 bg-white rounded-full" /></div>
                                                        </div>
                                                    )}
                                                    {showImageNames && (
                                                        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                                                            <div className="text-[10px] text-white truncate text-left font-mono">{path.split('/').pop()}</div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Local Videos - Liste / Pellicule */}
                    <div className={`border rounded-xl overflow-hidden ${currentTheme.border}`}>
                        <button 
                            onClick={() => toggleSection('videos')}
                            className={`w-full flex items-center justify-between p-4 transition-colors ${currentTheme.hover}`}
                            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                        >
                            <h4 className={`flex items-center gap-2 text-sm uppercase tracking-wider font-bold ${currentTheme.textMuted}`}>
                                <Film size={16} /> Vidéos du Vault ({vaultVideos.length})
                            </h4>
                            {expandedSection === 'videos' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {expandedSection === 'videos' && (
                             <div className={`p-4 bg-black/20 border-t ${currentTheme.border}`} onClick={(e) => e.stopPropagation()}>
                                {vaultVideos.length === 0 ? (
                                    <div className={`p-4 text-center border border-dashed rounded-xl text-sm ${currentTheme.border} ${currentTheme.textMuted}`}>
                                        Aucune vidéo (mp4, webm) trouvée dans votre coffre.
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-end mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setVideoViewMode(prev => prev === 'list' ? 'filmstrip' : 'list')}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${currentTheme.border} ${currentTheme.textMuted} ${currentTheme.hover}`}
                                                style={videoViewMode === 'filmstrip' ? { backgroundColor: currentTheme.accent, borderColor: currentTheme.accent, color: 'white' } : {}}
                                            >
                                                <Film size={14} />
                                                {videoViewMode === 'list' ? 'Mode pellicule' : 'Mode liste'}
                                            </button>
                                        </div>
                                        {videoViewMode === 'list' ? (
                                            <div 
                                                className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2"
                                                style={{ maxHeight: '280px' }}
                                            >
                                                {vaultVideos.map((path) => {
                                                    const name = path.split('/').pop() ?? path;
                                                    const isSelected = config.wallpaper === path;
                                                    return (
                                                        <button
                                                            key={path}
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfig((prev) => ({ ...prev, wallpaper: path })); }}
                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all ${
                                                                isSelected ? '' : `border-transparent ${currentTheme.hover}`
                                                            }`}
                                                            style={isSelected ? { borderColor: currentTheme.accent, backgroundColor: `${currentTheme.accent}20` } : {}}
                                                        >
                                                            <Film size={18} className={`flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-50'}`} />
                                                            <span className={`text-sm font-mono truncate flex-1 ${isSelected ? 'font-semibold' : ''}`}>{name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div 
                                                className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar"
                                                style={{ maxHeight: '140px', scrollSnapType: 'x mandatory' }}
                                            >
                                                {vaultVideos.map((path) => {
                                                    const isSelected = config.wallpaper === path;
                                                    const videoUrl = api.resolveResourcePath(path);
                                                    return (
                                                        <button
                                                            key={path}
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfig((prev) => ({ ...prev, wallpaper: path })); }}
                                                            className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-black ${
                                                                isSelected ? '' : 'border-white/5 hover:border-white/30'
                                                            }`}
                                                            style={{
                                                                ...(isSelected ? { borderColor: currentTheme.accent } : {}),
                                                                width: '200px',
                                                                height: '112px',
                                                                scrollSnapAlign: 'start'
                                                            }}
                                                        >
                                                            <video
                                                                src={videoUrl}
                                                                preload="metadata"
                                                                muted
                                                                playsInline
                                                                className="w-full h-full object-cover"
                                                                onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 0.5; }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                                                <div className="rounded-full p-2 bg-black/50">
                                                                    <Film size={20} className="text-white/80" />
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${currentTheme.accent}30` }}>
                                                                    <div className="rounded-full p-1" style={{ backgroundColor: currentTheme.accent }}><div className="w-2 h-2 bg-white rounded-full" /></div>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
          </div>
        </div>
      </div>
    );
  };

  const PagesModal = () => {
    // ... (Unchanged logic)
    const [atlasFocus, setAtlasFocus] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const baseRows = 10;
    const rootCoord = getPageCoord(0);
    const relPages = pages.map((pageId) => {
      const coord = getPageCoord(pageId);
      return { id: pageId, dx: coord.x - rootCoord.x, dy: coord.y - rootCoord.y, coord };
    });
    let extentX = 0;
    let extentY = 0;
    relPages.forEach((entry) => {
      extentX = Math.max(extentX, Math.abs(entry.dx));
      extentY = Math.max(extentY, Math.abs(entry.dy));
    });
    const mapCols = extentX * 2 + 1;
    const mapRows = extentY * 2 + 1;
    const mapGap = 14;
    const baseCardWidth = 210;
    const baseCardHeight = 160;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const panelWidth = viewportWidth;
    const panelHeight = viewportHeight;
    const headerHeight = 0;
    const availableWidth = panelWidth - 48;
    const availableHeight = panelHeight - headerHeight - 48;
    const naturalGridWidth = mapCols * baseCardWidth + (mapCols - 1) * mapGap;
    const naturalGridHeight = mapRows * baseCardHeight + (mapRows - 1) * mapGap;
    const gridScale = Math.min(1, availableWidth / naturalGridWidth, availableHeight / naturalGridHeight);

    const pageByRel = new Map<string, { id: number; coord: { x: number; y: number } }>();
    relPages.forEach((entry) => pageByRel.set(`${entry.dx},${entry.dy}`, { id: entry.id, coord: entry.coord }));

    const closeModal = () => {
      setShowPages(false);
      setIsPagesEditMode(false);
      pageDragIdRef.current = null;
    };
    const goToPage = (pageId: number) => {
      setCurrentPageId(pageId);
      closeModal();
    };
    const swapPageCoords = (sourceId: number, targetId: number) => {
      if (sourceId === 0 || targetId === 0) return;
      setConfig((prev) => {
        const coords = { ...(prev.pageCoords ?? {}) };
        const source = coords[sourceId] ?? { x: 0, y: 0 };
        const target = coords[targetId] ?? { x: 0, y: 0 };
        coords[sourceId] = { x: target.x, y: target.y };
        coords[targetId] = { x: source.x, y: source.y };
        return { ...prev, pageCoords: coords };
      });
    };
    const movePageToCoord = (pageId: number, coord: { x: number; y: number }) => {
      if (pageId === 0) return;
      setConfig((prev) => ({
        ...prev,
        pageCoords: { ...(prev.pageCoords ?? {}), [pageId]: { x: coord.x, y: coord.y } }
      }));
    };
    
    const canFocusAt = (dx: number, dy: number) => {
      const entry = pageByRel.get(`${dx},${dy}`);
      
      const isHome = entry?.id === 0;
      const itemsInPage = entry ? items.filter((item) => (item.pageIndex ?? 0) === entry.id) : [];
      const hasContent = itemsInPage.length > 0;
      const isUsefulHere = isHome || hasContent;

      if (isUsefulHere) return true;

      const neighbourRelCoords: Array<[number, number]> = [
        [dx + 1, dy], [dx - 1, dy], [dx, dy + 1], [dx, dy - 1]
      ];
      
      const hasNeighbourUseful = neighbourRelCoords.some(([nx, ny]) => {
        const neighbourEntry = pageByRel.get(`${nx},${ny}`);
        if (!neighbourEntry) return false;
        if (neighbourEntry.id === 0) return true;
        return items.some((item) => (item.pageIndex ?? 0) === neighbourEntry.id);
      });

      return hasNeighbourUseful;
    };
    const canOpenPageAt = (dx: number, dy: number) => {
      const entry = pageByRel.get(`${dx},${dy}`);
      if (!entry) return false;
      const pageId = entry.id;
      const isHome = pageId === 0;
      const hasContent = items.some((item) => (item.pageIndex ?? 0) === pageId);
      const isUsefulHere = isHome || hasContent;

      const neighbourRelCoords: Array<[number, number]> = [
        [dx + 1, dy], [dx - 1, dy], [dx, dy + 1], [dx, dy - 1]
      ];
      const hasNeighbourUseful = neighbourRelCoords.some(([nx, ny]) => {
        const neighbourEntry = pageByRel.get(`${nx},${ny}`);
        if (!neighbourEntry) return false;
        if (neighbourEntry.id === 0) return true;
        return items.some((item) => (item.pageIndex ?? 0) === neighbourEntry.id);
      });
      return isUsefulHere || hasNeighbourUseful;
    };

    useEffect(() => {
      if (!showPages) return;
      const current = getPageCoord(currentPageId);
      setAtlasFocus({ dx: current.x - rootCoord.x, dy: current.y - rootCoord.y });
    }, [showPages, currentPageId, getPageCoord, rootCoord.x, rootCoord.y]);

    useEffect(() => {
      if (!showPages) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target;
        if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
        
        const tryMove = (moveX: number, moveY: number) => {
          const nextDx = atlasFocus.dx + moveX;
          const nextDy = atlasFocus.dy + moveY;
          if (nextDx >= -extentX && nextDx <= extentX && 
              nextDy >= -extentY && nextDy <= extentY && 
              canFocusAt(nextDx, nextDy)) {
            setAtlasFocus({ dx: nextDx, dy: nextDy });
          }
        };

        if (event.key === 'Tab') {
          event.preventDefault();
          if (canOpenPageAt(atlasFocus.dx, atlasFocus.dy)) {
            const entry = pageByRel.get(`${atlasFocus.dx},${atlasFocus.dy}`);
            if (entry) goToPage(entry.id);
          }
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          closeModal();
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (canOpenPageAt(atlasFocus.dx, atlasFocus.dy)) {
            const entry = pageByRel.get(`${atlasFocus.dx},${atlasFocus.dy}`);
            if (entry) goToPage(entry.id);
          }
          return;
        }
        
        if (event.key === 'ArrowLeft') { event.preventDefault(); tryMove(-1, 0); } 
        else if (event.key === 'ArrowRight') { event.preventDefault(); tryMove(1, 0); } 
        else if (event.key === 'ArrowUp') { event.preventDefault(); tryMove(0, -1); } 
        else if (event.key === 'ArrowDown') { event.preventDefault(); tryMove(0, 1); }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPages, atlasFocus, extentX, extentY, pageByRel, closeModal, goToPage, items]);

    if (!showPages) return null;

    const cells: Array<{ dx: number; dy: number; pageId?: number; coord: { x: number; y: number } }> = [];
    for (let y = -extentY; y <= extentY; y += 1) {
      for (let x = -extentX; x <= extentX; x += 1) {
        const entry = pageByRel.get(`${x},${y}`);
        const coord = entry?.coord ?? { x: rootCoord.x + x, y: rootCoord.y + y };
        cells.push({ dx: x, dy: y, pageId: entry?.id, coord });
      }
    }

    return (
      <div
        className="fixed inset-0 z-[85] bg-black/10 backdrop-blur-[2px]"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={closeModal}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6" onClick={(event) => event.stopPropagation()}>
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${mapCols}, ${baseCardWidth}px)`,
              gridAutoRows: `${baseCardHeight}px`,
              gap: `${mapGap}px`,
              transform: `scale(${gridScale})`,
              transformOrigin: 'top left'
            }}
          >
            {cells.map((cell) => {
              const pageId = cell.pageId;
              const isEmpty = pageId === undefined;
              const isActive = pageId === currentPageId;
              const pageName = pageId !== undefined ? config.pageNames?.[pageId] ?? '' : '';
              const itemsInPage = pageId !== undefined ? items.filter((item) => (item.pageIndex ?? 0) === pageId) : [];
              const isHome = pageId === 0;
              const hasContent = itemsInPage.length > 0;
              const isUsefulHere = isHome || hasContent;
              const neighbourRelCoords: Array<[number, number]> = [
                [cell.dx + 1, cell.dy], [cell.dx - 1, cell.dy], [cell.dx, cell.dy + 1], [cell.dx, cell.dy - 1]
              ];
              const hasNeighbourUseful = neighbourRelCoords.some(([nx, ny]) => {
                const entry = pageByRel.get(`${nx},${ny}`);
                if (!entry) return false;
                if (entry.id === 0) return true;
                return items.some((item) => (item.pageIndex ?? 0) === entry.id);
              });

              const hasCard = isUsefulHere || hasNeighbourUseful;
              const isFocused = atlasFocus.dx === cell.dx && atlasFocus.dy === cell.dy;
              return (
                <div
                  key={`${cell.dx},${cell.dy}`}
                  draggable={!!pageId && isPagesEditMode && pageId !== 0}
                  onDragStart={(event) => {
                    if (!isPagesEditMode || !pageId || pageId === 0) return;
                    pageDragIdRef.current = pageId;
                    event.dataTransfer.setData('text/plain', String(pageId));
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(event) => {
                    if (!isPagesEditMode) return;
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (!isPagesEditMode) return;
                    event.preventDefault();
                    const sourceId = pageDragIdRef.current ?? Number(event.dataTransfer.getData('text/plain'));
                    if (!sourceId || sourceId === pageId || sourceId === 0) return;
                    if (pageId) {
                      swapPageCoords(sourceId, pageId);
                    } else {
                      movePageToCoord(sourceId, cell.coord);
                    }
                  }}
                  onDragEnd={() => {
                    pageDragIdRef.current = null;
                  }}
                  onClick={() => {
                    if (!hasCard || pageId === undefined) return;
                    if (pageId === 0) {
                      goToPage(0);
                      return;
                    }
                    if (isPagesEditMode) return;
                    goToPage(pageId);
                  }}
                  onPointerEnter={() => {
                      setAtlasFocus({ dx: cell.dx, dy: cell.dy });
                  }}
                  className={`relative rounded-2xl border transition ${
                    !hasCard && !isPagesEditMode
                      ? 'border-transparent bg-transparent cursor-default'
                      : isEmpty
                        ? isPagesEditMode
                          ? 'border-dashed border-white/20 bg-white/5 cursor-pointer'
                          : 'border-white/5 bg-white/5 cursor-default'
                        : isActive
                          ? 'shadow-lg bg-slate-800/80 cursor-pointer'
                          : 'border-white/10 bg-slate-800/60 hover:border-white/30 cursor-pointer'
                  } ${isFocused ? 'ring-2 ring-white/60' : ''}`}
                  style={isActive ? { borderColor: currentTheme.accent, shadowColor: `${currentTheme.accent}40` } : {}}
                >
                  {pageId !== undefined && hasCard ? (
                    <div className="h-full p-3 flex flex-col">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{cell.coord.x},{cell.coord.y}</span>
                        {isHome && <span className="text-yellow-300">HOME</span>}
                      </div>
                      <div className="flex-1 mt-2 rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
                        <div className="w-full h-full grid gap-px p-2"
                          style={{
                            gridTemplateColumns: `repeat(${gridColsDisplay}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${gridMaxRows}, minmax(0, 1fr))`
                          }}
                        >
                          {itemsInPage.map((item) => {
                            if (!item.x || !item.y) return null;
                            const cols = item.cols || 1;
                            const rows = item.rows || 1;
                            const px = Math.max(1, Math.min(item.x, gridColsDisplay));
                            const py = Math.max(1, Math.min(item.y, gridMaxRows));
                            const pc = Math.max(1, Math.min(cols, gridColsDisplay - px + 1));
                            const pr = Math.max(1, Math.min(rows, gridMaxRows - py + 1));
                            return (
                              <div
                                key={item.id}
                                className="rounded-[1px] overflow-hidden border border-white/10"
                                style={{
                                  gridColumnStart: px,
                                  gridColumnEnd: `span ${pc}`,
                                  gridRowStart: py,
                                  gridRowEnd: `span ${pr}`,
                                  backgroundColor: item.bgColor || '#334155'
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-2 relative">
                        {isPagesEditMode ? (
                          <>
                            <input
                              value={pageName}
                              onFocus={(e) => { pageRenameFocusedRef.current = e.currentTarget; }}
                              onChange={(event) => {
                                const el = event.target as HTMLInputElement;
                                setConfig((prev) => ({
                                  ...prev,
                                  pageNames: { ...(prev.pageNames ?? {}), [pageId]: el.value }
                                }));
                                setTimeout(() => (pageRenameFocusedRef.current ?? el).focus(), 0);
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(event) => event.stopPropagation()}
                              placeholder={`Page ${pageId}`}
                              className="w-full bg-slate-900/70 border border-white/10 rounded-lg pl-2 pr-7 py-1 text-xs"
                            />
                            {pageName.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfig((prev) => ({
                                    ...prev,
                                    pageNames: { ...(prev.pageNames ?? {}), [pageId]: '' }
                                  }));
                                  setTimeout(() => pageRenameFocusedRef.current?.focus(), 0);
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-white/10"
                                aria-label="Effacer le nom"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-xs font-semibold text-white truncate">
                            {pageName && pageName.trim() ? pageName : `Page ${pageId}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                      {isPagesEditMode ? 'Déposer ici' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setIsPagesEditMode((prev) => !prev);
          }}
          className={`fixed top-4 right-4 px-3 py-1 rounded-full text-[10px] font-semibold border transition backdrop-blur ${
            isPagesEditMode ? 'text-white' : 'bg-white/10 border-white/10 text-white/80'
          }`}
          style={isPagesEditMode ? { backgroundColor: `${currentTheme.accent}AA`, borderColor: currentTheme.accent } : {}}
        >
          {isPagesEditMode ? 'Terminer' : 'Edit'}
        </button>
      </div>
    );
  };

  // ... (Page dot logic unchanged)
  const pageTranslate = {
    x: -(currentPageCoord.x * 100) + (isPageDragging ? pageDragOffset.x : pageSnapOffset.x),
    y: -(currentPageCoord.y * 100) + (isPageDragging ? pageDragOffset.y : pageSnapOffset.y)
  };
  const pageDotMeta = useMemo(() => {
    const root = getPageCoord(0);
    const rels = pages.map((pageId) => {
      const coord = getPageCoord(pageId);
      return { id: pageId, dx: coord.x - root.x, dy: coord.y - root.y };
    });
    let extentX = 0;
    let extentY = 0;
    rels.forEach((entry) => {
      extentX = Math.max(extentX, Math.abs(entry.dx));
      extentY = Math.max(extentY, Math.abs(entry.dy));
    });
    const cols = extentX * 2 + 1;
    const rows = extentY * 2 + 1;
    const map = new Map<string, number>();
    rels.forEach((entry) => {
      map.set(`${entry.dx},${entry.dy}`, entry.id);
    });
    return { root, extentX, extentY, cols, rows, map };
  }, [pages, getPageCoord]);
  const pageDotCols = Math.max(1, pageDotMeta.cols);
  const pageDotRows = Math.max(1, pageDotMeta.rows);
  const dotBase = Math.max(pageDotCols, pageDotRows);
  const PAGE_DOT_MAX_GRID = 200;
  let dotSize = Math.max(10, Math.min(18, Math.floor(100 / dotBase)));
  let dotGap = Math.max(4, Math.min(10, Math.floor(dotSize * 0.85)));
  let dotGridWidth = pageDotCols * dotSize + (pageDotCols - 1) * dotGap;
  let dotGridHeight = pageDotRows * dotSize + (pageDotRows - 1) * dotGap;
  const maxGridDim = Math.max(dotGridWidth, dotGridHeight);
  if (maxGridDim > PAGE_DOT_MAX_GRID) {
    const scale = PAGE_DOT_MAX_GRID / maxGridDim;
    dotSize = Math.max(6, Math.floor(dotSize * scale));
    dotGap = Math.max(2, Math.floor(dotGap * scale));
    dotGridWidth = pageDotCols * dotSize + (pageDotCols - 1) * dotGap;
    dotGridHeight = pageDotRows * dotSize + (pageDotRows - 1) * dotGap;
  }
  const configDotSize = config.pageDotsSize != null ? Math.max(8, Math.min(24, config.pageDotsSize)) : null;
  if (configDotSize != null) {
    dotSize = configDotSize;
    dotGap = Math.max(2, Math.floor(dotSize * 0.85));
    dotGridWidth = pageDotCols * dotSize + (pageDotCols - 1) * dotGap;
    dotGridHeight = pageDotRows * dotSize + (pageDotRows - 1) * dotGap;
  }
  const swipeThreshold = Math.max(10, Math.min(120, config.swipeThreshold ?? 30));
  const swipePerpTolerance = Math.max(10, Math.round(swipeThreshold * 0.8));
  const edgePadding = 16;
  const minBarSize = 56;
  const effectiveTopBar = config.barPosition === 'top' ? Math.max(barSize, minBarSize) : 0;
  const effectiveBottomBar = config.barPosition === 'bottom' ? Math.max(barSize, minBarSize) : 0;
  const topInset = (config.barPosition === 'top' ? effectiveTopBar + edgePadding : edgePadding) + paneHeaderHeight;
  const bottomInset = config.barPosition === 'bottom' ? effectiveBottomBar + edgePadding : edgePadding;

  return (
    <div
      className={`webos-root relative w-full h-full overflow-hidden select-none ${currentTheme.text}`}
      ref={rootRef}
      style={{ 
        backgroundColor: '#0b0b0b',
        '--theme-bg': currentTheme.modalBg,
        '--theme-text': currentTheme.text === 'text-white' ? '#ffffff' : '#0f172a',
        '--theme-border': currentTheme.border.replace('border-', '')
      } as React.CSSProperties}
      onPointerDown={(event) => {
        // Clic molette (bouton du milieu) = ouvrir le modal Pages
        if (event.button === 1) {
          event.preventDefault();
          setShowPages(true);
          return;
        }
        
        if (event.button !== 0) return;

        const target = event.target as Element;
        
        const isInteractiveElement = 
          target.closest('[data-widget]') || 
          target.closest('[data-window]') || 
          target.closest('.webos-dock') || 
          target.closest('.webos-taskbar') ||
          target.closest('.webos-item-icon') || 
          target.closest('[data-id]') ||
          target.closest('button') ||
          target.closest('input');

        if (isInteractiveElement) return;
        
        if (isWidgetInteractionRef.current) return;
        
        (event.currentTarget as Element).setPointerCapture(event.pointerId);

        pointerDownPos.current = { x: event.clientX, y: event.clientY };
        pageCreationBudgetRef.current = 1;
        setPageSnapOffset({ x: 0, y: 0 });
        
        if (pageSnapRafRef.current) {
          window.cancelAnimationFrame(pageSnapRafRef.current);
          pageSnapRafRef.current = null;
        }
        
        pageDragAxisRef.current = null;
        backgroundDragRef.current = { x: event.clientX, y: event.clientY };
        backgroundDragActiveRef.current = true;
        setIsPageDragging(false);
        setPageDragOffsetRaf({ x: 0, y: 0 });
        
        if (backgroundLongPressTimer.current) window.clearTimeout(backgroundLongPressTimer.current);
        if (!isEditing) {
          backgroundLongPressTimer.current = window.setTimeout(() => {
            setIsEditing(true);
            ignoreNextClickRef.current = true;
            backgroundDragActiveRef.current = false;
          }, 2000);
        }
      }}
      onPointerMove={(event) => {
        if (backgroundLongPressTimer.current && pointerDownPos.current) {
            const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
            if (dist > 10) {
              window.clearTimeout(backgroundLongPressTimer.current);
              backgroundLongPressTimer.current = null;
            }
          }
      
          if (
            backgroundDragActiveRef.current &&
            backgroundDragRef.current &&
            !isEditing &&
            !draggingId &&
            !isPageNavBlocked
          ) {
            const dx = event.clientX - backgroundDragRef.current.x;
            const dy = event.clientY - backgroundDragRef.current.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (!pageDragAxisRef.current && (absDx > 6 || absDy > 6)) {
              pageDragAxisRef.current = absDx >= absDy ? 'x' : 'y';
            }
            if (pageDragAxisRef.current === 'x') {
              const rect = gridRef.current?.getBoundingClientRect();
              const containerWidth = rect && rect.width > 50 ? rect.width : window.innerWidth;
              const dragPercent = Math.max(-100, Math.min(100, (dx / containerWidth) * 100));
              setIsPageDragging(true);
              setPageDragOffsetRaf({ x: dragPercent, y: 0 });
            } else if (pageDragAxisRef.current === 'y') {
              if (config.lockVerticalSwipe) return;
              const rect = gridRef.current?.getBoundingClientRect();
              const containerHeight = rect && rect.height > 50 ? rect.height : window.innerHeight;
              const dragPercent = Math.max(-100, Math.min(100, (dy / containerHeight) * 100));
              setIsPageDragging(true);
              setPageDragOffsetRaf({ x: 0, y: dragPercent });
            } else if (isPageDragging) {
              setPageDragOffsetRaf({ x: 0, y: 0 });
            }
          }
          if (pointerDownPos.current && !draggingId && !resizeHandle) {
            const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
            if (dist > 10 && longPressTimer.current) {
              window.clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
      
          if (resizeHandle) {
            event.preventDefault();
            const diffX = event.clientX - resizeHandle.startX;
            const diffY = event.clientY - resizeHandle.startY;
            const cellWidthPx = cellSizePx + gridGapCol;
            const cellHeightPx = cellSizePx + gridGapRow;
            const colDiff = Math.round(diffX / cellWidthPx);
            const rowDiff = Math.round(diffY / cellHeightPx);
            const rawCols = Math.max(1, resizeHandle.startCols + colDiff);
            const rawRows = Math.max(1, resizeHandle.startRows + rowDiff);
            const resizedItem = items.find((item) => item.id === resizeHandle.id);
            if (resizedItem?.x && resizedItem?.y) {
              const maxCols = Math.max(1, gridColsDisplay - resizedItem.x + 1);
              const maxRows = Math.max(1, gridMaxRows - resizedItem.y + 1);
              const newCols = Math.min(rawCols, maxCols);
              const newRows = Math.min(rawRows, maxRows);
              const overlaps = items.some((item) => {
                if (item.id === resizeHandle.id) return false;
                if (config.viewMode === 'desktop' && item.type === 'app') return false;
                if ((item.pageIndex ?? 0) !== (resizedItem.pageIndex ?? 0)) return false;
                if (!item.x || !item.y) return false;
                const w = item.cols || 1;
                const h = item.rows || 1;
                return !(
                  item.x + w <= resizedItem.x! ||
                  resizedItem.x! + newCols <= item.x ||
                  item.y + h <= resizedItem.y! ||
                  resizedItem.y! + newRows <= item.y
                );
              });
              if (newCols !== resizeHandle.currentCols || newRows !== resizeHandle.currentRows) {
                updateItem(resizeHandle.id, { cols: newCols, rows: newRows });
                setResizeHandle({ ...resizeHandle, currentCols: newCols, currentRows: newRows });
                if (overlaps) resolveOverlapsAfterResize(resizeHandle.id);
              }
            }
            return;
          }

          if (!draggingId || !dragItemRef.current) return;
          event.preventDefault();
          setDragPos({ x: event.clientX, y: event.clientY });

          if (!isPageNavBlocked) {
            const edgeThreshold = 24;
            const stableMs = 350;
            const stillThresholdPx = 10;
            const flipDelayMs = 1000;
            const containerRect = gridRef.current?.getBoundingClientRect();
            const rightEdge = containerRect ? containerRect.right : window.innerWidth;
            const leftEdge = containerRect ? containerRect.left : 0;
            const topEdge = containerRect ? containerRect.top : 0;
            const bottomEdge = containerRect ? containerRect.bottom : window.innerHeight;
      
            const scheduleFlip = (dx: number, dy: number) => {
              const currentDir = pageFlipDir.current;
              if (currentDir && currentDir.x === dx && currentDir.y === dy && pageFlipTimer.current) return;
              if (pageFlipTimer.current) window.clearTimeout(pageFlipTimer.current);
              pageFlipDir.current = { x: dx, y: dy };
              pageFlipTimer.current = window.setTimeout(() => {
                movePageBy(dx, dy);
              }, flipDelayMs);
            };
      
            const clearFlip = () => {
              if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
              pageFlipStableTimer.current = null;
              pageFlipStablePos.current = null;
              if (pageFlipTimer.current) window.clearTimeout(pageFlipTimer.current);
              pageFlipTimer.current = null;
              pageFlipDir.current = null;
            };
      
            const px = event.clientX;
            const py = event.clientY;
            const inRight = px > rightEdge - edgeThreshold;
            const inLeft = px < leftEdge + edgeThreshold;
            const inBottom = py > bottomEdge - edgeThreshold;
            const inTop = py < topEdge + edgeThreshold;
      
            if (inRight) {
              setEdgeDragDirection('right');
              const last = pageFlipStablePos.current;
              const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
              if (!still) {
                if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
                pageFlipStableTimer.current = null;
                pageFlipStablePos.current = { x: px, y: py };
              } else if (!pageFlipStableTimer.current) {
                pageFlipStablePos.current = { x: px, y: py };
                pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(1, 0), stableMs);
              }
            } else if (inLeft) {
              setEdgeDragDirection('left');
              const last = pageFlipStablePos.current;
              const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
              if (!still) {
                if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
                pageFlipStableTimer.current = null;
                pageFlipStablePos.current = { x: px, y: py };
              } else if (!pageFlipStableTimer.current) {
                pageFlipStablePos.current = { x: px, y: py };
                pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(-1, 0), stableMs);
              }
            } else if (inBottom) {
              setEdgeDragDirection('bottom');
              const last = pageFlipStablePos.current;
              const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
              if (!still) {
                if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
                pageFlipStableTimer.current = null;
                pageFlipStablePos.current = { x: px, y: py };
              } else if (!pageFlipStableTimer.current) {
                pageFlipStablePos.current = { x: px, y: py };
                pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(0, 1), stableMs);
              }
            } else if (inTop) {
              setEdgeDragDirection('top');
              const last = pageFlipStablePos.current;
              const still = !last || (Math.abs(px - last.x) <= stillThresholdPx && Math.abs(py - last.y) <= stillThresholdPx);
              if (!still) {
                if (pageFlipStableTimer.current) window.clearTimeout(pageFlipStableTimer.current);
                pageFlipStableTimer.current = null;
                pageFlipStablePos.current = { x: px, y: py };
              } else if (!pageFlipStableTimer.current) {
                pageFlipStablePos.current = { x: px, y: py };
                pageFlipStableTimer.current = window.setTimeout(() => scheduleFlip(0, -1), stableMs);
              }
            } else {
              clearFlip();
              setEdgeDragDirection(null);
            }
          }

          const container = gridRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const itemX = event.clientX - dragOffset.x;
            const itemY = event.clientY - dragOffset.y;
            const w = dragItemRef.current.cols || 1;
            const h = dragItemRef.current.rows || 1;
            const { x, y } = pixelsToGrid(itemX, itemY, rect, w, h);
            const placeholder = { x, y, w, h };
            setDragPlaceholder(placeholder);
      
            const draggedX = dragItemRef.current.x ?? layoutOverrides.get(dragItemRef.current.id)?.x;
            const draggedY = dragItemRef.current.y ?? layoutOverrides.get(dragItemRef.current.id)?.y;
            const overlapTarget = items.find((item) => {
              if (item.id === draggingId) return false;
              if (config.viewMode === 'desktop' && item.type === 'app') return false;
              if ((item.pageIndex ?? 0) !== currentPageId) return false;
              const ix = item.x ?? layoutOverrides.get(item.id)?.x;
              const iy = item.y ?? layoutOverrides.get(item.id)?.y;
              if (!ix || !iy) return false;
              const iw = item.cols || 1;
              const ih = item.rows || 1;
              return !(
                ix + iw <= placeholder.x ||
                placeholder.x + placeholder.w <= ix ||
                iy + ih <= placeholder.y ||
                placeholder.y + placeholder.h <= iy
              );
            });
      
            const nextPreview =
              overlapTarget && draggedX && draggedY
                ? {
                    targetId: overlapTarget.id,
                    targetPos: {
                      x: overlapTarget.x ?? layoutOverrides.get(overlapTarget.id)?.x ?? 0,
                      y: overlapTarget.y ?? layoutOverrides.get(overlapTarget.id)?.y ?? 0
                    },
                    draggedPos: { x: draggedX, y: draggedY }
                  }
                : null;

            const SWAP_DELAY_MS = 1000;
            const pendingTarget = pendingSwapPreviewRef.current?.targetId;
            const nextTarget = nextPreview?.targetId;
            const isSameTarget = pendingTarget != null && nextTarget != null && pendingTarget === nextTarget;

            if (!nextPreview) {
              if (swapPreviewTimerRef.current) {
                window.clearTimeout(swapPreviewTimerRef.current);
                swapPreviewTimerRef.current = null;
              }
              pendingSwapPreviewRef.current = null;
              setSwapPreview(null);
            } else if (!isSameTarget) {
              if (swapPreviewTimerRef.current) {
                window.clearTimeout(swapPreviewTimerRef.current);
              }
              pendingSwapPreviewRef.current = nextPreview;
              setSwapPreview(null);
              swapPreviewTimerRef.current = window.setTimeout(() => {
                if (pendingSwapPreviewRef.current && pendingSwapPreviewRef.current.targetPos.x && pendingSwapPreviewRef.current.targetPos.y) {
                  setSwapPreview(pendingSwapPreviewRef.current);
                }
                swapPreviewTimerRef.current = null;
              }, SWAP_DELAY_MS);
            }
          }
      }}

      onPointerUp={(event) => {
        if (backgroundLongPressTimer.current) {
          window.clearTimeout(backgroundLongPressTimer.current);
          backgroundLongPressTimer.current = null;
        }

        if (event.target === event.currentTarget && isEditing) {
            if (ignoreNextClickRef.current) {
                ignoreNextClickRef.current = false;
            } else {
                setIsEditing(false);
            }
        }

        if (longPressTimer.current) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; }
        if (pageFlipStableTimer.current) { window.clearTimeout(pageFlipStableTimer.current); pageFlipStableTimer.current = null; pageFlipStablePos.current = null; }
        if (pageFlipTimer.current) { window.clearTimeout(pageFlipTimer.current); pageFlipTimer.current = null; pageFlipDir.current = null; }
        
        if (backgroundDragActiveRef.current && backgroundDragRef.current && !isEditing && !draggingId) {
              const dragOffset = pageDragOffsetRef.current;
              if (isPageDragging) {
                let snapped = false;
                if (Math.abs(dragOffset.x) >= 30 && Math.abs(dragOffset.x) >= Math.abs(dragOffset.y)) {
                  const dirX = dragOffset.x < 0 ? 1 : -1;
                  snapped = movePageBy(dirX, 0);
                  schedulePageSnap({ x: dragOffset.x + dirX * 100, y: dragOffset.y });
                } else if (Math.abs(dragOffset.y) >= 30 && Math.abs(dragOffset.y) >= Math.abs(dragOffset.x)) {
                  if (!config.lockVerticalSwipe) {
                    const dirY = dragOffset.y < 0 ? 1 : -1;
                    snapped = movePageBy(0, dirY);
                    schedulePageSnap({ x: dragOffset.x, y: dragOffset.y + dirY * 100 });
                  }
                }
                if (!snapped) {
                  schedulePageSnap({ x: dragOffset.x, y: dragOffset.y });
                }
              }
        }
        if (isPageDragging) setIsPageDragging(false);
        backgroundDragRef.current = null;
        backgroundDragActiveRef.current = false;
        
        if (resizeHandle) {
          if (config.debugWidgetDimensions) {
            const item = items.find((i) => i.id === resizeHandle.id);
            if (item) {
              const cols = resizeHandle.currentCols;
              const rows = resizeHandle.currentRows;
              const widthPx = Math.round(cols * (cellSizePx + gridGapCol) - gridGapCol);
              const heightPx = Math.round(rows * (cellSizePx + gridGapRow) - gridGapRow);
              const label = item.type === 'widget' ? (item as WebOSWidgetItem).widgetId : item.title;
              console.log('[Nova] Widget redimensionné (touch)', {
                id: item.id,
                label,
                grille: { x: item.x, y: item.y, cols, rows },
                px: { width: widthPx, height: heightPx },
                pourCode: `cols: ${cols}, rows: ${rows}`,
              });
            }
          }
          setResizeHandle(null);
          modifierDragRef.current = false;
          setSwapPreview(null);
          return;
        }
        
        pointerDownPos.current = null;
        modifierDragRef.current = false;
        
        if (draggingId && dragItemRef.current) {
              hasJustDraggedRef.current = true;
              const dockRect = dockContainerRef.current?.getBoundingClientRect();
              const isOverDock = !!dockRect && event.clientX >= dockRect.left && event.clientX <= dockRect.right && event.clientY >= dockRect.top && event.clientY <= dockRect.bottom;
              if (isOverDock && dragItemRef.current.type === 'widget') {
                addWidgetToDock(dragItemRef.current as WebOSWidgetItem);
              } else if (!isOverDock) {
                  const container = gridRef.current;
                  if (container) {
                      const rect = container.getBoundingClientRect();
                      const itemX = event.clientX - dragOffset.x;
                      const itemY = event.clientY - dragOffset.y;
                      const draggedItemTouch = items.find((item) => item.id === draggingId);
                      const dragColsTouch = draggedItemTouch?.cols || 1;
                      const dragRowsTouch = draggedItemTouch?.rows || 1;
                      const { x, y } = pixelsToGrid(itemX, itemY, rect, dragColsTouch, dragRowsTouch);
                      
                      // Utiliser swapPreview si actif (le délai a été respecté)
                      if (swapPreview && swapPreview.targetId) {
                          if (draggedItemTouch) {
                              updateItem(draggingId, { x, y, pageIndex: currentPageId });
                              updateItem(swapPreview.targetId, { x: draggedItemTouch.x, y: draggedItemTouch.y, pageIndex: currentPageId });
                          }
                      } else {
                          // Vérifier collision avec tous les widgets (multi-cellules inclus)
                          
                          const colliding = items.find((item) => {
                            if (item.id === draggingId) return false;
                            if ((item.pageIndex ?? 0) !== currentPageId) return false;
                            if (config.viewMode === 'desktop' && item.type === 'app') return false;
                            if (!item.x || !item.y) return false;
                            
                            const itemCols = item.cols || 1;
                            const itemRows = item.rows || 1;
                            
                            const overlapX = x < (item.x + itemCols) && (x + dragColsTouch) > item.x;
                            const overlapY = y < (item.y + itemRows) && (y + dragRowsTouch) > item.y;
                            return overlapX && overlapY;
                          });
                          
                          if (!colliding) {
                              updateItem(draggingId, { x, y, pageIndex: currentPageId });
                          }
                      }
                      if (config.debugWidgetDimensions) {
                        const draggedItemTouch = items.find((item) => item.id === draggingId);
                        if (draggedItemTouch) {
                          const dragColsTouch = draggedItemTouch.cols || 1;
                          const dragRowsTouch = draggedItemTouch.rows || 1;
                          const widthPx = Math.round(dragColsTouch * (cellSizePx + gridGapCol) - gridGapCol);
                          const heightPx = Math.round(dragRowsTouch * (cellSizePx + gridGapRow) - gridGapRow);
                          const label = draggedItemTouch.type === 'widget' ? (draggedItemTouch as WebOSWidgetItem).widgetId : draggedItemTouch.title;
                          console.log('[Nova] Widget déplacé (touch)', {
                            id: draggingId,
                            label,
                            grille: { x, y, cols: dragColsTouch, rows: dragRowsTouch },
                            px: { width: widthPx, height: heightPx },
                            pourCode: `x: ${x}, y: ${y}, cols: ${dragColsTouch}, rows: ${dragRowsTouch}`,
                          });
                        }
                      }
                  }
              }
          }
        setDraggingId(null);
        setDragPlaceholder(null);
        setSwapPreview(null);
        setEdgeDragDirection(null);
        dragItemRef.current = null;
        if (swapPreviewTimerRef.current) {
          window.clearTimeout(swapPreviewTimerRef.current);
          swapPreviewTimerRef.current = null;
        }
        pendingSwapPreviewRef.current = null;
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(event) => {
        if (event.target instanceof Element && event.target.closest('[data-widget]')) return;
        event.preventDefault();
      }}
    >
      {isVideoWallpaper ? (
        <video
          src={wallpaperSrc}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setWallpaperSrc(api.resolveResourcePath(DEFAULT_CONFIG.wallpaper))}
        />
      ) : (
        <img
          src={wallpaperSrc}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={() => setWallpaperSrc(api.resolveResourcePath(DEFAULT_CONFIG.wallpaper))}
        />
      )}
      <div className="absolute inset-0 bg-black/10" />

      <div
        className={`absolute overflow-hidden ${
          config.barPosition === 'left'
            ? 'pl-20 pr-4 py-4'
            : config.barPosition === 'right'
              ? 'pr-20 pl-4 py-4'
              : config.barPosition === 'top'
                ? 'pt-0 pb-4 px-4'
                : config.barPosition === 'bottom'
                  ? 'pb-0 pt-0 px-4'
                  : 'py-4 px-4'
        }`}
        style={{
          top: topInset,
          bottom: bottomInset,
          left: 0,
          right: 0
        }}
      >
        <div
          className="absolute inset-0 gpu-layer"
          style={{
            transform: `translate3d(${pageTranslate.x}%, ${pageTranslate.y}%, 0)`,
            transition:
              isPageDragging && pageSnapOffset.x === 0 && pageSnapOffset.y === 0
                ? 'none'
                : 'transform 0.85s cubic-bezier(0.33, 1, 0.68, 1)'
          }}
        >
          {pages.map((pageIdx) => {
            const coord = getPageCoord(pageIdx);
            return (
              <div
                key={pageIdx}
                className="absolute inset-0 overflow-hidden"
                style={{ transform: `translate3d(${coord.x * 100}%, ${coord.y * 100}%, 0)` }}
              >
                <div
                  ref={pageIdx === currentPageId ? gridContainerRef : null}
                  className="relative w-full h-full min-h-0 flex items-start justify-center overflow-auto"
                >
                  <div
                    ref={pageIdx === currentPageId ? gridRef : null}
                    className="grid relative z-[1] flex-shrink-0"
                    style={{
                      gridTemplateColumns: `repeat(${gridColsDisplay}, ${cellSizePx}px)`,
                      gridTemplateRows: `repeat(${gridMaxRows}, ${cellSizePx}px)`,
                      gap: `${gridGapRow}px ${gridGapCol}px`,
                      width: gridColsDisplay * cellSizePx + (gridColsDisplay - 1) * gridGapCol,
                      height: gridMaxRows * cellSizePx + (gridMaxRows - 1) * gridGapRow
                    }}
                  >
                  {(isEditing || altKeyHeld) && pageIdx === currentPageId && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20 z-0"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)',
                        backgroundSize: `${cellSizePx + gridGapCol}px ${cellSizePx + gridGapRow}px`
                      }}
                    />
                  )}
                  {items
                    .filter((item) => (item.pageIndex ?? 0) === pageIdx)
                    .filter((item) => (config.viewMode === 'desktop' ? item.type !== 'app' : true))
                    .filter(
                      (item) =>
                        !(
                          item.type === 'widget' &&
                          (openWidgetIds.has(item.id) || item.id === fullscreenWidgetId)
                        )
                    )
                    .map((item) => renderItem(item))}

                  {dragPlaceholder && pageIdx === currentPageId && dragItemRef.current && (
                    <div
                      className="rounded-2xl overflow-hidden transition-all duration-100 pointer-events-none relative"
                      style={{
                        gridColumnStart: dragPlaceholder.x,
                        gridColumnEnd: `span ${dragPlaceholder.w}`,
                        gridRowStart: dragPlaceholder.y,
                        gridRowEnd: `span ${dragPlaceholder.h}`,
                        zIndex: 0,
                        opacity: 0.5
                      }}
                    >
                      {dragItemRef.current.type === 'widget' ? (
                        <div className="w-full h-full rounded-2xl overflow-hidden">
                          {renderWidget(dragItemRef.current as WebOSWidgetItem, { isEditingOverride: true })}
                        </div>
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center rounded-2xl text-white"
                          style={{ backgroundColor: dragItemRef.current.bgColor || '#334155' }}
                        >
                          {resolveIcon(dragItemRef.current.icon) ? (
                            <img
                              src={resolveIcon(dragItemRef.current.icon)!}
                              alt=""
                              className="w-2/3 h-2/3 object-contain"
                            />
                          ) : (
                            <span className="text-4xl filter drop-shadow-md">{dragItemRef.current.icon}</span>
                          )}
                          {(dragItemRef.current.rows || 1) > 1 && (
                            <span className="text-xs font-bold px-2 text-center mt-1">{dragItemRef.current.title}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {config.viewMode === 'desktop' && (dockItems.length > 0 || isEditing || altKeyHeld) && (
        <div
          ref={dockContainerRef}
          className="absolute left-1/2 -translate-x-1/2 max-w-[95%] w-auto z-40"
          style={{
            bottom: config.barPosition === 'bottom' ? Math.round(48 * (config.uiScale ?? 1) + 16) : 16
          }}
        >
          {dockItems.length > 0 ? (
            <Dock
              items={dockItems}
              openItemIds={openDockIds}
              themeClass={currentTheme.dock}
              onLaunch={launchItem}
              resolveIcon={resolveIcon}
              isEditMode={isEditing || altKeyHeld}
              onEnterEditMode={() => setIsEditing(true)}
              onRemoveFromDock={(item) => deleteItem(item.id)}
              onRenameItem={(item, newTitle) => updateItem(item.id, { title: newTitle })}
              onReorderDock={(reorderedItems) => {
                reorderedItems.forEach(item => {
                  updateItem(item.id, { dockOrder: item.dockOrder });
                });
              }}
              onEditItem={(item) => setEditingItem(item)}
              widgetScale={config.widgetScale ?? 1}
            />
          ) : (isEditing || altKeyHeld) ? (
            <div className="backdrop-blur-xl border border-white/20 border-dashed px-6 py-4 rounded-3xl text-white/60 text-sm text-center">
              Glissez un widget ici pour en faire une icône d’app
            </div>
          ) : null}
        </div>
      )}

      {/* Overlay bleu "glisser vers autre écran" : bande + flèche sur le bord actif */}
      {draggingId && edgeDragDirection && (
        <div
          className="fixed pointer-events-none z-[105] flex items-center justify-center transition-opacity duration-200"
          style={
            edgeDragDirection === 'bottom'
              ? { left: config.barPosition === 'left' ? barSize : 0, right: config.barPosition === 'right' ? barSize : 0, bottom: config.barPosition === 'bottom' ? barSize : 0, height: 56, background: 'linear-gradient(to top, rgba(59, 130, 246, 0.35), transparent)' }
              : edgeDragDirection === 'top'
                ? { left: config.barPosition === 'left' ? barSize : 0, right: config.barPosition === 'right' ? barSize : 0, top: config.barPosition === 'top' ? barSize : 0, height: 56, background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.35), transparent)' }
                : edgeDragDirection === 'right'
                  ? { top: config.barPosition === 'top' ? barSize : 0, bottom: config.barPosition === 'bottom' ? barSize : 0, right: config.barPosition === 'right' ? barSize : 0, width: 56, background: 'linear-gradient(to left, rgba(59, 130, 246, 0.35), transparent)' }
                  : { top: config.barPosition === 'top' ? barSize : 0, bottom: config.barPosition === 'bottom' ? barSize : 0, left: config.barPosition === 'left' ? barSize : 0, width: 56, background: 'linear-gradient(to right, rgba(59, 130, 246, 0.35), transparent)' }
          }
        >
          {edgeDragDirection === 'bottom' && <ChevronDown size={32} className="text-blue-400 drop-shadow-md" />}
          {edgeDragDirection === 'top' && <ChevronUp size={32} className="text-blue-400 drop-shadow-md" />}
          {edgeDragDirection === 'right' && <ChevronRight size={32} className="text-blue-400 drop-shadow-md" />}
          {edgeDragDirection === 'left' && <ChevronLeft size={32} className="text-blue-400 drop-shadow-md" />}
        </div>
      )}


      {windows.map((win) => (
        <WindowFrame
          key={win.id}
          window={win}
          barPosition={config.barPosition}
          barSize={barSize}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onFocus={focusWindow}
          onUpdate={updateWindow}
          barColor={currentTheme.barColor}
          widgetTransparent={config.fullscreenWidgetTransparent}
          onPinToDock={handlePinToDock}
        >
          <div style={{ zoom: config.uiScale ?? 1, width: '100%', height: '100%' }}>
            {renderWindowContent(win)}
          </div>
        </WindowFrame>
      ))}

      <div
        className={`absolute left-0 right-0 flex justify-center pointer-events-none z-[100] transition-opacity duration-300 ${
          showPageDots ? 'opacity-100' : 'opacity-0'
        }`}
        style={(() => {
          const pos = config.pageDotsPosition ?? 'bottom';
          const barPos = config.barPosition;
          const base = { maxWidth: 'min(100vw, 100%)', padding: '0 12px', boxSizing: 'content-box' as const };
          if (pos === 'center') return { ...base, top: '50%', transform: 'translateY(-50%)' };
          if (pos === 'top') return { ...base, top: barPos === 'top' ? topInset : edgePadding };
          // Dock offset plus généreux pour éviter la superposition
          const dockOffset = config.viewMode === 'desktop' && dockItems.length > 0 ? 100 : 0;
          return { ...base, bottom: barPos === 'bottom' ? bottomInset + dockOffset : edgePadding + dockOffset };
        })()}
      >
        {config.pageDotsBlurBubble !== false && (
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div
              className="rounded-2xl backdrop-blur-md bg-white/5 shrink-0"
              style={{
                width: dotGridWidth + 24,
                height: dotGridHeight + 20,
                minWidth: dotGridWidth + 24,
                minHeight: dotGridHeight + 20
              }}
            />
          </div>
        )}
        <div
          className={`grid shrink-0 relative z-[1] ${dotsExiting ? 'page-dots-spiral-exit' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${pageDotCols}, ${dotSize}px)`,
            gridTemplateRows: `repeat(${pageDotRows}, ${dotSize}px)`,
            gap: `${dotGap}px`,
            width: `${dotGridWidth}px`,
            height: `${dotGridHeight}px`
          }}
        >
          {Array.from({ length: pageDotMeta.rows }).map((_, rowIndex) =>
            Array.from({ length: pageDotMeta.cols }).map((__, colIndex) => {
              const dx = colIndex - pageDotMeta.extentX;
              const dy = rowIndex - pageDotMeta.extentY;
              const pageId = pageDotMeta.map.get(`${dx},${dy}`);

              const isMain = pageId === 0;
              const isCurrent = pageId === currentPageId;

              const neighbourCoords: Array<[number, number]> = [
                [dx + 1, dy],
                [dx - 1, dy],
                [dx, dy + 1],
                [dx, dy - 1]
              ];
              const hasNeighbourPage = neighbourCoords.some(([nx, ny]) => {
                const neighbourId = pageDotMeta.map.get(`${nx},${ny}`);
                if (neighbourId === undefined) return false;
                if (neighbourId === 0) return true;
                return items.some((item) => (item.pageIndex ?? 0) === neighbourId);
              });

              const hasContent =
                pageId !== undefined &&
                items.some((item) => (item.pageIndex ?? 0) === pageId);

              const isUsefulHere = isMain || hasContent;
              const hasDot = isUsefulHere || hasNeighbourPage;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`rounded-full transition-all ${
                    !hasDot
                      ? 'bg-transparent'
                      : isCurrent
                        ? 'bg-white scale-125'
                        : isMain
                          ? 'bg-sky-300'
                          : pageId !== undefined && hasContent
                            ? 'bg-white/60'
                            : 'bg-white/10'
                  }`}
                  style={{
                    width: `${dotSize}px`,
                    height: `${dotSize}px`
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      <Taskbar
        config={config}
        theme={{ bar: currentTheme.bar }}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        onToggleView={() => setConfig((prev) => ({ ...prev, viewMode: prev.viewMode === 'desktop' ? 'grid' : 'desktop' }))}
        onOpenSettings={() => setShowSettings(true)}
        onOpenWidgetGallery={() => setShowWidgetGallery(true)}
        onHeightChange={(height) =>
          setBarSize((prev) => (prev === height ? prev : height))
        }
        openWindows={windows.map((win) => ({ id: win.id, title: win.title, isMinimized: win.isMinimized }))}
        onFocusWindow={(id) => {
          const target = windows.find((win) => win.id === id);
          if (!target) return;
          if (!target.isMinimized && activeWindowId === id) {
            minimizeWindow(id);
            return;
          }
          if (target.isMinimized) minimizeWindow(id);
          focusWindow(id);
        }}
        onOpenPages={() => setShowPages(true)}
        currentPageLabel={currentPageLabel}
        uiScale={config.uiScale ?? 1}
      />

      <SettingsModal />
      {showWidgetGallery && (
        <WidgetGalleryStable
          visible={showWidgetGallery}
          onClose={() => { setShowWidgetGallery(false); setWidgetGallerySearch(''); }}
          search={widgetGallerySearch}
          onSearchChange={setWidgetGallerySearch}
          tab={widgetGalleryTab}
          onTabChange={setWidgetGalleryTab}
          searchInputRef={gallerySearchInputRef}
          currentTheme={currentTheme}
          uiScale={config.uiScale ?? 1}
          builtInTemplates={builtInTemplates}
          obsidgetTemplates={obsidgetTemplates}
          osExtraItems={osExtraItems}
          items={items}
          addApp={addApp}
          addWidget={addWidget}
          addWidgetFromItem={addWidgetFromItem}
        />
      )}
      
      {/* Modal d'édition des apps/icons */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onSave={(updates) => updateItem(editingItem.id, updates)}
          onDelete={() => deleteItem(editingItem.id)}
          onClose={() => setEditingItem(null)}
          uiScale={config.uiScale}
        />
      )}
      
      {showPages && (
        <PagesModalStable
          config={config}
          setConfig={setConfig}
          currentPageId={currentPageId}
          setCurrentPageId={setCurrentPageId}
          setShowPages={setShowPages}
          setIsPagesEditMode={setIsPagesEditMode}
          items={items}
          isPagesEditMode={isPagesEditMode}
          pages={pages}
          getPageCoord={getPageCoord}
          currentTheme={currentTheme}
          pageDragIdRef={pageDragIdRef}
          pageRenameFocusedRef={pageRenameFocusedRef}
          resolveIcon={resolveIcon}
          gridColsDisplay={gridColsDisplay}
          gridMaxRows={gridMaxRows}
          gridGapCol={gridGapCol}
          gridRowHeightDisplay={gridRowHeightDisplay}
          uiScale={config.uiScale ?? 1}
        />
      )}

    </div>
  );
};