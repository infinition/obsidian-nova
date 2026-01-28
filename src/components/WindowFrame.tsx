import React, { useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';
import type { WebOSConfig, WebOSWindow } from '../types';

interface WindowFrameProps {
  window: WebOSWindow;
  barPosition: WebOSConfig['barPosition'];
  barSize: number;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WebOSWindow>) => void;
  barColor?: string;
  widgetTransparent?: boolean;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  barPosition,
  barSize,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onUpdate,
  barColor,
  widgetTransparent,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (win.isMaximized) return;
    onFocus(win.id);
    setIsDragging(true);
    setDragOffset({ x: e.clientX - win.x, y: e.clientY - win.y });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        onUpdate(win.id, { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
      } else if (isResizing) {
        onUpdate(win.id, {
          w: Math.max(360, resizeStart.w + (e.clientX - resizeStart.x)),
          h: Math.max(240, resizeStart.h + (e.clientY - resizeStart.y))
        });
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, win.id, onUpdate]);

  if (win.isMinimized) return null;

  const defaultBarSize = barPosition === 'left' || barPosition === 'right' ? 64 : 48;
  const effectiveBarSize = barSize > 0 ? barSize : defaultBarSize;
  const maxInsets = win.isMaximized
    ? {
        top: barPosition === 'top' ? effectiveBarSize : 0,
        right: barPosition === 'right' ? effectiveBarSize : 0,
        bottom: barPosition === 'bottom' ? effectiveBarSize : 0,
        left: barPosition === 'left' ? effectiveBarSize : 0
      }
    : null;

  return (
    <div
      data-window="true"
      className={`absolute flex flex-col overflow-hidden rounded-lg shadow-2xl border border-white/20 backdrop-blur-xl transition-all duration-200 gpu-layer ${
        win.isMaximized ? 'rounded-none' : ''
      }`}
      style={{
        left: win.isMaximized ? maxInsets?.left : win.x,
        top: win.isMaximized ? maxInsets?.top : win.y,
        right: win.isMaximized ? maxInsets?.right : undefined,
        bottom: win.isMaximized ? maxInsets?.bottom : undefined,
        width: win.isMaximized ? undefined : win.w,
        height: win.isMaximized ? undefined : win.h,
        zIndex: win.zIndex,
        backgroundColor:
          win.kind === 'widget'
            ? widgetTransparent
              ? 'transparent'
              : barColor || 'rgba(15, 23, 42, 0.85)'
            : win.isMaximized
              ? '#0f172a'
              : 'rgba(15, 23, 42, 0.85)'
      }}
      onPointerDown={() => onFocus(win.id)}
    >
      <div
        className="h-9 bg-white/10 flex items-center justify-between px-3 select-none cursor-default"
        onPointerDown={handlePointerDown}
        onDoubleClick={() => onMaximize(win.id)}
      >
        <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(win.id);
            }}
            className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 border border-white/30 shadow flex items-center justify-center"
            aria-label="Fermer"
          >
            <X size={10} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(win.id);
            }}
            className="w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-600 border border-white/30 shadow flex items-center justify-center"
            aria-label="Reduire"
          >
            <Minus size={10} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(win.id);
            }}
            className="w-4 h-4 rounded-full bg-green-500 hover:bg-green-600 border border-white/30 shadow flex items-center justify-center"
            aria-label="Agrandir"
          >
            <Square size={9} className="text-white" />
          </button>
        </div>
        <div className="text-xs font-bold text-white/80 truncate">{win.title}</div>
        <div className="w-10" />
      </div>

      <div
        className={`flex-1 relative ${win.kind === 'widget' ? '' : 'bg-white text-slate-900'}`}
        style={
          win.kind === 'widget'
            ? {
                backgroundColor: widgetTransparent ? 'transparent' : barColor || 'rgba(15, 23, 42, 0.85)',
                color: '#fff'
              }
            : undefined
        }
      >
        {children}
        {(isDragging || isResizing) && <div className="absolute inset-0 z-50 bg-transparent" />}
      </div>

      {!win.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
            setResizeStart({ x: e.clientX, y: e.clientY, w: win.w, h: win.h });
          }}
        />
      )}
    </div>
  );
};

