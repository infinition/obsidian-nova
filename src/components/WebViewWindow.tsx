import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw, Star } from 'lucide-react';
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

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 'about:blank';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const WebViewWindow: React.FC<WebViewWindowProps> = ({
  window: win,
  onNavigate,
  onBack,
  onForward,
  onAddWidget,
  onUpdate,
  barColor
}) => {
  const [address, setAddress] = useState(win.url ?? '');
  const [reloadKey, setReloadKey] = useState(0);
  const [favorites, setFavorites] = useState(win.favorites ?? []);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setAddress(win.url ?? '');
  }, [win.url]);

  useEffect(() => {
    setFavorites(win.favorites ?? []);
  }, [win.favorites]);

  const goToAddress = () => {
    const url = normalizeUrl(address);
    onNavigate(url);
  };

  const getFavicon = (url: string) => {
    try {
      const host = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
    } catch {
      return undefined;
    }
  };

  const addFavorite = () => {
    const url = normalizeUrl(address || win.url || '');
    if (!url) return;
    if (favorites.some((fav) => fav.url === url)) return;
    let title = url;
    try {
      const host = new URL(url).hostname.replace(/^www\./i, '');
      title = host;
    } catch {
      title = url;
    }
    const next = [
      ...favorites,
      {
        id: `${Date.now()}`,
        title,
        url,
        icon: getFavicon(url)
      }
    ];
    setFavorites(next);
    onUpdate({ favorites: next });
  };

  const renameFavorite = (id: string) => {
    const fav = favorites.find((entry) => entry.id === id);
    if (!fav) return;
    const nextTitle = window.prompt('Renommer le favori', fav.title);
    if (!nextTitle) return;
    const next = favorites.map((entry) => (entry.id === id ? { ...entry, title: nextTitle } : entry));
    setFavorites(next);
    onUpdate({ favorites: next });
  };

  const openFavorite = (url: string) => {
    setAddress(url);
    onNavigate(url);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: barColor || 'rgba(15, 23, 42, 0.85)' }}>
      <div
        className="px-2 pt-2 pb-1 flex flex-col gap-2 border-b border-white/10"
        style={{ backgroundColor: barColor || 'rgba(15, 23, 42, 0.85)' }}
      >
        <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-md hover:bg-white/10 text-white/70"
          onClick={onBack}
          title="Precedent"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          className="p-2 rounded-md hover:bg-white/10 text-white/70"
          onClick={onForward}
          title="Suivant"
        >
          <ArrowRight size={14} />
        </button>
        <button
          className="p-2 rounded-md hover:bg-white/10 text-white/70"
          onClick={() => setReloadKey((val) => val + 1)}
          title="Recharger"
        >
          <RefreshCw size={14} />
        </button>
        <button
          className="p-2 rounded-md hover:bg-white/10 text-white/70"
          onClick={() => onAddWidget(win.url || address)}
          title="Ajouter au bureau"
        >
          +
        </button>
        <form
          className="flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            goToAddress();
          }}
        >
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onBlur={goToAddress}
            className="w-full h-8 px-3 rounded-md border border-white/10 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500"
            placeholder="https://"
          />
        </form>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <button
            className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-yellow-300"
            onClick={addFavorite}
            title="Ajouter aux favoris"
          >
            <Star size={14} />
          </button>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => openFavorite(fav.url)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  renameFavorite(fav.id);
                }}
                className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 text-xs whitespace-nowrap"
                title={fav.url}
              >
                {fav.icon && <img src={fav.icon} alt="" className="w-3 h-3 rounded-sm" />}
                <span className="max-w-[120px] truncate">{fav.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <iframe
        key={reloadKey}
        ref={iframeRef}
        src={win.url}
        className="w-full h-full border-none"
        title={win.title}
        onLoad={() => {
          try {
            const href = iframeRef.current?.contentWindow?.location?.href;
            if (href && href !== win.url) {
              onNavigate(href);
            }
          } catch {
            // Ignore cross-origin access
          }
        }}
      />
    </div>
  );
};
