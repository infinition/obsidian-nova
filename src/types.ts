export type WebOSItemType = 'app' | 'folder' | 'widget';

export interface WebOSItemBase {
  id: string;
  type: WebOSItemType;
  title: string;
  icon?: string;
  cols?: number;
  rows?: number;
  x?: number;
  y?: number;
  pageIndex?: number;
  dockOrder?: number;
  bgColor?: string;
  fullSize?: boolean;
  external?: boolean;
  notifications?: number;
}

export interface WebOSAppItem extends WebOSItemBase {
  type: 'app';
  url?: string;
  appId?: 'finder' | 'browser' | 'custom' | 'pinned-widget';
  /** Id du widget épinglé au dock (quand appId === 'pinned-widget') */
  pinnedWidgetItemId?: string;
}

export interface WebOSFolderItem extends WebOSItemBase {
  type: 'folder';
  children: WebOSItem[];
}

export interface WebOSWidgetItem extends WebOSItemBase {
  type: 'widget';
  widgetId: string;
  html?: string;
  css?: string;
  js?: string;
}

export type WebOSItem = WebOSAppItem | WebOSFolderItem | WebOSWidgetItem;

export type ThemeId = 'dark' | 'light' | 'cyberpunk' | 'forest';

export interface WebOSConfig {
  barPosition: 'top' | 'bottom' | 'left' | 'right';
  wallpaper: string;
  viewMode: 'grid' | 'desktop';
  theme: ThemeId;
  pageNames?: Record<number, string>;
  pageOrder?: number[];
  pageCoords?: Record<number, { x: number; y: number }>;
  swipeThreshold?: number;
  lockVerticalSwipe?: boolean;
  transparentObsidgetWidgets?: boolean;
  fullscreenWidgetTransparent?: boolean;
  /** Position verticale des indicateurs de page : haut, centre, bas (avec logique dock) */
  pageDotsPosition?: 'top' | 'center' | 'bottom';
  /** Taille des points (px), 8–24 */
  pageDotsSize?: number;
  /** Durée d'affichage des points avant disparition (ms) */
  pageDotsDurationMs?: number;
  /** Bulle floutée sous les points pour lisibilité */
  pageDotsBlurBubble?: boolean;
}

export type WindowKind = 'url' | 'finder' | 'image' | 'note' | 'todo' | 'custom' | 'widget';

export interface WebOSWindow {
  id: string;
  itemId?: string;
  widgetItemId?: string;
  title: string;
  kind: WindowKind;
  url?: string;
  path?: string;
  history?: string[];
  historyIndex?: number;
  favorites?: { id: string; title: string; url: string; icon?: string }[];
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface WebOSWidgetTemplate {
  id: string;
  title: string;
  cols: number;
  rows: number;
  bgColor: string;
  kind: 'runner' | 'react';
  html?: string;
  css?: string;
  js?: string;
  source?: 'webos' | 'obsidget';
}

export interface WebOSData {
  items: WebOSItem[];
  config: WebOSConfig;
  windows: WebOSWindow[];
  widgetTemplates?: WebOSWidgetTemplate[];
  widgetState?: Record<string, unknown>;
}

export interface VaultEntry {
  path: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: VaultEntry[];
}

export interface WebOSAPI {
  listVaultTree(): Promise<VaultEntry[]>;
  openFile(path: string, options?: { newLeaf?: boolean }): Promise<void>;
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, contents: string): Promise<void>;
  createNote(path: string, contents: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  moveFile(from: string, to: string): Promise<void>;
  loadState(): Promise<WebOSData | null>;
  saveState(state: WebOSData): Promise<void>;
  resolveResourcePath(path: string): string;
  getObsidgetGallery(): Promise<unknown[] | null>;
  getObsidgetSettings(): Promise<{ maxWidthValue: number; maxWidthUnit: 'percent' | 'pixel' } | null>;
  requestUrl(options: unknown): Promise<unknown>;
  getObsidianApp(): unknown;
  getFrontmatter(path?: string): Promise<Record<string, unknown>>;
  updateFrontmatter(data: Record<string, unknown>, path?: string): Promise<void>;
  getFiles(extension?: string): Promise<string[]>;
  loadWidgetState(id: string): Promise<unknown | null>;
  saveWidgetState(id: string, data: unknown): Promise<void>;
}

