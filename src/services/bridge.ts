import { TFile, TFolder, normalizePath, requestUrl } from 'obsidian';
import type { WebOSAPI, WebOSData, VaultEntry } from '../types';
import type WebOSPlugin from '../main';

const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'avif',
  'bmp'
]);

const isImage = (ext: string | undefined) => !!ext && IMAGE_EXTENSIONS.has(ext.toLowerCase());

const isRemotePath = (value: string) =>
  /^https?:\/\//i.test(value) ||
  /^data:/i.test(value) ||
  /^app:\/\//i.test(value) ||
  /^file:\/\//i.test(value);

const ensureFolderForPath = async (plugin: WebOSPlugin, filePath: string) => {
  const parts = filePath.split('/');
  parts.pop();
  if (parts.length === 0) return;
  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = plugin.app.vault.getAbstractFileByPath(current);
    if (!existing) {
      await plugin.app.vault.createFolder(current);
    }
  }
};

const buildTree = (plugin: WebOSPlugin, folder: TFolder): VaultEntry | null => {
  const children: VaultEntry[] = [];

  for (const child of folder.children) {
    if (child instanceof TFolder) {
      const entry = buildTree(plugin, child);
      if (entry) children.push(entry);
    } else if (child instanceof TFile) {
      const ext = child.extension;
      if (ext === 'md' || isImage(ext)) {
        children.push({
          path: child.path,
          name: child.name,
          type: 'file',
          extension: ext
        });
      }
    }
  }

  if (folder.path !== '/' && folder.path !== '' && children.length === 0) return null;

  return {
    path: folder.path,
    name: folder.path === '' || folder.path === '/' ? plugin.app.vault.getName() : folder.name,
    type: 'folder',
    children
  };
};

const getObsidgetPlugin = (plugin: WebOSPlugin) => {
  const obsidget = (plugin.app as unknown as { plugins?: { getPlugin?: (id: string) => unknown } })
    .plugins?.getPlugin?.('obsidian-obsidget');
  return obsidget ?? null;
};

const loadStoredData = async (plugin: WebOSPlugin) => {
  return (await plugin.loadData()) as WebOSData | null;
};

export const createBridge = (plugin: WebOSPlugin): WebOSAPI => ({
  async listVaultTree() {
    const root = plugin.app.vault.getRoot();
    const tree = buildTree(plugin, root);
    return tree?.children ?? [];
  },

  async openFile(path: string, options?: { newLeaf?: boolean }) {
    const file = plugin.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      const leaf = plugin.app.workspace.getLeaf(options?.newLeaf ?? true);
      await leaf.openFile(file, { active: true });
    }
  },

  async readFile(path: string) {
    const file = plugin.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return await plugin.app.vault.read(file);
    }
    return null;
  },

  async writeFile(path: string, contents: string) {
    await ensureFolderForPath(plugin, path);
    const file = plugin.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await plugin.app.vault.modify(file, contents);
    } else {
      await plugin.app.vault.create(path, contents);
    }
  },

  async createNote(path: string, contents: string) {
    await ensureFolderForPath(plugin, path);
    const file = plugin.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await plugin.app.vault.modify(file, contents);
    } else {
      await plugin.app.vault.create(path, contents);
    }
  },

  async deleteFile(path: string) {
    const file = plugin.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await plugin.app.vault.delete(file);
    }
  },

  async moveFile(from: string, to: string) {
    const file = plugin.app.vault.getAbstractFileByPath(from);
    if (file instanceof TFile) {
      await ensureFolderForPath(plugin, to);
      await plugin.app.fileManager.renameFile(file, normalizePath(to));
    }
  },

  async loadState() {
    return await loadStoredData(plugin);
  },

  async saveState(state: WebOSData) {
    const existing = await loadStoredData(plugin);
    const widgetState = state.widgetState ?? existing?.widgetState ?? {};
    await plugin.saveData({ ...existing, ...state, widgetState });
  },

  resolveResourcePath(path: string) {
    if (!path) return path;
    if (isRemotePath(path)) return path;
    const normalized = normalizePath(path);
    const file = plugin.app.vault.getAbstractFileByPath(normalized);
    if (file instanceof TFile) {
      return plugin.app.vault.getResourcePath(file);
    }
    return path;
  },

  async getObsidgetGallery() {
    const obsidget = getObsidgetPlugin(plugin) as { getGalleryWidgets?: () => Promise<unknown[]> } | null;
    if (!obsidget?.getGalleryWidgets) return null;
    try {
      return await obsidget.getGalleryWidgets();
    } catch {
      return null;
    }
  },

  async getObsidgetSettings() {
    const obsidget = getObsidgetPlugin(plugin) as { settings?: { maxWidthValue?: number; maxWidthUnit?: string } } | null;
    if (!obsidget?.settings) return null;
    const maxWidthValue = obsidget.settings.maxWidthValue ?? 100;
    const maxWidthUnit = obsidget.settings.maxWidthUnit === 'pixel' ? 'pixel' : 'percent';
    return { maxWidthValue, maxWidthUnit };
  },

  async requestUrl(options: unknown) {
    return await requestUrl(options as Parameters<typeof requestUrl>[0]);
  },

  getObsidianApp() {
    return plugin.app;
  },

  async getFrontmatter(path?: string) {
    const targetPath = path || plugin.app.workspace.getActiveFile()?.path;
    if (!targetPath) return {};
    const file = plugin.app.vault.getAbstractFileByPath(targetPath);
    if (file instanceof TFile) {
      const cache = plugin.app.metadataCache.getFileCache(file);
      return (cache?.frontmatter as Record<string, unknown>) || {};
    }
    return {};
  },

  async updateFrontmatter(data: Record<string, unknown>, path?: string) {
    const targetPath = path || plugin.app.workspace.getActiveFile()?.path;
    if (!targetPath) return;
    const file = plugin.app.vault.getAbstractFileByPath(targetPath);
    if (file instanceof TFile) {
      await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
        Object.assign(frontmatter, data);
      });
    }
  },

  async getFiles(extension?: string) {
    let files = plugin.app.vault.getFiles();
    if (extension) {
      const ext = extension.replace('.', '');
      files = files.filter((file) => file.extension === ext);
    }
    return files.map((file) => normalizePath(file.path));
  },

  async loadWidgetState(id: string) {
    const stored = await loadStoredData(plugin);
    return stored?.widgetState?.[id] ?? null;
  },

  async saveWidgetState(id: string, data: unknown) {
    const stored =
      (await loadStoredData(plugin)) ??
      ({
        items: [],
        config: { barPosition: 'bottom', wallpaper: '', viewMode: 'desktop', theme: 'dark' },
        windows: []
      } as WebOSData);
    const widgetState = { ...(stored.widgetState ?? {}) };
    widgetState[id] = data;
    await plugin.saveData({ ...stored, widgetState });
  }
});

