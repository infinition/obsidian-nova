import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Edit3, Grid, Monitor, Plus, Settings, Trash2 } from 'lucide-react';
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
  showTrash?: boolean;
  trashRef?: React.RefObject<HTMLDivElement>;
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
  showTrash,
  trashRef
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

  return (
    <div
      ref={barRef}
      className={`webos-taskbar fixed z-30 backdrop-blur-md border-white/10 shadow-xl flex items-center justify-between px-4 gap-4 ${theme.bar}
        ${config.barPosition === 'top' ? 'top-0 left-0 right-0 h-12 border-b' : ''}
        ${config.barPosition === 'bottom' ? 'bottom-0 left-0 right-0 h-12 border-t' : ''}
        ${config.barPosition === 'left' ? 'top-0 left-0 bottom-0 w-16 flex-col py-4 border-r' : ''}
        ${config.barPosition === 'right' ? 'top-0 right-0 bottom-0 w-16 flex-col py-4 border-l' : ''}
      `}
    >
      <div className={`flex gap-4 ${['left', 'right'].includes(config.barPosition) ? 'flex-col' : ''}`}>
        <button onClick={onToggleView} className="p-2 hover:bg-white/20 rounded-lg">
          {config.viewMode === 'desktop' ? <Grid size={20} /> : <Monitor size={20} />}
        </button>
        {isEditing && onOpenWidgetGallery && (
          <button
            onClick={onOpenWidgetGallery}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Ajouter un widget"
          >
            <Plus size={18} />
          </button>
        )}
        {showTrash && (
          <div
            ref={trashRef}
            className="w-10 h-10 rounded-full bg-red-500/90 border-2 border-white/20 shadow-lg flex items-center justify-center"
            title="Supprimer"
          >
            <Trash2 size={18} className="text-white" />
          </div>
        )}
        {onOpenPages && (
          <button onClick={onOpenPages} className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 hover:bg-white/20">
            {currentPageLabel || 'Pages'}
          </button>
        )}
      </div>

      <div className={`flex items-center gap-2 ${['left', 'right'].includes(config.barPosition) ? 'flex-col' : ''}`}>
        {openWindows?.map((win) => (
          <button
            key={win.id}
            onClick={() => onFocusWindow?.(win.id)}
            className={`px-2 py-1 rounded-md text-xs font-semibold transition ${
              win.isMinimized ? 'opacity-50 bg-white/5' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={win.title}
          >
            {win.title}
          </button>
        ))}
      </div>

      {isEditing ? (
        <button
          onClick={onToggleEdit}
          className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-1 rounded-full font-bold flex items-center gap-2 animate-pulse ${
            ['left', 'right'].includes(config.barPosition) ? 'vertical-text py-4' : ''
          }`}
        >
          <Edit3 size={16} /> {['left', 'right'].includes(config.barPosition) ? '' : 'OK'}
        </button>
      ) : (
        <div className="flex-1" />
      )}

      <div className={`flex items-center gap-4 ${['left', 'right'].includes(config.barPosition) ? 'flex-col-reverse' : ''}`}>
        <span className="font-bold text-sm whitespace-nowrap">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {!isEditing && (
          <button onClick={onToggleEdit} className="p-2 hover:bg-white/20 rounded-lg" title="Mode Edition">
            <Edit3 size={20} />
          </button>
        )}
        <button onClick={onOpenSettings} className="p-2 hover:bg-white/20 rounded-lg">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
};

