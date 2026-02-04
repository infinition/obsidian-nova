import React, { useEffect, useRef } from 'react';
import type { WebOSAPI } from '../../types';

interface WidgetRunnerProps {
  id: string;
  html?: string;
  css?: string;
  js?: string;
  isEditing: boolean;
  api?: WebOSAPI;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, ms);
  }) as T;
}

export const WidgetRunner: React.FC<WidgetRunnerProps> = ({
  id,
  html,
  css,
  js,
  isEditing,
  api,
  onSizeChange
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const lastInitRef = useRef<{ id: string; html?: string; css?: string; js?: string } | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);
  const resizeRafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const last = lastInitRef.current;
    const isSame =
      last && last.id === id && last.html === html && last.css === css && last.js === js;
    if (isSame) return;

    lastInitRef.current = { id, html, css, js };

    if (styleRef.current) {
      styleRef.current.remove();
      styleRef.current = null;
    }

    const scopeId = `widget-${id}`;
    if (html !== undefined) {
      container.innerHTML = html || '';
    }
    container.classList.add(scopeId);

    if (css) {
      const style = document.createElement('style');
      const hostSelector = '.' + scopeId;
      const scopedCss = css
        .replace(/:host\b/g, '__HOST__')
        .replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (_: string, sel: string, rest: string) => {
          if (sel.includes('__HOST__')) return sel.replace(/__HOST__/g, hostSelector) + rest;
          return `.${scopeId} ${sel}${rest}`;
        });
      style.innerHTML = scopedCss;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    const rootProxy = {
      querySelector: (sel: string) => container.querySelector(sel),
      querySelectorAll: (sel: string) => container.querySelectorAll(sel),
      getElementById: (elId: string) => container.querySelector('#' + CSS.escape(elId))
    };

    const baseApi =
      api != null
        ? {
            getState: () => api.loadWidgetState(id),
            saveState: debounce((data: unknown) => api.saveWidgetState(id, data), 400)
          }
        : {
            getState: async (): Promise<null> => null,
            saveState: async (): Promise<void> => {}
          };

    const widgetApi = {
      ...baseApi,
      root: rootProxy,
      app: api?.getObsidianApp?.() ?? undefined
    };

    if (js) {
      try {
        (new Function('container', 'api', js) as (c: HTMLElement, a: typeof widgetApi) => void)(
          container,
          widgetApi
        );
      } catch {
        // Ignore widget runtime errors
      }
    }

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      const cleanup = (container as unknown as { _cleanup?: () => void })._cleanup;
      if (cleanup) cleanup();
    };
  }, [html, css, js, id]);

  // Même logique qu'ObsidgetWidgetRunner : si le contenu grandit/rétrécit, onSizeChange met à jour
  // cols/rows côté Desktop → la poignée s'adapte.
  useEffect(() => {
    if (!onSizeChange) return;
    const container = containerRef.current;
    if (!container) return;

    lastSizeRef.current = null;

    // Bounding box du contenu (container + descendants) pour que la cellule puisse
    // rétrécir quand le contenu rétrécit (ex. kanban en moins de colonnes).
    const getContentBounds = (): { width: number; height: number } => {
      const containerRect = container.getBoundingClientRect();
      let minLeft = containerRect.left;
      let minTop = containerRect.top;
      let maxRight = containerRect.right;
      let maxBottom = containerRect.bottom;
      const elements = container.querySelectorAll<HTMLElement>('*');
      elements.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          minLeft = Math.min(minLeft, r.left);
          minTop = Math.min(minTop, r.top);
          maxRight = Math.max(maxRight, r.right);
          maxBottom = Math.max(maxBottom, r.bottom);
        }
      });
      return {
        width: Math.max(1, maxRight - minLeft),
        height: Math.max(1, maxBottom - minTop)
      };
    };

    const emitSize = (rectOverride?: DOMRectReadOnly) => {
      const bounds = rectOverride
        ? { width: rectOverride.width, height: rectOverride.height }
        : getContentBounds();
      const width = bounds.width;
      const height = bounds.height;
      if (width <= 0 || height <= 0) return;
      const last = lastSizeRef.current;
      if (last && Math.abs(last.width - width) < 0.5 && Math.abs(last.height - height) < 0.5) return;
      lastSizeRef.current = { width, height };
      onSizeChange({ width, height });
    };

    const scheduleEmit = () => {
      if (resizeRafRef.current != null) {
        window.cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null;
        emitSize();
      });
    };

    scheduleEmit();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry?.contentRect) {
          emitSize(entry.contentRect);
          return;
        }
        scheduleEmit();
      });
      resizeObserver.observe(container);
      const firstChild = container.firstElementChild as HTMLElement | null;
      if (firstChild) {
        resizeObserver.observe(firstChild);
      }
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => scheduleEmit());
      mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
    }

    const pollId = window.setInterval(() => {
      emitSize();
    }, 500);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.clearInterval(pollId);
      if (resizeRafRef.current != null) {
        window.cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [html, css, id, js, onSizeChange]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        onPointerDown={(e) => !isEditing && !e.altKey && e.stopPropagation()}
        onTouchStart={(e) => !isEditing && !e.altKey && e.stopPropagation()}
      />
      {isEditing && <div className="absolute inset-0 z-10 bg-transparent cursor-move" />}
    </div>
  );
};

