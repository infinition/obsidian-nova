import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Clipboard,
  Copy,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileJson,
  FilePlus,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  FolderPlus,
  Grid3X3,
  HardDrive,
  Home,
  Image,
  LayoutGrid,
  List,
  MoreHorizontal,
  RefreshCcw,
  Rows3,
  Scissors,
  Search,
  SortAsc,
  SortDesc,
  Star,
  Trash2,
  X
} from 'lucide-react';
import type { VaultEntry, WebOSAPI } from '../types';

interface FinderViewProps {
  api: WebOSAPI;
  onOpenImage: (path: string) => void;
  /** Favoris initiaux (depuis config, sauvegardés dans data.json) */
  initialFavorites?: string[];
  /** Appelé quand les favoris changent (pour persister dans config) */
  onFavoritesChange?: (favorites: string[]) => void;
}

type ViewMode = 'grid' | 'list' | 'columns';
type SortBy = 'name' | 'type' | 'date';
type SortOrder = 'asc' | 'desc';

const isImage = (entry: VaultEntry) =>
  entry.type === 'file' && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'bmp'].includes(entry.extension || '');

const getFileIcon = (entry: VaultEntry, size = 20) => {
  const ext = (entry.extension || '').toLowerCase();
  const iconClass = 'shrink-0';
  if (entry.type === 'folder') return <Folder size={size} className={`${iconClass} text-amber-400`} />;
  if (isImage(entry)) return <Image size={size} className={`${iconClass} text-pink-400`} />;
  if (['md', 'markdown', 'txt', 'rtf'].includes(ext)) return <FileText size={size} className={`${iconClass} text-blue-400`} />;
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={size} className={`${iconClass} text-emerald-400`} />;
  if (['json', 'yaml', 'yml'].includes(ext)) return <FileJson size={size} className={`${iconClass} text-yellow-400`} />;
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'html', 'css'].includes(ext)) {
    return <FileCode size={size} className={`${iconClass} text-orange-400`} />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive size={size} className={`${iconClass} text-amber-600`} />;
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return <FileAudio size={size} className={`${iconClass} text-violet-400`} />;
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <FileVideo size={size} className={`${iconClass} text-rose-400`} />;
  return <File size={size} className={`${iconClass} text-slate-400`} />;
};

const buildMap = (entries: VaultEntry[], map: Map<string, VaultEntry>) => {
  entries.forEach((entry) => {
    map.set(entry.path, entry);
    if (entry.children) buildMap(entry.children, map);
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FinderView: React.FC<FinderViewProps> = ({
  api,
  onOpenImage,
  initialFavorites = [],
  onFavoritesChange
}) => {
  const [tree, setTree] = useState<VaultEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; paths: string[] } | null>(null);
  const [clipboard, setClipboard] = useState<{ paths: string[]; cut: boolean } | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  useEffect(() => {
    setFavorites(prev => {
      if (prev.length !== initialFavorites.length || prev.some((p, i) => initialFavorites[i] !== p)) {
        return initialFavorites;
      }
      return prev;
    });
  }, [initialFavorites]);
  const [preview, setPreview] = useState<{
    entry: VaultEntry;
    imageUrl?: string;
    content?: string;
  } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const loadTree = useCallback(async () => {
    const data = await api.listVaultTree();
    setTree(data || []);
  }, [api]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

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
    let entries = currentEntry?.children ?? tree;
    
    // Filter by search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const filter = (list: VaultEntry[]): VaultEntry[] => {
        const results: VaultEntry[] = [];
        list.forEach(entry => {
          if (entry.name.toLowerCase().includes(q) || entry.path.toLowerCase().includes(q)) {
            results.push(entry);
          }
          if (entry.children) {
            results.push(...filter(entry.children));
          }
        });
        return results;
      };
      entries = filter(entries);
    }
    
    // Sort
    return [...entries].sort((a, b) => {
      // Folders first
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'type') cmp = (a.extension || '').localeCompare(b.extension || '');
      
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [currentEntry, tree, query, sortBy, sortOrder]);

  const stats = useMemo(() => {
    let files = 0;
    let folders = 0;
    const count = (entries: VaultEntry[]) => {
      entries.forEach(entry => {
        if (entry.type === 'file') files++;
        else {
          folders++;
          if (entry.children) count(entry.children);
        }
      });
    };
    count(tree);
    return { files, folders };
  }, [tree]);

  const navigate = useCallback((path: string) => {
    setCurrentFolder(path);
    setSelectedPaths(new Set());
    setHistory(prev => [...prev.slice(0, historyIndex + 1), path]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setCurrentFolder(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setCurrentFolder(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const goUp = useCallback(() => {
    if (!currentFolder) return;
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    navigate(parts.join('/'));
  }, [currentFolder, navigate]);

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleFavorite = (path: string) => {
    setFavorites(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      onFavoritesChange?.(next);
      return next;
    });
  };

  const openEntry = (entry: VaultEntry) => {
    if (entry.type === 'folder') {
      navigate(entry.path);
      toggleExpand(entry.path);
      return;
    }
    if (isImage(entry)) onOpenImage(entry.path);
    else api.openFile(entry.path, { newLeaf: true });
  };

  const handleSelect = (path: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedPaths(prev => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    } else if (event.shiftKey && selectedPaths.size > 0) {
      const allPaths = currentChildren.map(e => e.path);
      const lastSelected = Array.from(selectedPaths).pop()!;
      const lastIdx = allPaths.indexOf(lastSelected);
      const currentIdx = allPaths.indexOf(path);
      const [start, end] = lastIdx < currentIdx ? [lastIdx, currentIdx] : [currentIdx, lastIdx];
      setSelectedPaths(new Set(allPaths.slice(start, end + 1)));
    } else {
      setSelectedPaths(new Set([path]));
    }
  };

  const handleContextMenu = (event: React.MouseEvent, entry?: VaultEntry) => {
    event.preventDefault();
    event.stopPropagation();
    const paths = entry && !selectedPaths.has(entry.path) 
      ? [entry.path]
      : Array.from(selectedPaths);
    if (entry && !selectedPaths.has(entry.path)) {
      setSelectedPaths(new Set([entry.path]));
    }
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? event.clientX - rect.left : event.clientX;
    const y = rect ? event.clientY - rect.top : event.clientY;
    setContextMenu({ x, y, paths });
  };

  const handleCopy = () => {
    if (selectedPaths.size === 0) return;
    setClipboard({ paths: Array.from(selectedPaths), cut: false });
    setContextMenu(null);
  };

  const handleCut = () => {
    if (selectedPaths.size === 0) return;
    setClipboard({ paths: Array.from(selectedPaths), cut: true });
    setContextMenu(null);
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    for (const path of clipboard.paths) {
      const entry = treeMap.get(path);
      if (!entry || entry.type !== 'file') continue;
      const dest = currentFolder ? `${currentFolder}/${entry.name}` : entry.name;
      await api.moveFile(path, dest);
    }
    if (clipboard.cut) setClipboard(null);
    setContextMenu(null);
    await loadTree();
  };

  const handleDelete = async () => {
    if (selectedPaths.size === 0) return;
    const count = selectedPaths.size;
    if (!window.confirm(`Supprimer ${count} élément${count > 1 ? 's' : ''} ?`)) return;
    for (const path of selectedPaths) {
      const entry = treeMap.get(path);
      if (entry?.type === 'file') await api.deleteFile(path);
    }
    setSelectedPaths(new Set());
    setContextMenu(null);
    await loadTree();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const path = currentFolder ? `${currentFolder}/${newFolderName}` : newFolderName;
    await api.createNote(`${path}/.gitkeep`, '');
    setNewFolderName('');
    setShowNewFolderInput(false);
    await loadTree();
  };

  const schedulePreview = async (entry: VaultEntry) => {
    if (entry.type === 'folder') {
      setPreview(null);
      return;
    }
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(async () => {
      if (isImage(entry)) {
        setPreview({
          entry,
          imageUrl: api.resolveResourcePath(entry.path)
        });
      } else if (entry.extension === 'md') {
        const raw = await api.readFile(entry.path);
        setPreview({
          entry,
          content: raw?.slice(0, 1000) || 'Document vide'
        });
      } else {
        setPreview({ entry });
      }
    }, 500);
  };

  const clearPreview = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return [];
    const parts = currentFolder.split('/').filter(Boolean);
    const crumbs: { name: string; path: string }[] = [];
    let running = '';
    parts.forEach(part => {
      running = running ? `${running}/${part}` : part;
      crumbs.push({ name: part, path: running });
    });
    return crumbs;
  }, [currentFolder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'Backspace') {
        e.preventDefault();
        goUp();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        handleCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        handleCut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        handlePaste();
      }
      if (e.key === 'Delete') {
        handleDelete();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedPaths(new Set(currentChildren.map(e => e.path)));
      }
      if (e.key === 'Enter' && selectedPaths.size === 1) {
        const entry = treeMap.get(Array.from(selectedPaths)[0]);
        if (entry) openEntry(entry);
      }
    };
    
    const el = containerRef.current;
    if (el) {
      el.addEventListener('keydown', handleKeyDown);
      return () => el.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedPaths, currentChildren, treeMap, goUp, handleCopy, handleCut, handlePaste, handleDelete, openEntry]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      setSidebarWidth(Math.max(180, Math.min(400, startWidth + diff)));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderSidebarTree = (entries: VaultEntry[], depth = 0): React.ReactNode =>
    entries.filter(e => e.type === 'folder').map(entry => {
      const isOpen = expanded.has(entry.path);
      const isActive = currentFolder === entry.path;
      return (
        <div key={entry.path}>
          <button
            className={`w-full flex items-center gap-2 text-left rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-cyan-500/20 text-white'
                : 'hover:bg-white/5 text-white/70 hover:text-white'
            }`}
            style={{ paddingLeft: 8 + depth * 16, paddingRight: 8, paddingTop: 6, paddingBottom: 6 }}
            onClick={() => {
              navigate(entry.path);
              toggleExpand(entry.path);
            }}
          >
            <ChevronRight
              size={14}
              className={`shrink-0 transition-transform text-white/40 ${isOpen ? 'rotate-90' : ''}`}
            />
            {isOpen ? <FolderOpen size={16} className="text-amber-400" /> : <Folder size={16} className="text-amber-400/80" />}
            <span className="truncate flex-1">{entry.name}</span>
          </button>
          {isOpen && entry.children && (
            <div>{renderSidebarTree(entry.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full h-full flex flex-col bg-slate-950 text-white outline-none relative"
      onContextMenu={(e) => handleContextMenu(e)}
      onWheelCapture={(e) => e.stopPropagation()}
    >
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        {sidebarVisible && (
          <aside 
            className="shrink-0 border-r border-white/10 flex flex-col bg-slate-900/50 overflow-hidden"
            style={{ width: sidebarWidth }}
          >
            <div className="p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <HardDrive size={18} />
                <span className="font-semibold">Vault</span>
              </div>
              <p className="text-xs text-white/50">{stats.files} fichiers • {stats.folders} dossiers</p>
            </div>

            <div className="p-2 border-b border-white/10 shrink-0">
              <button
                onClick={() => navigate('')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  currentFolder === '' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/5 text-white/70'
                }`}
              >
                <Home size={16} />
                <span>Accueil</span>
              </button>
              {favorites.map(path => {
                const entry = treeMap.get(path);
                if (!entry) return null;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      currentFolder === path ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/5 text-white/70'
                    }`}
                  >
                    <Star size={16} className="text-yellow-400" />
                    <span className="truncate">{entry.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {renderSidebarTree(tree)}
            </div>

            <div
              className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition ${isResizing ? 'bg-cyan-500/50' : ''}`}
              style={{ left: sidebarWidth - 2 }}
              onMouseDown={handleResizeStart}
            />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Toolbar */}
          <header className="shrink-0 border-b border-white/10 bg-slate-900/30">
            <div className="flex items-center gap-2 px-2 sm:px-4 py-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className="p-2 rounded-lg hover:bg-white/10 transition lg:hidden"
                  title="Toggle sidebar"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={goBack}
                  disabled={historyIndex === 0}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Précédent"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={goForward}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Suivant"
                >
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={goUp}
                  disabled={!currentFolder}
                  className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Dossier parent"
                >
                  <ArrowUp size={18} />
                </button>
              </div>

              <div className="hidden sm:flex flex-1 items-center gap-1 min-w-0 px-2">
                <button
                  onClick={() => navigate('')}
                  className="px-2 py-1 rounded text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  Vault
                </button>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.path}>
                    <ChevronRight size={14} className="text-white/30 shrink-0" />
                    <button
                      onClick={() => navigate(crumb.path)}
                      className={`px-2 py-1 rounded text-sm truncate max-w-[150px] transition ${
                        i === breadcrumbs.length - 1 ? 'text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="relative flex-1 sm:flex-initial sm:w-48 lg:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Rechercher"
                  className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-white/50"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-2">
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                  title="Nouveau dossier"
                >
                  <FolderPlus size={18} />
                </button>
                <button
                  onClick={loadTree}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                  title="Actualiser"
                >
                  <RefreshCcw size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-white/60'}`}
                  title="Grille"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-white/60'}`}
                  title="Liste"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('columns')}
                  className={`hidden md:block p-2 rounded-lg transition ${viewMode === 'columns' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-white/60'}`}
                  title="Colonnes"
                >
                  <Rows3 size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-1.5 border-t border-white/5 text-xs text-white/50">
              <span>{currentChildren.length} éléments</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="hidden sm:inline">Trier par</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent border border-white/10 rounded px-2 py-1 text-white/70 focus:outline-none text-xs"
                >
                  <option value="name">Nom</option>
                  <option value="type">Type</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 rounded hover:bg-white/10 transition"
                >
                  {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                </button>
              </div>
            </div>
          </header>

          {showNewFolderInput && (
            <div className="px-4 py-2 bg-slate-800/50 border-b border-white/10 flex items-center gap-2 shrink-0">
              <FolderPlus size={16} className="text-amber-400" />
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') setShowNewFolderInput(false);
                }}
                placeholder="Nom du nouveau dossier"
                className="flex-1 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium transition"
              >
                Créer
              </button>
              <button
                onClick={() => setShowNewFolderInput(false)}
                className="p-1.5 rounded hover:bg-white/10 text-white/50"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {currentChildren.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Folder size={48} className="text-white/20" />
                </div>
                <p className="text-white/60 font-medium">Dossier vide</p>
                {query && <p className="text-white/40 text-sm mt-1">Aucun résultat pour « {query} »</p>}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
                {currentChildren.map(entry => (
                  <div
                    key={entry.path}
                    className={`group flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all select-none ${
                      selectedPaths.has(entry.path)
                        ? 'border-cyan-500/50 bg-cyan-500/10 ring-2 ring-cyan-500/30'
                        : 'border-transparent hover:border-white/10 hover:bg-white/5'
                    } ${clipboard?.paths.includes(entry.path) && clipboard.cut ? 'opacity-50' : ''}`}
                    draggable={entry.type === 'file'}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', entry.path)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                    onMouseEnter={() => schedulePreview(entry)}
                    onMouseLeave={clearPreview}
                    onDoubleClick={() => openEntry(entry)}
                    onClick={(e) => handleSelect(entry.path, e)}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-2 transition ${
                      selectedPaths.has(entry.path) ? 'bg-cyan-500/20' : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      {entry.type === 'folder' ? (
                        <Folder size={28} className="text-amber-400" />
                      ) : isImage(entry) ? (
                        <img 
                          src={api.resolveResourcePath(entry.path)} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getFileIcon(entry, 28)
                      )}
                    </div>
                    <span className="text-sm text-center truncate w-full text-white/90">{entry.name}</span>
                  </div>
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="divide-y divide-white/5">
                {currentChildren.map(entry => (
                  <div
                    key={entry.path}
                    className={`flex items-center gap-4 px-4 py-2.5 cursor-pointer transition-all ${
                      selectedPaths.has(entry.path)
                        ? 'bg-cyan-500/10 text-white'
                        : 'hover:bg-white/5 text-white/80'
                    } ${clipboard?.paths.includes(entry.path) && clipboard.cut ? 'opacity-50' : ''}`}
                    draggable={entry.type === 'file'}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', entry.path)}
                    onContextMenu={(e) => handleContextMenu(e, entry)}
                    onMouseEnter={() => schedulePreview(entry)}
                    onMouseLeave={clearPreview}
                    onDoubleClick={() => openEntry(entry)}
                    onClick={(e) => handleSelect(entry.path, e)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {entry.type === 'folder' ? <Folder size={20} className="text-amber-400" /> : getFileIcon(entry, 20)}
                    </div>
                    <div className="flex-1 min-w-0 truncate font-medium">{entry.name}</div>
                    <div className="w-20 text-right text-xs text-white/40">
                      {entry.type === 'folder' ? 'Dossier' : (entry.extension || '—').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex overflow-x-auto">
                <div className="w-64 border-r border-white/10 shrink-0 overflow-y-auto">
                  {tree.map(entry => (
                    <button
                      key={entry.path}
                      onClick={() => {
                        navigate(entry.type === 'folder' ? entry.path : currentFolder);
                        if (entry.type === 'file') setSelectedPaths(new Set([entry.path]));
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                        (entry.type === 'folder' && entry.path === (breadcrumbs[0]?.path || '')) ||
                        selectedPaths.has(entry.path)
                          ? 'bg-cyan-500/20 text-white'
                          : 'hover:bg-white/5 text-white/70'
                      }`}
                    >
                      {entry.type === 'folder' ? <Folder size={16} className="text-amber-400" /> : getFileIcon(entry, 16)}
                      <span className="truncate flex-1">{entry.name}</span>
                      {entry.type === 'folder' && <ChevronRight size={14} className="text-white/30" />}
                    </button>
                  ))}
                </div>
                {breadcrumbs.length > 0 && (
                  <div className="w-64 border-r border-white/10 shrink-0 overflow-y-auto">
                    {(treeMap.get(breadcrumbs[0]?.path)?.children || []).map(entry => (
                      <button
                        key={entry.path}
                        onClick={() => {
                          if (entry.type === 'folder') navigate(entry.path);
                          else {
                            setSelectedPaths(new Set([entry.path]));
                            openEntry(entry);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                          selectedPaths.has(entry.path) || currentFolder === entry.path
                            ? 'bg-cyan-500/20 text-white'
                            : 'hover:bg-white/5 text-white/70'
                        }`}
                      >
                        {entry.type === 'folder' ? <Folder size={16} className="text-amber-400" /> : getFileIcon(entry, 16)}
                        <span className="truncate flex-1">{entry.name}</span>
                        {entry.type === 'folder' && <ChevronRight size={14} className="text-white/30" />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-900/30 overflow-y-auto">
                  {preview ? (
                    <>
                      {preview.imageUrl ? (
                        <img src={preview.imageUrl} alt="" className="max-w-full max-h-64 rounded-xl shadow-lg mb-4" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                          {getFileIcon(preview.entry, 40)}
                        </div>
                      )}
                      <h3 className="text-lg font-semibold mb-2">{preview.entry.name}</h3>
                      <p className="text-sm text-white/50">{preview.entry.path}</p>
                      {preview.content && (
                        <p className="mt-4 text-sm text-white/70 max-w-md line-clamp-6">{preview.content}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-white/40">Sélectionnez un fichier pour l'aperçu</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status bar */}
          <footer className="shrink-0 px-4 py-1.5 border-t border-white/10 bg-slate-900/30 text-xs text-white/50 flex items-center justify-between">
            <span>
              {selectedPaths.size > 0 
                ? `${selectedPaths.size} sélectionné${selectedPaths.size > 1 ? 's' : ''}`
                : `${currentChildren.length} élément${currentChildren.length !== 1 ? 's' : ''}`
              }
            </span>
            {clipboard && (
              <span className="text-cyan-400">
                {clipboard.paths.length} élément{clipboard.paths.length > 1 ? 's' : ''} {clipboard.cut ? 'coupé' : 'copié'}{clipboard.paths.length > 1 ? 's' : ''}
              </span>
            )}
          </footer>
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-[200] py-2 min-w-[200px] rounded-xl border border-white/10 shadow-2xl bg-slate-900/95 backdrop-blur-xl"
          style={{ 
            left: Math.min(contextMenu.x, (containerRef.current?.clientWidth ?? 800) - 220), 
            top: Math.min(contextMenu.y, (containerRef.current?.clientHeight ?? 600) - 300)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.paths.length === 1 && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-white/90 transition"
              onClick={() => {
                const entry = treeMap.get(contextMenu.paths[0]);
                if (entry) openEntry(entry);
                setContextMenu(null);
              }}
            >
              <FolderOpen size={16} className="text-cyan-400" />
              Ouvrir
            </button>
          )}
          <button
            className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-white/90 transition"
            onClick={handleCopy}
          >
            <Copy size={16} className="text-white/50" />
            Copier
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-white/90 transition"
            onClick={handleCut}
          >
            <Scissors size={16} className="text-white/50" />
            Couper
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-white/90 transition disabled:opacity-50"
            onClick={handlePaste}
            disabled={!clipboard}
          >
            <Clipboard size={16} className="text-white/50" />
            Coller
          </button>
          <div className="my-1 border-t border-white/10" />
          {contextMenu.paths.length === 1 && treeMap.get(contextMenu.paths[0])?.type === 'folder' && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-white/90 transition"
              onClick={() => {
                toggleFavorite(contextMenu.paths[0]);
                setContextMenu(null);
              }}
            >
              <Star size={16} className={favorites.includes(contextMenu.paths[0]) ? 'text-yellow-400' : 'text-white/50'} />
              {favorites.includes(contextMenu.paths[0]) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>
          )}
          <button
            className="w-full text-left px-4 py-2 hover:bg-red-500/20 flex items-center gap-3 text-red-400 transition"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
};