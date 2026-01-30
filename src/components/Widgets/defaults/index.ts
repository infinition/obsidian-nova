import type { WebOSItem } from '../../../types';
import { defaultFinder } from './finder';
import { defaultBrowser } from './browser';
import { defaultYoutube } from './youtube';
import { defaultWidgetBtc } from './widget-btc';
import { defaultWidgetCalc } from './widget-calc';
import { defaultWidgetTictactoe } from './widget-tictactoe';
import { defaultWidgetSystem } from './widget-system';
import { defaultWidgetPing } from './widget-ping';
import { defaultWidgetWaterAdv } from './widget-water-adv';
import { defaultWidgetCoffee } from './widget-coffee';
import { defaultWidgetKanban } from './widget-kanban';
import { defaultWidgetIde } from './widget-ide';

/** Items par défaut du bureau (apps + widgets inline). Les widgets issus de templates (2048, chifoumi) sont ajoutés dans Desktop.tsx via buildWidgetItem. */
export const DEFAULT_ITEMS_BASE: WebOSItem[] = [
  defaultFinder,
  defaultBrowser,
  defaultYoutube,
  defaultWidgetBtc,
  defaultWidgetCalc,
  defaultWidgetTictactoe,
  defaultWidgetSystem,
  defaultWidgetPing,
  defaultWidgetWaterAdv,
  defaultWidgetCoffee,
  defaultWidgetKanban,
  defaultWidgetIde
];

/** Apps intégrées affichées dans la galerie pour pouvoir les remettre si supprimées */
export const BUILT_IN_APP_TEMPLATES: WebOSItem[] = [
  {
    id: 'finder',
    type: 'app',
    title: 'Finder',
    icon: 'F',
    cols: 1,
    rows: 1,
    bgColor: '#3b82f6',
    appId: 'finder'
  },
  {
    id: 'browser',
    type: 'app',
    title: 'Web',
    icon: 'W',
    cols: 1,
    rows: 1,
    bgColor: '#ffffff',
    url: 'https://obsidian.md',
    appId: 'browser'
  }
];
