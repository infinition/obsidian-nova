import type { WebOSItem } from '../../../types';
import { DEFAULT_ITEMS_BASE } from './defaultsRegistry';

/** Default desktop items (apps + inline widgets). Template widgets (2048, RPS) are added in Desktop.tsx via buildWidgetItem. */
export { DEFAULT_ITEMS_BASE };

/** Built-in apps shown in the gallery so they can be re-added if removed */
export const BUILT_IN_APP_TEMPLATES: WebOSItem[] = [
  {
    id: 'finder',
    type: 'app',
    title: 'Finder',
    icon: 'F',
    cols: 2,
    rows: 2,
    bgColor: '#3b82f6',
    appId: 'finder'
  },
  {
    id: 'browser',
    type: 'app',
    title: 'Web',
    icon: 'W',
    cols: 2,
    rows: 2,
    bgColor: '#ffffff',
    url: 'https://obsidian.md',
    appId: 'browser'
  }
];
