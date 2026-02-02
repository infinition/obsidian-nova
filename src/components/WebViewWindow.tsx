import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkPlus,
  ExternalLink,
  Globe,
  Home,
  Lock,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Star,
  Trash2,
  X,
  Zap
} from 'lucide-react';
import type { WebOSWindow } from '../types';

interface WebViewWindowProps {
  window: WebOSWindow;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onAddWidget: (url: string) => void;
  onUpdate: (updates: Partial<WebOSWindow>) => void;
  barColor?: string;
}

interface Favorite {
  id: string;
  title: string;
  url: string;
  icon?: string;
  folder?: string;
}

// Convert YouTube watch URLs to embed URLs for better iframe compatibility
const convertToEmbedUrl = (url: string): string => {
  // YouTube watch -> embed
  const youtubeWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeWatchMatch) {
    return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
  }
  // YouTube shorts -> embed
  const youtubeShortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (youtubeShortsMatch) {
    return `https://www.youtube.com/embed/${youtubeShortsMatch[1]}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return url;
};

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return 'about:blank';
  
  // Check if it's a search query
  if (!trimmed.includes('.') && !trimmed.startsWith('http') && !trimmed.startsWith('localhost')) {
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  }
  
  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  
  // Convert video URLs to embed format
  return convertToEmbedUrl(url);
};

const getFaviconUrl = (url: string): string | undefined => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return undefined;
  }
};

const getDomainName = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
};

// Predefined quick access sites
const QUICK_SITES = [
  { name: 'Google', url: 'https://google.com', color: '#4285F4' },
  { name: 'YouTube', url: 'https://youtube.com', color: '#FF0000' },
  { name: 'GitHub', url: 'https://github.com', color: '#333333' },
  { name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2' },
  { name: 'Reddit', url: 'https://reddit.com', color: '#FF4500' },
  { name: 'Wikipedia', url: 'https://wikipedia.org', color: '#000000' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#F48024' },
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: '#10a37f' },
];

// LocalStorage keys for persistence
const WEBOS_BROWSER_FAVORITES_KEY = 'webos-browser-favorites';
const WEBOS_BROWSER_HISTORY_KEY = 'webos-browser-history';

const loadFavoritesFromStorage = (): Favorite[] => {
  try {
    const stored = localStorage.getItem(WEBOS_BROWSER_FAVORITES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load favorites from localStorage:', e);
  }
  return [];
};

const saveFavoritesToStorage = (favorites: Favorite[]) => {
  try {
    localStorage.setItem(WEBOS_BROWSER_FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.warn('Failed to save favorites to localStorage:', e);
  }
};

export const WebViewWindow: React.FC<WebViewWindowProps> = ({
  window: win,
  onNavigate,
  onBack,
  onForward,
  onAddWidget,
  onUpdate,
  barColor = 'rgba(15, 23, 42, 0.95)'
}) => {
  const [address, setAddress] = useState(win.url ?? '');
  const [reloadKey, setReloadKey] = useState(0);
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    // Prefer plugin data (win.favorites from data.json), then localStorage for migration
    const fromPlugin = win.favorites ?? [];
    if (fromPlugin.length > 0) return fromPlugin;
    const stored = loadFavoritesFromStorage();
    return stored.length > 0 ? stored : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFavorites, setShowFavorites] = useState(true); // Show by default
  const [isSecure, setIsSecure] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const currentUrl = win.url || '';
  const currentFavicon = currentUrl ? getFaviconUrl(currentUrl) : undefined;
  const canGoBack = (win.historyIndex ?? 0) > 0;
  const canGoForward = (win.historyIndex ?? 0) < ((win.history?.length ?? 1) - 1);
  const isFavorite = favorites.some(fav => fav.url === currentUrl);

  useEffect(() => {
    setAddress(win.url ?? '');
    setIsSecure(win.url?.startsWith('https://') ?? false);
  }, [win.url]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    saveFavoritesToStorage(favorites);
  }, [favorites]);

  const handleNavigate = (url?: string) => {
    const targetUrl = normalizeUrl(url ?? address);
    setIsLoading(true);
    onNavigate(targetUrl);
    setAddress(targetUrl);
  };

  const handleReload = () => {
    setReloadKey(prev => prev + 1);
    setIsLoading(true);
  };

  const handleAddFavorite = () => {
    const url = currentUrl;
    if (!url || isFavorite) return;
    
    const newFav: Favorite = {
      id: `fav-${Date.now()}`,
      title: pageTitle || getDomainName(url),
      url,
      icon: getFaviconUrl(url)
    };
    
    const updated = [...favorites, newFav];
    setFavorites(updated);
    onUpdate({ favorites: updated });
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter(fav => fav.id !== id);
    setFavorites(updated);
    onUpdate({ favorites: updated });
  };

  const handleRenameFavorite = (id: string) => {
    const fav = favorites.find(f => f.id === id);
    if (!fav) return;
    const newTitle = window.prompt('Renommer le favori', fav.title);
    if (!newTitle) return;
    const updated = favorites.map(f => f.id === id ? { ...f, title: newTitle } : f);
    setFavorites(updated);
    onUpdate({ favorites: updated });
  };

  const isHomePage = !currentUrl || currentUrl === 'about:blank';

  return (
    <div className="webview-window w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: barColor }}>
      {/* Navigation Bar */}
      <div className="shrink-0 border-b border-white/10" style={{ backgroundColor: barColor }}>
        {/* Main toolbar */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onBack}
              disabled={!canGoBack}
              className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:text-white transition"
              title="Précédent (Alt+←)"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={onForward}
              disabled={!canGoForward}
              className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:text-white transition"
              title="Suivant (Alt+→)"
            >
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleReload}
              className={`p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition ${isLoading ? 'animate-spin' : ''}`}
              title="Actualiser (F5)"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => handleNavigate('about:blank')}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
              title="Accueil"
            >
              <Home size={18} />
            </button>
          </div>

          {/* URL Bar */}
          <form
            className="flex-1 relative"
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigate();
            }}
          >
            <div className="relative flex items-center">
              {/* Security indicator */}
              <div className="absolute left-3 flex items-center pointer-events-none">
                {isSecure ? (
                  <Lock size={14} className="text-green-400" />
                ) : currentUrl && !isHomePage ? (
                  <Globe size={14} className="text-white/40" />
                ) : (
                  <Search size={14} className="text-white/40" />
                )}
              </div>
              
              <input
                ref={addressInputRef}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full h-10 pl-10 pr-24 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 focus:bg-white/10 transition"
                placeholder="Rechercher ou entrer une URL"
              />
              
              {/* URL actions */}
              <div className="absolute right-2 flex items-center gap-1">
                {currentUrl && !isHomePage && (
                  <button
                    type="button"
                    onClick={handleAddFavorite}
                    className={`p-1.5 rounded-lg transition ${isFavorite ? 'text-yellow-400' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                    title={isFavorite ? 'Déjà dans les favoris' : 'Ajouter aux favoris'}
                  >
                    <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAddWidget(currentUrl)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                  title="Ajouter au bureau comme widget"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`p-2 rounded-lg transition ${showFavorites ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
              title="Favoris"
            >
              <Bookmark size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                title="Plus d'options"
              >
                <MoreVertical size={18} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 py-2 rounded-xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentUrl);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-sm text-white/90 transition"
                  >
                    <Share2 size={16} className="text-white/50" />
                    Copier le lien
                  </button>
                  <button
                    onClick={() => {
                      window.open(currentUrl, '_blank');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-sm text-white/90 transition"
                  >
                    <ExternalLink size={16} className="text-white/50" />
                    Ouvrir dans le navigateur
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => {
                      onAddWidget(currentUrl);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-3 text-sm text-white/90 transition"
                  >
                    <Zap size={16} className="text-white/50" />
                    Créer un raccourci sur le bureau
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Favorites bar */}
        {showFavorites && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5 overflow-x-auto">
            <BookmarkPlus 
              size={16} 
              className="text-white/40 shrink-0 cursor-pointer hover:text-white transition"
              onClick={handleAddFavorite}
            />
            {favorites.length === 0 ? (
              <span className="text-xs text-white/40">Aucun favori. Cliquez sur ★ pour en ajouter.</span>
            ) : (
              favorites.map(fav => (
                <button
                  key={fav.id}
                  onClick={() => handleNavigate(fav.url)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const action = window.confirm('Supprimer ce favori ?') ? 'delete' : 'rename';
                    if (action === 'delete') handleRemoveFavorite(fav.id);
                    else handleRenameFavorite(fav.id);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs whitespace-nowrap transition group"
                  title={fav.url}
                >
                  {fav.icon && <img src={fav.icon} alt="" className="w-4 h-4 rounded" />}
                  <span className="max-w-[100px] truncate">{fav.title}</span>
                  <X 
                    size={12} 
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(fav.id);
                    }}
                  />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isHomePage ? (
        // Home page
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0f172a' }}>
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Search */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-2">WebOS Browser</h1>
              <p className="text-white/50">Naviguez sur le web depuis Obsidian</p>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input');
                if (input?.value) handleNavigate(input.value);
              }}
              className="mb-12"
            >
              <div className="relative max-w-2xl mx-auto">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Rechercher sur Google ou entrer une URL"
                  className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/5 border border-white/10 text-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 transition"
                />
              </div>
            </form>

            {/* Quick access */}
            <div className="mb-12">
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Accès rapide</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {QUICK_SITES.map(site => (
                  <button
                    key={site.url}
                    onClick={() => handleNavigate(site.url)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition group"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition"
                      style={{ backgroundColor: site.color }}
                    >
                      <img 
                        src={getFaviconUrl(site.url)} 
                        alt="" 
                        className="w-6 h-6"
                      />
                    </div>
                    <span className="text-xs text-white/70 truncate w-full text-center">{site.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Favorites section */}
            {favorites.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Favoris</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {favorites.map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => handleNavigate(fav.url)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition text-left group"
                    >
                      {fav.icon ? (
                        <img src={fav.icon} alt="" className="w-8 h-8 rounded-lg" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Globe size={16} className="text-white/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{fav.title}</p>
                        <p className="text-xs text-white/40 truncate">{getDomainName(fav.url)}</p>
                      </div>
                      <Trash2 
                        size={14} 
                        className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(fav.id);
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Web content
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden z-10">
              <div className="h-full bg-cyan-500 animate-[loading_1s_ease-in-out_infinite]" style={{ width: '30%' }} />
            </div>
          )}
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-none"
            title={win.title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            onLoad={() => {
              setIsLoading(false);
              try {
                const doc = iframeRef.current?.contentDocument;
                if (doc?.title) setPageTitle(doc.title);
              } catch {
                // Cross-origin
              }
            }}
          />
        </div>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};
