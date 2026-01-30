import React, { useEffect, useRef } from 'react';

interface WidgetRunnerProps {
  id: string;
  html?: string;
  css?: string;
  js?: string;
  isEditing: boolean;
}

export const WidgetRunner: React.FC<WidgetRunnerProps> = ({ id, html, css, js, isEditing }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const lastInitRef = useRef<{ id: string; html?: string; css?: string; js?: string } | null>(null);

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
      const scopedCss = css.replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, `.${scopeId} $1$2`);
      style.innerHTML = scopedCss;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    if (js) {
      try {
        new Function('container', js)(container);
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

