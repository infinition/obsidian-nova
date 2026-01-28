import { Plugin } from 'obsidian';
import { VIEW_TYPE_WEBOS, WebOSView } from './view';

export default class WebOSPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_WEBOS, (leaf) => new WebOSView(leaf, this));

    this.addRibbonIcon('monitor', 'Open Obsidian WebOS', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-webos',
      name: 'Open Obsidian WebOS',
      callback: () => this.activateView()
    });
  }

  onunload() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_WEBOS).forEach((leaf) => leaf.detach());
  }

  async activateView() {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_WEBOS,
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
  }
}

