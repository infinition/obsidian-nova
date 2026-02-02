import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Edit3, Grid, Monitor, Plus, Settings } from 'lucide-react';
import type { WebOSConfig } from '../types';

interface TaskbarTheme {
  bar: string;
}

interface TaskbarProps {
  config: WebOSConfig;
  theme: TaskbarTheme;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleView: () => void;
  onOpenSettings: () => void;
  onOpenWidgetGallery?: () => void;
  onHeightChange?: (height: number) => void;
  onOpenPages?: () => void;
  currentPageLabel?: string;
  openWindows?: { id: string; title: string; isMinimized: boolean }[];
  onFocusWindow?: (id: string) => void;
  uiScale?: number;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  config,
  theme,
  isEditing,
  onToggleEdit,
  onToggleView,
  onOpenSettings,
  onOpenWidgetGallery,
  onHeightChange,
  onOpenPages,
  currentPageLabel,
  openWindows,
  onFocusWindow,
  uiScale = 1
}) => {
  const [time, setTime] = useState(() => new Date());
  const barRef = useRef<HTMLDivElement | null>(null);
  const lastSizeRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    if (!barRef.current || !onHeightChange) return;
    const update = () => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const size = config.barPosition === 'left' || config.barPosition === 'right' ? rect.width : rect.height;
      if (lastSizeRef.current === size) return;
      lastSizeRef.current = size;
      onHeightChange(size);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [onHeightChange, config.barPosition, isEditing]);

  const scaledHeight = Math.round(48 * uiScale);
  const scaledWidth = Math.round(64 * uiScale);
  const iconSize = Math.round(20 * uiScale);
  const iconSizeSmall = Math.round(18 * uiScale);
  const iconSizeTiny = Math.round(16 * uiScale);

  return (
    <div
      ref={barRef}
      className={`webos-taskbar fixed z-30 backdrop-blur-md border-white/10 shadow-xl flex items-center justify-between gap-4 ${theme.bar}
        ${config.barPosition === 'top' ? 'top-0 left-0 right-0 border-b' : ''}
        ${config.barPosition === 'bottom' ? 'bottom-0 left-0 right-0 border-t' : ''}
        ${config.barPosition === 'left' ? 'top-0 left-0 bottom-0 flex-col py-4 border-r' : ''}
        ${config.barPosition === 'right' ? 'top-0 right-0 bottom-0 flex-col py-4 border-l' : ''}
      `}
      style={{
        height: ['top', 'bottom'].includes(config.barPosition) ? scaledHeight : undefined,
        width: ['left', 'right'].includes(config.barPosition) ? scaledWidth : undefined,
        fontSize: `${uiScale * 0.875}rem`,
        padding: `0 ${Math.round(16 * uiScale)}px`
      }}
    >
      <div className={`flex ${['left', 'right'].includes(config.barPosition) ? 'flex-col' : ''}`} style={{ gap: `${Math.round(16 * uiScale)}px` }}>
        <button onClick={onToggleView} className="hover:bg-white/20 rounded-lg" style={{ padding: `${Math.round(8 * uiScale)}px` }}>
          {config.viewMode === 'desktop' ? <Grid size={iconSize} /> : <Monitor size={iconSize} />}
        </button>
        {onOpenWidgetGallery && (
          <button
            onClick={onOpenWidgetGallery}
            className="rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Ajouter un widget"
            style={{ padding: `${Math.round(8 * uiScale)}px` }}
          >
            <Plus size={iconSizeSmall} />
          </button>
        )}
        {onOpenPages && (
          <button 
            onClick={onOpenPages} 
            className="font-semibold rounded-full bg-white/10 hover:bg-white/20"
            style={{ padding: `${Math.round(4 * uiScale)}px ${Math.round(12 * uiScale)}px`, fontSize: `${uiScale * 0.75}rem` }}
          >
            {currentPageLabel || 'Pages'}
          </button>
        )}
      </div>

      {/* Espace flexible au centre */}
      <div className={`flex-1 min-w-0 ${['left', 'right'].includes(config.barPosition) ? 'min-h-0' : ''}`} />

      <div className={`flex items-center ${['left', 'right'].includes(config.barPosition) ? 'flex-col' : ''}`} style={{ gap: `${Math.round(8 * uiScale)}px` }}>
        {openWindows?.map((win) => (
          <button
            key={win.id}
            onClick={() => onFocusWindow?.(win.id)}
            className={`rounded-md font-semibold transition ${
              win.isMinimized ? 'opacity-50 bg-white/5' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={win.title}
            style={{ padding: `${Math.round(4 * uiScale)}px ${Math.round(8 * uiScale)}px`, fontSize: `${uiScale * 0.75}rem` }}
          >
            {win.title}
          </button>
        ))}
      </div>

      {isEditing ? (
        <button
          onClick={onToggleEdit}
          className={`bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold flex items-center animate-pulse ${
            ['left', 'right'].includes(config.barPosition) ? 'vertical-text' : ''
          }`}
          style={{ padding: `${Math.round(4 * uiScale)}px ${Math.round(24 * uiScale)}px`, gap: `${Math.round(8 * uiScale)}px` }}
        >
          <Edit3 size={iconSizeTiny} /> {['left', 'right'].includes(config.barPosition) ? '' : 'OK'}
        </button>
      ) : (
        <div className="flex-1" />
      )}

      <div className={`flex items-center ${['left', 'right'].includes(config.barPosition) ? 'flex-col-reverse' : ''}`} style={{ gap: `${Math.round(16 * uiScale)}px` }}>
        <span className="font-bold whitespace-nowrap" style={{ fontSize: `${uiScale * 0.875}rem` }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {!isEditing && (
          <button onClick={onToggleEdit} className="hover:bg-white/20 rounded-lg" title="Mode Edition" style={{ padding: `${Math.round(8 * uiScale)}px` }}>
            <Edit3 size={iconSize} />
          </button>
        )}
        <button onClick={onOpenSettings} className="hover:bg-white/20 rounded-lg" style={{ padding: `${Math.round(8 * uiScale)}px` }}>
          <Settings size={iconSize} />
        </button>
      </div>
    </div>
  );
};

