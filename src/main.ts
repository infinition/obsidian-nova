import { Plugin } from 'obsidian';
import { VIEW_TYPE_WEBOS, WebOSView } from './view';

export default class WebOSPlugin extends Plugin {
  async onload() {
    // Ajouter le viewport meta pour mobile (iPad/iPhone)
    this.addMobileViewport();

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

  private addMobileViewport() {
    try {
      // S'assurer que le viewport est correctement configuré sur mobile
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
      }
    } catch (e) {
      // document may not be available in some build steps
    }
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