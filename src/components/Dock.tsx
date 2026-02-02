import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import type { WebOSItem } from '../types';
import { renderLucideIcon } from './ItemEditModal';

interface DockProps {
  items: WebOSItem[];
  openItemIds: Set<string>;
  themeClass: string;
  onLaunch: (item: WebOSItem) => void;
  resolveIcon: (icon?: string) => string | undefined;
  isEditMode?: boolean;
  onEnterEditMode?: () => void;
  onRemoveFromDock?: (item: WebOSItem) => void;
  onRenameItem?: (item: WebOSItem, newTitle: string) => void;
  onReorderDock?: (items: WebOSItem[]) => void;
  onEditItem?: (item: WebOSItem) => void;
  widgetScale?: number;
}

const LONG_PRESS_MS = 700;

export const Dock: React.FC<DockProps> = ({
  items,
  openItemIds,
  themeClass,
  onLaunch,
  resolveIcon,
  isEditMode = false,
  onEnterEditMode,
  onRemoveFromDock,
  onRenameItem,
  onReorderDock,
  onEditItem,
  widgetScale = 1
}) => {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dockDraggingId, setDockDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dockDragItemIdRef = useRef<string | null>(null);
  const dockPointerStart = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);
  const [editingLabelItemId, setEditingLabelItemId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const dragStartIndex = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, item: WebOSItem, index: number) => {
      e.stopPropagation();
      dockPointerStart.current = { x: e.clientX, y: e.clientY };
      didLongPressRef.current = false;
      dragStartIndex.current = index;
      
      if (isEditMode) {
        dockDragItemIdRef.current = item.id;
        setDockDraggingId(item.id);
      } else {
        longPressTimerRef.current = window.setTimeout(() => {
          longPressTimerRef.current = null;
          didLongPressRef.current = true;
          onEnterEditMode?.();
        }, LONG_PRESS_MS);
      }
    },
    [isEditMode, onEnterEditMode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dockPointerStart.current) return;
      const dist = Math.hypot(e.clientX - dockPointerStart.current.x, e.clientY - dockPointerStart.current.y);
      if (dist > 12 && longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent, item: WebOSItem, targetIndex: number) => {
      e.stopPropagation();
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      if (!isEditMode) {
        dockDragItemIdRef.current = null;
        setDockDraggingId(null);
        dockPointerStart.current = null;
        setDragOverId(null);
        return;
      }
      
      if (!dockPointerStart.current || dockDragItemIdRef.current !== item.id) {
        dockDragItemIdRef.current = null;
        setDockDraggingId(null);
        dockPointerStart.current = null;
        setDragOverId(null);
        return;
      }
      
      const dx = e.clientX - dockPointerStart.current.x;
      const dy = e.clientY - dockPointerStart.current.y;
      const dist = Math.hypot(dx, dy);
      const rect = dockRef.current?.getBoundingClientRect();
      const isOutsideDock =
        !rect ||
        e.clientX < rect.left - 20 ||
        e.clientX > rect.right + 20 ||
        e.clientY < rect.top - 20 ||
        e.clientY > rect.bottom + 20;

      if (dist < 10) {
        // Click - open edit modal
        if (onEditItem) {
          onEditItem(item);
        } else {
          setEditingLabelItemId(item.id);
          setRenameValue(item.title);
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setPopoverAnchorRect(rect);
        }
      } else if (isOutsideDock && onRemoveFromDock) {
        onRemoveFromDock(item);
      }
      
      dockDragItemIdRef.current = null;
      setDockDraggingId(null);
      dockPointerStart.current = null;
      setDragOverId(null);
      dragStartIndex.current = null;
    },
    [isEditMode, onRemoveFromDock, onEditItem]
  );

  // Handle reordering via drag over
  const handleDragEnter = useCallback((targetId: string, targetIndex: number) => {
    if (!isEditMode || !dockDraggingId || dockDraggingId === targetId) return;
    setDragOverId(targetId);
    
    // Reorder items
    if (onReorderDock && dragStartIndex.current !== null) {
      const draggedItem = items.find(i => i.id === dockDraggingId);
      if (!draggedItem) return;
      
      const newItems = items.filter(i => i.id !== dockDraggingId);
      newItems.splice(targetIndex, 0, draggedItem);
      
      // Update dockOrder for all items
      const reordered = newItems.map((item, idx) => ({
        ...item,
        dockOrder: idx
      }));
      
      onReorderDock(reordered);
      dragStartIndex.current = targetIndex;
    }
  }, [isEditMode, dockDraggingId, items, onReorderDock]);

  useEffect(() => {
    if (!isEditMode || !dockDraggingId) return;
    const onUp = (e: PointerEvent) => {
      const rect = dockRef.current?.getBoundingClientRect();
      const isOutsideDock =
        !rect ||
        e.clientX < rect.left - 20 ||
        e.clientX > rect.right + 20 ||
        e.clientY < rect.top - 20 ||
        e.clientY > rect.bottom + 20;
      if (isOutsideDock && onRemoveFromDock) {
        const item = items.find((i) => i.id === dockDraggingId);
        if (item) onRemoveFromDock(item);
      }
      dockDragItemIdRef.current = null;
      setDockDraggingId(null);
      dockPointerStart.current = null;
      setDragOverId(null);
      dragStartIndex.current = null;
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, [isEditMode, dockDraggingId, items, onRemoveFromDock]);

  const submitRename = useCallback(
    (item: WebOSItem) => {
      const trimmed = renameValue.trim();
      if (trimmed && onRenameItem) onRenameItem(item, trimmed);
      setEditingLabelItemId(null);
      setPopoverAnchorRect(null);
    },
    [renameValue, onRenameItem]
  );

  useEffect(() => {
    if (!editingLabelItemId) return;
    const t = requestAnimationFrame(() => {
      renameInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [editingLabelItemId]);

  const editingItem = editingLabelItemId ? items.find((i) => i.id === editingLabelItemId) : null;

  const popoverEl =
    editingItem && popoverAnchorRect
      ? (() => {
          const popoverW = 140;
          const popoverH = 40;
          const left = popoverAnchorRect.left + popoverAnchorRect.width / 2 - popoverW / 2;
          const top = popoverAnchorRect.top - popoverH - 10;
          return (
            <div
              className="fixed z-[9999] px-2 py-1.5 rounded-lg bg-slate-800/95 border border-white/20 shadow-xl min-w-[120px]"
              style={{
                left: Math.max(8, Math.min(left, window.innerWidth - popoverW - 8)),
                top: Math.max(8, top)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={(el) => {
                  renameInputRef.current = el;
                }}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(editingItem);
                  if (e.key === 'Escape') {
                    setEditingLabelItemId(null);
                    setPopoverAnchorRect(null);
                  }
                }}
                onBlur={() => submitRename(editingItem)}
                className="w-full px-2 py-1 text-sm bg-slate-900 text-white rounded border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50"
                placeholder="Nom"
              />
            </div>
          );
        })()
      : null;

  const iconSize = Math.round(48 * widgetScale);
  const paddingX = Math.round(16 * widgetScale);
  const paddingY = Math.round(12 * widgetScale);
  const gap = Math.round(12 * widgetScale);
  const borderRadius = Math.round(24 * widgetScale);
  const iconBorderRadius = Math.round(16 * widgetScale);

  // Sort items by dockOrder
  const sortedItems = [...items].sort((a, b) => (a.dockOrder ?? 0) - (b.dockOrder ?? 0));

  return (
    <div ref={dockRef} className="webos-dock">
      <div
        className={`backdrop-blur-xl border border-white/20 flex items-end shadow-2xl overflow-x-auto no-scrollbar ${themeClass} ${isEditMode ? 'ring-2 ring-white/30' : ''}`}
        style={{ padding: `${paddingY}px ${paddingX}px`, gap: `${gap}px`, borderRadius: `${borderRadius}px` }}
        onPointerMove={handlePointerMove}
      >
        {sortedItems.map((item, index) => {
          const icon = resolveIcon(item.icon);
          const isDragging = dockDraggingId === item.id;
          const isDragOver = dragOverId === item.id && dockDraggingId !== item.id;
          
          return (
            <div
              key={item.id}
              className={`relative group transition-transform duration-150 ${isDragOver ? 'scale-90 opacity-60' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, item, index)}
              onPointerUp={(e) => handlePointerUp(e, item, index)}
              onPointerEnter={() => handleDragEnter(item.id, index)}
              onClick={(e) => {
                e.stopPropagation();
                if (didLongPressRef.current) return;
                if (isEditMode) return;
                onLaunch(item);
              }}
              style={isEditMode ? { cursor: 'grab' } : undefined}
            >
              {/* Delete button in edit mode */}
              {isEditMode && onRemoveFromDock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemoveFromDock(item);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className="absolute z-50 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                  style={{ 
                    top: -6 * widgetScale, 
                    left: -6 * widgetScale, 
                    width: Math.max(18, 18 * widgetScale), 
                    height: Math.max(18, 18 * widgetScale) 
                  }}
                  title="Supprimer du dock"
                >
                  <Trash2 size={Math.max(10, 10 * widgetScale)} />
                </button>
              )}
              
              <div
                className={`shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                  isEditMode ? 'cursor-grab animate-jiggle' : 'cursor-pointer'
                } ${isDragging ? 'opacity-40 scale-75' : ''}`}
                style={{ 
                  width: iconSize, 
                  height: iconSize, 
                  borderRadius: iconBorderRadius,
                  backgroundColor: item.bgColor || '#334155',
                  fontSize: `${widgetScale * 1.5}rem`
                }}
              >
                {icon ? (
                  <img
                    src={icon}
                    alt={item.title}
                    className={item.fullSize ? 'w-full h-full object-cover' : 'w-2/3 h-2/3 object-contain'}
                    style={{ borderRadius: iconBorderRadius }}
                    draggable={false}
                  />
                ) : item.icon?.startsWith('lucide:') ? (
                  renderLucideIcon(item.icon, Math.round(24 * widgetScale), 'text-white drop-shadow-md')
                ) : (
                  <span className="text-center leading-none">{item.icon || 'APP'}</span>
                )}
              </div>
              
              {/* Open indicator */}
              {openItemIds.has(item.id) && !isEditMode && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 bg-white rounded-full shadow-[0_0_5px_white]" 
                  style={{ bottom: -4 * widgetScale, width: 4 * widgetScale, height: 4 * widgetScale }}
                />
              )}
              
              {/* Title tooltip on hover */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {item.title}
              </div>
            </div>
          );
        })}
      </div>
      {popoverEl && typeof document !== 'undefined' && createPortal(popoverEl, document.body)}
    </div>
  );
};
