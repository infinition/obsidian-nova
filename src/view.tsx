import { ItemView, WorkspaceLeaf } from 'obsidian';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Desktop } from './components/Desktop';
import { createBridge } from './services/bridge';
import type WebOSPlugin from './main';

export const VIEW_TYPE_WEBOS = 'webos-view';

export class WebOSView extends ItemView {
  private root: Root | null = null;
  private plugin: WebOSPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: WebOSPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_WEBOS;
  }

  getDisplayText() {
    return 'Obsidian WebOS';
  }

  async onOpen() {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('webos-view-container');
    const rootEl = container.createDiv();
    this.root = createRoot(rootEl);
    this.root.render(<Desktop api={createBridge(this.plugin)} />);
  }

  async onClose() {
    this.root?.unmount();
    this.root = null;
  }
}

