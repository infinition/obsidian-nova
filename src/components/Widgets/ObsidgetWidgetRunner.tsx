import React, { useEffect, useRef } from 'react';
import type { WebOSAPI } from '../../types';

interface ObsidgetWidgetRunnerProps {
  id: string;
  html?: string;
  css?: string;
  js?: string;
  isEditing: boolean;
  api: WebOSAPI;
  maxWidth?: { value: number; unit: 'percent' | 'pixel' };
}

const splitOnDelimiters = (content: string, maxSplits = 3) => {
  const lines = content.split('\n');
  const sections: string[] = [];
  let current: string[] = [];
  let splitCount = 0;
  for (const line of lines) {
    if (line.trim() === '---' && splitCount < maxSplits) {
      sections.push(current.join('\n'));
      current = [];
      splitCount += 1;
    } else {
      current.push(line);
    }
  }
  sections.push(current.join('\n'));
  return sections;
};

const parseCSV = (text: string, delimiter = ',') => {
  if (!text) return [];
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(delimiter).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim() ?? '';
    });
    return obj;
  });
};

const stringifyCSV = (data: Array<Record<string, string>>, delimiter = ',') => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(delimiter)];
  data.forEach((row) => {
    csvLines.push(headers.map((header) => row[header]).join(delimiter));
  });
  return csvLines.join('\n');
};

export const ObsidgetWidgetRunner: React.FC<ObsidgetWidgetRunnerProps> = ({
  id,
  html,
  css,
  js,
  isEditing,
  api,
  maxWidth
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastInitRef = useRef<{ id: string; html?: string; css?: string; js?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const last = lastInitRef.current;
    const isSame =
      last && last.id === id && last.html === html && last.css === css && last.js === js;

    const shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
    if (!isSame) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      shadow.innerHTML = '';
    }

    let rootElement = shadow.querySelector('[data-root="widget-root"]') as HTMLDivElement | null;
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.setAttribute('data-root', 'widget-root');
    }

    if (!isSame) {
      const styleEl = document.createElement('style');
      styleEl.textContent = `:host { display: block; position: relative; width: 100%; box-sizing: border-box; } ${css || ''}`;
      shadow.appendChild(styleEl);

      rootElement.innerHTML = (html || '') + '<slot></slot>';
      shadow.appendChild(rootElement);
      lastInitRef.current = { id, html, css, js };
    }

    const instanceId = id;

    if (maxWidth) {
      if (maxWidth.unit === 'percent' && maxWidth.value < 100) {
        container.style.maxWidth = `${maxWidth.value}%`;
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
      } else if (maxWidth.unit === 'pixel') {
        container.style.maxWidth = `${maxWidth.value}px`;
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
      } else {
        container.style.maxWidth = '';
        container.style.marginLeft = '';
        container.style.marginRight = '';
      }
    }

    const escapeSelector = (value: string) => {
      if (typeof (window as unknown as { CSS?: { escape?: (val: string) => string } }).CSS?.escape === 'function') {
        return (window as unknown as { CSS: { escape: (val: string) => string } }).CSS.escape(value);
      }
      return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    };

    const findById = (targetId: string) => {
      const selector = `#${escapeSelector(targetId)}`;
      return (
        (rootElement.querySelector(selector) as HTMLElement | null) ||
        (shadow.querySelector(selector) as HTMLElement | null) ||
        (document.getElementById(targetId) as HTMLElement | null)
      );
    };

    const rootProxy = new Proxy(shadow as unknown as Record<string, unknown>, {
      get(target, prop) {
        if (prop === 'getElementById') {
          return (id: string) => findById(id);
        }
        if (prop === 'querySelector') return rootElement.querySelector.bind(rootElement);
        if (prop === 'querySelectorAll') return rootElement.querySelectorAll.bind(rootElement);
        return target[prop as string];
      }
    });

    const documentProxy = {
      getElementById: (id: string) => findById(id),
      querySelector: (selector: string) =>
        rootElement.querySelector(selector) || shadow.querySelector(selector) || document.querySelector(selector),
      querySelectorAll: (selector: string) => rootElement.querySelectorAll(selector),
      addEventListener: document.addEventListener.bind(document),
      removeEventListener: document.removeEventListener.bind(document),
      createElement: document.createElement.bind(document),
      body: document.body,
      head: document.head,
      documentElement: document.documentElement
    };

    const widgetApi = {
      root: rootProxy,
      instanceId,
      app: api.getObsidianApp(),
      document: documentProxy,
      saveState: async (data: unknown) => {
        await api.saveWidgetState(instanceId, data);
      },
      getState: async () => api.loadWidgetState(instanceId),
      requestUrl: api.requestUrl,
      getFrontmatter: async (path?: string) => api.getFrontmatter(path),
      updateFrontmatter: async (data: Record<string, unknown>, path?: string) =>
        api.updateFrontmatter(data, path),
      getFiles: async (extension?: string) => api.getFiles(extension),
      readFile: async (path: string) => api.readFile(path),
      writeFile: async (path: string, contents: string) => api.writeFile(path, contents),
      parseCSV,
      stringifyCSV,
      getWidgetState: async (widgetId: string, path?: string) => {
        const targetPath = path;
        if (!targetPath) return null;
        const content = await api.readFile(targetPath);
        if (!content) return null;
        const regex = new RegExp('```widget\\s*\\nID:\\s*' + widgetId + '\\s*\\n([\\s\\S]*?)\\n```', 'i');
        const match = content.match(regex);
        if (!match) return null;
        const blockContent = match[1];
        const sections = splitOnDelimiters(blockContent, 3);
        if (sections.length < 4) return null;
        try {
          return JSON.parse(sections[3].trim());
        } catch {
          return null;
        }
      },
      updateWidgetState: async (widgetId: string, data: unknown, path?: string) => {
        const targetPath = path;
        if (!targetPath) return;
        const content = await api.readFile(targetPath);
        if (!content) return;
        const regex = new RegExp(`(` + '```widget\\s*\\nID:\\s*' + widgetId + '\\s*\\n)([\\s\\S]*?)(?=\\n```)', 'i');
        const match = content.match(regex);
        if (!match) return;
        const prefix = match[1];
        const blockContent = match[2];
        const sections = splitOnDelimiters(blockContent, 3);
        const isLinked =
          sections[0]?.includes('ID:') &&
          sections.length >= 2 &&
          !sections[1]?.trim() &&
          (sections.length < 3 || !sections[2]?.trim());
        const finalSections = ['', '', '', ''];
        if (isLinked) {
          finalSections[0] = sections[0];
          finalSections[3] = sections[sections.length - 1];
        } else if (sections.length === 4) {
          finalSections[0] = sections[0];
          finalSections[1] = sections[1];
          finalSections[2] = sections[2];
          finalSections[3] = sections[3];
        } else if (sections.length === 3) {
          finalSections[0] = sections[0];
          finalSections[1] = sections[1];
          finalSections[3] = sections[2];
        } else if (sections.length === 2) {
          finalSections[0] = sections[0];
          finalSections[3] = sections[1];
        } else {
          finalSections[0] = sections[0];
        }
        finalSections[3] = `\n${JSON.stringify(data, null, 2)}\n`;
        const newBlockContent = isLinked
          ? `${finalSections[0].trim()}\n---\n---\n---\n${finalSections[3].trim()}\n`
          : [
              finalSections[0].trim(),
              finalSections[1].trim(),
              finalSections[2].trim(),
              finalSections[3].trim()
            ].join('\n---\n') + '\n';
        const updated = content.replace(match[0], prefix + newBlockContent);
        await api.writeFile(targetPath, updated);
      }
    };

    try {
      const widgetContext: Record<string, unknown> = {};
      const apiProxy = new Proxy(widgetApi, {
        get(target, prop) {
          if (prop in widgetContext) return widgetContext[prop as string];
          if (prop in target) return (target as Record<string, unknown>)[prop as string];
          return (window as unknown as Record<string, unknown>)[prop as string];
        },
        set(target, prop, value) {
          widgetContext[prop as string] = value;
          (target as Record<string, unknown>)[prop as string] = value;
          return true;
        }
      });

      if (js && !isSame) {
        const functionNames: string[] = [];
        const functionRegex = /(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        while ((match = functionRegex.exec(js)) !== null) {
          if (match[1] !== 'init') functionNames.push(match[1]);
        }
        if (js.includes('function init')) functionNames.push('init');
        const functionExports = functionNames
          .map((name) => `if (typeof ${name} === 'function') api.${name} = ${name};`)
          .join('\n');
        const wrappedScript = `
          ${js}
          try { ${functionExports} } catch(e) {}
        `;
        const scriptFn = new Function('api', `with(api) { ${wrappedScript} }`);
        try {
          requestAnimationFrame(() => {
            if (cancelled) return;
            scriptFn(apiProxy);
          });
        } catch (err) {
          console.error(`Obsidget widget "${id}" script error:`, err);
        }
      }

      if (!isSame) {
        const elements = shadow.querySelectorAll('*');
        elements.forEach((el) => {
          const attrs = el.attributes;
          if (!attrs) return;
          for (let i = 0; i < attrs.length; i += 1) {
            const attr = attrs[i];
            if (attr.name.startsWith('on') && attr.name !== 'on') {
              const eventName = attr.name.substring(2);
              const code = attr.value;
              el.addEventListener(eventName, (event) => {
                try {
                  const eventFunc = new Function('api', 'event', `with(api) { ${code} }`);
                  eventFunc(apiProxy, event);
                } catch (err) {
                  console.error(`Obsidget widget "${id}" event error:`, err);
                }
              });
              el.removeAttribute(attr.name);
            }
          }
        });
      }
    } catch (err) {
      console.error(`Obsidget widget "${id}" runtime init failed:`, err);
    }

    if (!isSame) {
      cleanupRef.current = () => {
        shadow.innerHTML = '';
      };
    }

    return () => {
      cancelled = true;
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = null;
    };
  }, [api, css, html, id, js, maxWidth]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        onPointerDown={(event) => !isEditing && event.stopPropagation()}
        onTouchStart={(event) => !isEditing && event.stopPropagation()}
      />
      {isEditing && <div className="absolute inset-0 z-10 bg-transparent cursor-move" />}
    </div>
  );
};
