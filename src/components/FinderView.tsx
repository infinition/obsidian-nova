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
  Image,
  LayoutGrid,
  List,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash2
} from 'lucide-react';
import type { VaultEntry, WebOSAPI } from '../types';

interface FinderViewProps {
  api: WebOSAPI;
  onOpenImage: (path: string) => void;
}

type ViewMode = 'grid' | 'list';

const isImage = (entry: VaultEntry) =>
  entry.type === 'file' && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'bmp'].includes(entry.extension || '');

const getFileIcon = (entry: VaultEntry) => {
  const ext = (entry.extension || '').toLowerCase();
  if (isImage(entry)) return <Image size={20} />;
  if (['md', 'markdown', 'txt', 'rtf'].includes(ext)) return <FileText size={20} />;
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={20} />;
  if (['json', 'yaml', 'yml'].includes(ext)) return <FileJson size={20} />;
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb'].includes(ext)) {
    return <FileCode size={20} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive size={20} />;
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return <FileAudio size={20} />;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <FileVideo size={20} />;
  return <File size={20} />;
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
      return (
        <div key={entry.path} className="space-y-1">
          <button
            className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition ${
              isActive ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-white/80'
            }`}
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
            <ChevronRight size={14} className={`transition ${isOpen ? 'rotate-90' : ''}`} />
            <Folder size={16} />
            <span className="truncate">{entry.name}</span>
          </button>
          {isOpen && entry.children && (
            <div className="pl-4">{renderTree(entry.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  return (
    <div
      ref={containerRef}
      className="webos-finder w-full h-full flex text-white bg-slate-950/70"
      onMouseMove={(event) => {
        lastPointerRef.current = { x: event.clientX, y: event.clientY };
      }}
    >
      <div className="webos-finder-sidebar w-72 border-r border-white/10 bg-slate-900/70 flex flex-col">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="font-bold text-sm uppercase tracking-wide text-white/60">Navigator</div>
          <div className="text-xs text-white/40">{totalFiles} fichiers</div>
        </div>
        <div className="px-4 py-3 border-b border-white/10">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-slate-800/80 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 webos-finder-scroll">
          <button
            className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition ${
              currentFolder === '' ? 'bg-white/15 text-white' : 'hover:bg-white/10 text-white/80'
            }`}
            onClick={() => setCurrentFolder('')}
          >
            <Folder size={16} />
            <span>Workspace</span>
          </button>
          {renderTree(tree)}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/50">
          <div>
            <div className="text-lg font-bold">Explorer</div>
            <div className="text-xs text-white/50">
              {currentFolder ? currentFolder : 'Workspace'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/10' : 'hover:bg-white/10'}`}
              onClick={() => setViewMode('grid')}
              title="Galerie"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/10' : 'hover:bg-white/10'}`}
              onClick={() => setViewMode('list')}
              title="Liste"
            >
              <List size={16} />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10" onClick={loadTree} title="Rafraichir">
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 text-xs text-white/60">
          <button className="hover:text-white" onClick={() => setCurrentFolder('')}>
            Workspace
          </button>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.path}>
              <span>/</span>
              <button className="hover:text-white" onClick={() => setCurrentFolder(crumb.path)}>
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 webos-finder-scroll">
          {currentChildren.length === 0 && (
            <div className="text-white/40 text-sm">Aucun fichier trouvé.</div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentChildren.map((entry) => (
                <div
                  key={entry.path}
                  className={`p-4 rounded-xl border border-white/10 bg-slate-900/40 hover:bg-white/5 transition cursor-pointer ${
                    selectedPath === entry.path ? 'ring-2 ring-blue-500/70' : ''
                  }`}
                  draggable={entry.type === 'file'}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', entry.path);
                  }}
                  onContextMenu={(event) => handleContextMenu(event, entry)}
                  onMouseEnter={() => schedulePreview(entry)}
                  onMouseLeave={clearPreview}
                  onClick={() => {
                    setSelectedPath(entry.path);
                    if (entry.type === 'file') openEntry(entry);
                    else setCurrentFolder(entry.path);
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {entry.type === 'folder' ? <Folder size={20} /> : getFileIcon(entry)}
                    <span className="font-medium text-sm truncate">{entry.name}</span>
                  </div>
                  <div className="text-xs text-white/40">{entry.path}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {currentChildren.map((entry) => (
                <div
                  key={entry.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-slate-900/40 hover:bg-white/5 transition cursor-pointer ${
                    selectedPath === entry.path ? 'ring-2 ring-blue-500/70' : ''
                  }`}
                  draggable={entry.type === 'file'}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', entry.path);
                  }}
                  onContextMenu={(event) => handleContextMenu(event, entry)}
                  onMouseEnter={() => schedulePreview(entry)}
                  onMouseLeave={clearPreview}
                  onClick={() => {
                    setSelectedPath(entry.path);
                    if (entry.type === 'file') openEntry(entry);
                    else setCurrentFolder(entry.path);
                  }}
                >
                  {entry.type === 'folder' ? <Folder size={18} /> : React.cloneElement(getFileIcon(entry), { size: 18 })}
                  <div className="flex-1 truncate">{entry.name}</div>
                  <div className="text-xs text-white/40">{entry.type === 'folder' ? 'Dossier' : 'Fichier'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-[120] bg-slate-900 border border-white/10 rounded-lg shadow-xl text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="w-full text-left px-4 py-2 hover:bg-white/10" onClick={() => {
            const entry = treeMap.get(contextMenu.path);
            if (entry) openEntry(entry);
            setContextMenu(null);
          }}>
            Ouvrir
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-white/10" onClick={() => {
            if (!contextMenu) return;
            navigator.clipboard.writeText(contextMenu.path);
            setContextMenu(null);
          }}>
            Copier le chemin
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-white/10" onClick={handleCopy}>
            <span className="inline-flex items-center gap-2"><Clipboard size={14} /> Copier</span>
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-white/10" onClick={handleCut}>
            Couper
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-white/10"
            onClick={() => handlePaste()}
            disabled={!clipboard}
          >
            Coller
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-300" onClick={handleDelete}>
            <span className="inline-flex items-center gap-2"><Trash2 size={14} /> Supprimer</span>
          </button>
        </div>
      )}

      {preview && (
        <div
          className="fixed z-[110] max-w-sm bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl p-3 text-xs text-white/80"
          style={{ left: Math.min(preview.x + 12, window.innerWidth - 360), top: Math.min(preview.y + 12, window.innerHeight - 240) }}
          onMouseLeave={clearPreview}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-white">{preview.title}</span>
            <MoreHorizontal size={14} className="text-white/40" />
          </div>
          {preview.type === 'image' && preview.imageUrl && (
            <img src={preview.imageUrl} className="w-full h-40 object-cover rounded-lg" />
          )}
          {preview.type === 'markdown' && (
            <p className="text-white/70 leading-relaxed line-clamp-6">{preview.content}</p>
          )}
          {preview.type === 'other' && <div className="text-white/60">{preview.content}</div>}
        </div>
      )}
    </div>
  );
};
