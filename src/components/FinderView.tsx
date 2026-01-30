import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Clipboard,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  Image,
  LayoutGrid,
  List,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash2,
  X
} from 'lucide-react';
import type { VaultEntry, WebOSAPI } from '../types';

interface FinderViewProps {
  api: WebOSAPI;
  onOpenImage: (path: string) => void;
}

type ViewMode = 'grid' | 'list';

const isImage = (entry: VaultEntry) =>
  entry.type === 'file' && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'bmp'].includes(entry.extension || '');

const getFileIcon = (entry: VaultEntry, size = 20) => {
  const ext = (entry.extension || '').toLowerCase();
  const iconClass = 'shrink-0 text-slate-300';
  if (entry.type === 'folder') return <Folder size={size} className="shrink-0 text-amber-400/90" />;
  if (isImage(entry)) return <Image size={size} className={`${iconClass} text-amber-400/90`} />;
  if (['md', 'markdown', 'txt', 'rtf'].includes(ext)) return <FileText size={size} className={`${iconClass} text-blue-400/90`} />;
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={size} className={`${iconClass} text-emerald-500/90`} />;
  if (['json', 'yaml', 'yml'].includes(ext)) return <FileJson size={size} className={`${iconClass} text-yellow-400/90`} />;
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb'].includes(ext)) {
    return <FileCode size={size} className={`${iconClass} text-orange-400/90`} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive size={size} className={`${iconClass} text-amber-600/90`} />;
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return <FileAudio size={size} className={`${iconClass} text-violet-400/90`} />;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <FileVideo size={size} className={`${iconClass} text-rose-400/90`} />;
  return <File size={size} className={iconClass} />;
};

const buildMap = (entries: VaultEntry[], map: Map<string, VaultEntry>) => {
  entries.forEach((entry) => {
    map.set(entry.path, entry);
    if (entry.children) buildMap(entry.children, map);
  });
};

export const FinderView: React.FC<FinderViewProps> = ({ api, onOpenImage }) => {
  const [tree, setTree] = useState<VaultEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string; cut: boolean } | null>(null);
  const [preview, setPreview] = useState<{
    x: number;
    y: number;
    title: string;
    type: 'image' | 'markdown' | 'other';
    content?: string;
    imageUrl?: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadTree = async () => {
    const data = await api.listVaultTree();
    setTree(data);
  };

  useEffect(() => {
    loadTree();
  }, [api]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const treeMap = useMemo(() => {
    const map = new Map<string, VaultEntry>();
    buildMap(tree, map);
    return map;
  }, [tree]);

  const currentEntry = useMemo(() => treeMap.get(currentFolder), [treeMap, currentFolder]);
  const currentChildren = useMemo(() => {
    const entries = currentEntry?.children ?? tree;
    if (!query.trim()) return entries;
    const q = query.trim().toLowerCase();
    const filter = (list: VaultEntry[]) =>
      list.filter((entry) => entry.name.toLowerCase().includes(q) || entry.path.toLowerCase().includes(q));
    return filter(entries);
  }, [currentEntry, tree, query]);

  const totalFiles = useMemo(() => {
    const count = (entries: VaultEntry[]): number =>
      entries.reduce((acc, entry) => {
        if (entry.type === 'file') return acc + 1;
        if (entry.children) return acc + count(entry.children);
        return acc;
      }, 0);
    return count(tree);
  }, [tree]);

  const toggleFolder = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openEntry = (entry: VaultEntry) => {
    if (entry.type === 'folder') {
      setCurrentFolder(entry.path);
      toggleFolder(entry.path);
      return;
    }
    if (isImage(entry)) onOpenImage(entry.path);
    else api.openFile(entry.path, { newLeaf: true });
  };

  const schedulePreview = (entry: VaultEntry) => {
    if (entry.type === 'folder') return;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(async () => {
      const { x, y } = lastPointerRef.current;
      if (isImage(entry)) {
        setPreview({
          x,
          y,
          title: entry.name,
          type: 'image',
          imageUrl: api.resolveResourcePath(entry.path)
        });
        return;
      }
      if (entry.extension === 'md') {
        const raw = (await api.readFile(entry.path)) || '';
        const snippet = raw.replace(/[#>*`_\-\[\]]/g, '').trim().slice(0, 500);
        setPreview({
          x,
          y,
          title: entry.name,
          type: 'markdown',
          content: snippet || 'Document vide'
        });
        return;
      }
      setPreview({
        x,
        y,
        title: entry.name,
        type: 'other',
        content: entry.path
      });
    }, 2000);
  };

  const clearPreview = () => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
    setPreview(null);
  };

  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return [];
    const parts = currentFolder.split('/').filter(Boolean);
    const crumbs: { name: string; path: string }[] = [];
    let running = '';
    parts.forEach((part) => {
      running = running ? `${running}/${part}` : part;
      crumbs.push({ name: part, path: running });
    });
    return crumbs;
  }, [currentFolder]);

  const handleContextMenu = (event: React.MouseEvent, entry: VaultEntry) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedPath(entry.path);
    setContextMenu({ x: event.clientX, y: event.clientY, path: entry.path });
  };

  const handleCopy = () => {
    if (!selectedPath) return;
    setClipboard({ path: selectedPath, cut: false });
    setContextMenu(null);
  };

  const handleCut = () => {
    if (!selectedPath) return;
    setClipboard({ path: selectedPath, cut: true });
    setContextMenu(null);
  };

  const handlePaste = async (targetFolder?: string) => {
    if (!clipboard) return;
    const target = targetFolder ?? currentFolder;
    const entry = treeMap.get(clipboard.path);
    if (!entry || entry.type !== 'file') return;
    const name = entry.name;
    const dest = target ? `${target}/${name}` : name;
    await api.moveFile(entry.path, dest);
    if (!clipboard.cut) setClipboard(null);
    setContextMenu(null);
    await loadTree();
  };

  const handleDelete = async () => {
    if (!selectedPath) return;
    const entry = treeMap.get(selectedPath);
    if (!entry || entry.type !== 'file') return;
    if (!window.confirm(`Supprimer "${entry.name}" ?`)) return;
    await api.deleteFile(entry.path);
    setContextMenu(null);
    setSelectedPath(null);
    await loadTree();
  };

  const renderTree = (entries: VaultEntry[], depth = 0) =>
    entries.map((entry) => {
      if (entry.type !== 'folder') return null;
      const isOpen = expanded.has(entry.path);
      const isActive = currentFolder === entry.path;
      const indent = depth * 14;
      return (
        <div key={entry.path} className="webos-finder-tree-item">
          <button
            className={`w-full flex items-center gap-2.5 text-left rounded-lg transition-all duration-150 text-sm border border-transparent ${
              isActive
                ? 'bg-cyan-500/20 text-white border-cyan-400/30 shadow-sm'
                : 'hover:bg-white/[0.08] text-white/90 hover:border-white/10'
            }`}
            style={{ paddingLeft: 10 + indent, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }}
            onClick={() => {
              setCurrentFolder(entry.path);
              toggleFolder(entry.path);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={async (event) => {
              event.preventDefault();
              const payload = event.dataTransfer.getData('text/plain');
              if (!payload) return;
              await api.moveFile(payload, `${entry.path}/${payload.split('/').pop()}`);
              await loadTree();
            }}
          >
            <ChevronRight
              size={14}
              className={`shrink-0 transition-transform duration-150 text-white/50 ${isOpen ? 'rotate-90' : ''}`}
            />
            {isOpen ? (
              <FolderOpen size={16} className="shrink-0 text-amber-400/90" />
            ) : (
              <Folder size={16} className="shrink-0 text-amber-400/80" />
            )}
            <span className="truncate flex-1 min-w-0 font-medium">{entry.name}</span>
          </button>
          {isOpen && entry.children && (
            <div className="relative" style={{ marginLeft: indent + 20 }}>
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-white/10 rounded-full"
                style={{ left: 6 }}
                aria-hidden
              />
              {renderTree(entry.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  const goToParentFolder = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    setCurrentFolder(parts.join('/'));
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        goToParentFolder();
      }
      if (e.key === 'Enter' && selectedPath) {
        const entry = treeMap.get(selectedPath);
        if (entry) openEntry(entry);
      }
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [selectedPath, currentFolder, treeMap]);

  return (
    <div
      ref={containerRef}
      className="webos-finder w-full h-full flex flex-col text-white min-h-0 overflow-hidden"
      style={{ touchAction: 'pan-y', minHeight: 0 }}
      onMouseMove={(event) => {
        lastPointerRef.current = { x: event.clientX, y: event.clientY };
      }}
    >
      {/* Sidebar */}
      <aside className="webos-finder-sidebar w-[260px] shrink-0 border-r border-white/10 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 py-5 shrink-0 border-b border-white/10">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-cyan-400/90">Navigateur</h2>
          <p className="text-xs text-white/50 mt-1">{totalFiles} éléments</p>
        </div>
        <div className="px-3 py-3 shrink-0 border-b border-white/10">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              value={query}
              onChange={(event) => {
                const el = event.target as HTMLInputElement;
                setQuery(el.value);
                setTimeout(() => el.focus(), 0);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Rechercher dans le vault…"
              className="w-full bg-white/[0.06] border border-white/10 rounded-full pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/40 transition-all"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-70 hover:opacity-100 hover:bg-white/10 text-white/80 transition"
                aria-label="Effacer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <nav className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="px-2 pt-3 pb-1 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-2">Favoris</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 webos-finder-scroll">
            <button
              className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                currentFolder === '' ? 'bg-cyan-500/25 text-white shadow-lg shadow-cyan-500/10' : 'hover:bg-white/10 text-white/90'
              }`}
              onClick={() => setCurrentFolder('')}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Folder size={18} className="text-amber-400" />
              </div>
              <span className="truncate font-medium">Workspace</span>
            </button>
            <div className="pt-4 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-2">Dossiers</span>
            </div>
            {renderTree(tree)}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        <header className="shrink-0 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap webos-finder-path-pill">
                <button
                  type="button"
                  onClick={() => setCurrentFolder('')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 webos-finder-path-pill"
                  title="Workspace"
                >
                  Workspace
                </button>
                {breadcrumbs.map((crumb) => (
                  <React.Fragment key={crumb.path}>
                    <span className="text-white/30 px-0.5">/</span>
                    <button
                      type="button"
                      onClick={() => setCurrentFolder(crumb.path)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 truncate max-w-[140px] webos-finder-path-pill"
                      title={crumb.path}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-cyan-500/25 text-cyan-300' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                onClick={() => setViewMode('grid')}
                title="Vue grille"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-cyan-500/25 text-cyan-300' : 'hover:bg-white/10 text-white/60 hover:text-white'}`}
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                <List size={18} />
              </button>
              <button
                className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                onClick={loadTree}
                title="Rafraîchir (F5)"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden webos-finder-scroll" style={{ minHeight: 0 }}>
          {currentChildren.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[280px] px-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Folder size={36} className="text-white/20" />
              </div>
              <p className="text-white/60 font-medium">Ce dossier est vide</p>
              {query.trim() && (
                <p className="text-white/40 text-sm mt-1">Aucun résultat pour « {query} »</p>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {currentChildren.map((entry) => (
                <div
                  key={entry.path}
                  className={`webos-finder-grid-card flex flex-col items-center p-6 rounded-2xl border cursor-pointer group select-none ${
                    selectedPath === entry.path
                      ? 'border-cyan-400/50 bg-cyan-500/15 ring-2 ring-cyan-400/30'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                  }`}
                  draggable={entry.type === 'file'}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', entry.path)}
                  onContextMenu={(e) => handleContextMenu(e, entry)}
                  onMouseEnter={() => schedulePreview(entry)}
                  onMouseLeave={clearPreview}
                  onDoubleClick={() => {
                    if (entry.type === 'file') openEntry(entry);
                    else setCurrentFolder(entry.path);
                  }}
                  onClick={() => {
                    setSelectedPath(entry.path);
                    if (entry.type === 'folder') setCurrentFolder(entry.path);
                  }}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                    selectedPath === entry.path ? 'bg-cyan-500/20' : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    {entry.type === 'folder' ? (
                      expanded.has(entry.path) ? (
                        <FolderOpen size={32} className="text-amber-400" />
                      ) : (
                        <Folder size={32} className="text-amber-400" />
                      )
                    ) : (
                      getFileIcon(entry, 32)
                    )}
                  </div>
                  <span className="font-medium text-sm truncate w-full text-center text-white/95">{entry.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="min-w-0">
              <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2.5 border-b border-white/10 bg-black/40 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider text-white/50">
                <div className="w-10 shrink-0" />
                <div className="flex-1 min-w-0">Nom</div>
                <div className="w-24 shrink-0 text-right">Type</div>
              </div>
              <div className="divide-y divide-white/5">
                {currentChildren.map((entry) => (
                  <div
                    key={entry.path}
                    className={`webos-finder-list-row flex items-center gap-4 px-4 py-3 cursor-pointer ${
                      selectedPath === entry.path ? 'bg-cyan-500/15 text-white' : 'hover:bg-white/5 text-white/90'
                    }`}
                    draggable={entry.type === 'file'}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', entry.path)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                    onMouseEnter={() => schedulePreview(entry)}
                    onMouseLeave={clearPreview}
                    onDoubleClick={() => {
                      if (entry.type === 'file') openEntry(entry);
                      else setCurrentFolder(entry.path);
                    }}
                    onClick={() => {
                      setSelectedPath(entry.path);
                      if (entry.type === 'folder') setCurrentFolder(entry.path);
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      {entry.type === 'folder' ? (
                        expanded.has(entry.path) ? (
                          <FolderOpen size={20} className="text-amber-400" />
                        ) : (
                          <Folder size={20} className="text-amber-400" />
                        )
                      ) : (
                        getFileIcon(entry, 20)
                      )}
                    </div>
                    <div className="flex-1 min-w-0 truncate font-medium text-sm">{entry.name}</div>
                    <div className="w-24 shrink-0 text-right text-xs text-white/50">
                      {entry.type === 'folder' ? 'Dossier' : (entry.extension || '—').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {contextMenu && (
        <div
          className="fixed z-[120] py-1.5 min-w-[200px] rounded-2xl border border-white/10 shadow-2xl text-sm backdrop-blur-xl bg-slate-900/95"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-white/90 transition"
            onClick={() => {
              const entry = treeMap.get(contextMenu.path);
              if (entry) openEntry(entry);
              setContextMenu(null);
            }}
          >
            <FolderOpen size={16} className="text-cyan-400/80 shrink-0" />
            Ouvrir
          </button>
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-white/90 transition"
            onClick={() => {
              if (!contextMenu) return;
              navigator.clipboard.writeText(contextMenu.path);
              setContextMenu(null);
            }}
          >
            <File size={16} className="text-white/50 shrink-0" />
            Copier le chemin
          </button>
          <div className="my-1 border-t border-white/10" />
          <button className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-white/90 transition" onClick={handleCopy}>
            <Clipboard size={16} className="text-white/50 shrink-0" />
            Copier
          </button>
          <button className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-white/90 transition" onClick={handleCut}>
            Couper
          </button>
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-white/10 flex items-center gap-3 text-white/90 transition disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => handlePaste()}
            disabled={!clipboard}
          >
            <Clipboard size={16} className="text-white/50 shrink-0" />
            Coller
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            className="w-full text-left px-4 py-2.5 hover:bg-red-500/20 flex items-center gap-3 text-red-300/90 transition"
            onClick={handleDelete}
          >
            <Trash2 size={16} className="shrink-0" />
            Supprimer
          </button>
        </div>
      )}

      {preview && (
        <div
          className="fixed z-[110] max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl bg-slate-900/95"
          style={{ left: Math.min(preview.x + 16, window.innerWidth - 340), top: Math.min(preview.y + 16, window.innerHeight - 260) }}
          onMouseLeave={clearPreview}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="font-semibold text-white truncate pr-2">{preview.title}</span>
            <MoreHorizontal size={16} className="text-white/40 shrink-0" />
          </div>
          <div className="p-4 text-xs text-white/80">
            {preview.type === 'image' && preview.imageUrl && (
              <img src={preview.imageUrl} alt="" className="w-full h-44 object-cover rounded-xl" />
            )}
            {preview.type === 'markdown' && (
              <p className="text-white/70 leading-relaxed line-clamp-6">{preview.content}</p>
            )}
            {preview.type === 'other' && <div className="text-white/60 font-mono truncate">{preview.content}</div>}
          </div>
        </div>
      )}
    </div>
  );
};
