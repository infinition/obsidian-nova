import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WebOSItem } from '../types';

interface DockProps {
  items: WebOSItem[];
  openItemIds: Set<string>;
  themeClass: string;
  onLaunch: (item: WebOSItem) => void;
  resolveIcon: (icon?: string) => string | undefined;
  /** En mode édition ou Alt : drag hors du dock pour retirer, clic pour renommer */
  isEditMode?: boolean;
  /** Appui long sur une icône (hors mode édition) → passer en mode édition */
  onEnterEditMode?: () => void;
  onRemoveFromDock?: (item: WebOSItem) => void;
  onRenameItem?: (item: WebOSItem, newTitle: string) => void;
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
  onRenameItem
}) => {
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dockDraggingId, setDockDraggingId] = useState<string | null>(null);
  const dockDragItemIdRef = useRef<string | null>(null);
  const dockPointerStart = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const didLongPressRef = useRef(false);
  const [editingLabelItemId, setEditingLabelItemId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [popoverAnchorRect, setPopoverAnchorRect] = useState<DOMRect | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, item: WebOSItem) => {
      e.stopPropagation();
      dockPointerStart.current = { x: e.clientX, y: e.clientY };
      didLongPressRef.current = false;
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
    (e: React.PointerEvent, item: WebOSItem) => {
      e.stopPropagation();
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (!isEditMode) return;
      if (!dockPointerStart.current || dockDragItemIdRef.current !== item.id) {
        dockDragItemIdRef.current = null;
        setDockDraggingId(null);
        dockPointerStart.current = null;
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
        setEditingLabelItemId(item.id);
        setRenameValue(item.title);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPopoverAnchorRect(rect);
      } else if (isOutsideDock && onRemoveFromDock) {
        onRemoveFromDock(item);
      }
      dockDragItemIdRef.current = null;
      setDockDraggingId(null);
      dockPointerStart.current = null;
    },
    [isEditMode, onRemoveFromDock]
  );

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

  return (
    <div ref={dockRef} className="webos-dock">
      <div
        className={`backdrop-blur-xl border border-white/20 px-4 py-3 rounded-3xl flex items-end gap-3 shadow-2xl overflow-x-auto no-scrollbar ${themeClass} ${isEditMode ? 'ring-2 ring-white/30' : ''}`}
        onPointerMove={handlePointerMove}
      >
        {items.map((item) => {
          const icon = resolveIcon(item.icon);
          const isDragging = dockDraggingId === item.id;
          return (
            <div
              key={item.id}
              className="relative group"
              onPointerDown={(e) => handlePointerDown(e, item)}
              onPointerUp={(e) => handlePointerUp(e, item)}
              onClick={(e) => {
                e.stopPropagation();
                if (didLongPressRef.current) return;
                if (isEditMode) return;
                onLaunch(item);
              }}
              style={isEditMode ? { cursor: 'grab' } : undefined}
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-lg flex items-center justify-center text-2xl transition hover:scale-110 active:scale-95 ${isEditMode ? 'cursor-grab' : 'cursor-pointer'} ${isDragging ? 'opacity-60 scale-95' : ''}`}
                style={{ backgroundColor: item.bgColor || '#334155' }}
              >
                {icon ? (
                  <img
                    src={icon}
                    alt={item.title}
                    className={item.fullSize ? 'w-full h-full object-cover' : 'w-2/3 h-2/3 object-contain'}
                  />
                ) : (
                  item.icon || 'APP'
                )}
              </div>
              {openItemIds.has(item.id) && !isEditMode && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />
              )}
            </div>
          );
        })}
      </div>
      {popoverEl && typeof document !== 'undefined' && createPortal(popoverEl, document.body)}
    </div>
  );
};
