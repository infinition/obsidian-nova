import type { WebOSWidgetItem } from '../../../types';

export const widgetMiniMD: WebOSWidgetItem = {
  id: 'mini-md',
  pageIndex: 0,
  type: 'widget',
  title: 'Mini MD',
  widgetId: 'mini-md',
  cols: 12,
  rows: 14,
  bgColor: '#1e293b',
  html: `<div class="md-root" tabindex="0">
    <div class="md-header">
        <div class="md-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            MINI MD
        </div>
        <div class="md-controls">
            <div id="file-group" class="md-file-group hidden">
                <div class="md-input-wrap">
                    <input type="text" id="file-input" placeholder="Search file..." class="md-input" autocomplete="off">
                    <div id="file-dropdown" class="md-dropdown hidden"></div>
                </div>
                <button id="btn-fetch" class="md-icon-btn" title="Reload from disk">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                </button>
            </div>
            <button id="btn-mode" class="md-badge">LOCAL</button>
            <div class="md-sep"></div>
            <button id="btn-theme" class="md-icon-btn" title="Toggle Theme">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <button id="btn-focus" class="md-icon-btn" title="Focus Mode (F11)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
            <button id="btn-toc" class="md-icon-btn" title="Table of Contents">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button id="btn-view" class="md-icon-btn" title="Change View (Ctrl+P)">
                <svg id="icon-eye" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg id="icon-pen" class="hidden" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
        </div>
    </div>

    <div id="toolbar" class="md-toolbar">
        <button class="md-tool-btn bold" data-i="**" data-s="**" title="Bold (Ctrl+B)">B</button>
        <button class="md-tool-btn italic" data-i="*" data-s="*" title="Italic (Ctrl+I)">I</button>
        <button class="md-tool-btn strike" data-i="~~" data-s="~~">S</button>
        <div class="md-sep"></div>
        <button class="md-tool-btn" data-i="# " title="Heading 1">H1</button>
        <button class="md-tool-btn" data-i="## " title="Heading 2">H2</button>
        <button class="md-tool-btn" data-i="### " title="Heading 3">H3</button>
        <div class="md-sep"></div>
        <button class="md-tool-btn" data-i="- " title="List">List</button>
        <button class="md-tool-btn" data-i="- [ ] " title="Task List">Task</button>
        <div class="md-sep"></div>
        <button class="md-tool-btn" data-i="[" data-s="](url)" title="Link (Ctrl+K)">Link</button>
        <button class="md-tool-btn" data-i="\`\`\`\n" data-s="\n\`\`\`" title="Code Block">Code</button>
        
        <div class="emoji-container" style="position: relative;">
            <button class="md-tool-btn" id="btn-emoji" title="Insert Emoji">😀</button>
            <div id="emoji-popover" class="md-popover hidden">
                <input type="text" id="emoji-search" placeholder="Search..." class="md-popover-search">
                <div id="emoji-grid" class="md-popover-grid"></div>
            </div>
        </div>

        <div class="md-sep"></div>
        <button class="md-tool-btn" id="btn-search" title="Search (Ctrl+F)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <button class="md-tool-btn" id="btn-template" title="Templates">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </button>
        <button class="md-tool-btn" id="btn-export" title="Export">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <div class="md-sep"></div>
        <button class="md-tool-btn" id="btn-undo" title="Undo (Ctrl+Z)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a5 5 0 0 1 5 5v2"/><path d="M3 10l4-4"/><path d="M7 6V2"/></svg></button>
        <button class="md-tool-btn" id="btn-redo" title="Redo (Ctrl+Y)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H11a5 5 0 0 0-5 5v2"/><path d="M21 10l-4-4"/><path d="M17 6V2"/></svg></button>
    </div>

    <!-- Search Bar -->
    <div id="search-bar" class="md-search-bar hidden">
        <input type="text" id="search-input" placeholder="Search..." class="md-search-input">
        <input type="text" id="replace-input" placeholder="Replace..." class="md-search-input">
        <button id="btn-find-prev" class="md-search-btn" title="Previous (Shift+Enter)">↑</button>
        <button id="btn-find-next" class="md-search-btn" title="Next (Enter)">↓</button>
        <button id="btn-replace" class="md-search-btn" title="Replace">Replace</button>
        <button id="btn-replace-all" class="md-search-btn" title="Replace All">All</button>
        <span id="search-count" class="md-search-count"></span>
        <button id="btn-close-search" class="md-search-close">✕</button>
    </div>

    <div class="md-main">
        <textarea id="editor" class="md-editor" placeholder="Start typing..." spellcheck="false"></textarea>
        <div id="preview" class="md-preview hidden markdown-body"></div>
        
        <!-- TOC Sidebar -->
        <div id="toc-sidebar" class="md-toc-sidebar hidden">
            <div class="md-toc-header">
                <span>Table of Contents</span>
                <button id="btn-close-toc" class="md-toc-close">✕</button>
            </div>
            <div id="toc-content" class="md-toc-content"></div>
        </div>
    </div>

    <div class="md-footer">
        <span id="file-path" class="md-file-path" title="Current file path"></span>
        <div class="md-footer-right">
            <label class="md-toggle-label" title="Bidirectional scroll sync">
                <input type="checkbox" id="toggle-bidir-sync">
                <span>↕ Sync</span>
            </label>
            <span class="md-sep"></span>
            <span id="status">Ready</span>
            <span class="md-sep"></span>
            <span id="stats">0 words · 0 chars · 0min</span>
            <span class="md-sep"></span>
            <span id="save-indicator" class="save-dot save-saved" title="Auto-saved">●</span>
        </div>
    </div>

    <!-- Export Modal -->
    <div id="export-modal" class="md-modal hidden">
        <div class="md-modal-content">
            <div class="md-modal-header">
                <h3>Export Document</h3>
                <button id="btn-close-export" class="md-modal-close">✕</button>
            </div>
            <div class="md-modal-body">
                <button class="md-export-btn" data-format="html">HTML</button>
                <button class="md-export-btn" data-format="md">Markdown</button>
                <button class="md-export-btn" data-format="pdf">PDF</button>
                <button class="md-export-btn" data-format="txt">Plain Text</button>
            </div>
        </div>
    </div>

    <!-- Template Modal -->
    <div id="template-modal" class="md-modal hidden">
        <div class="md-modal-content">
            <div class="md-modal-header">
                <h3>Insert Template</h3>
                <button id="btn-close-template" class="md-modal-close">✕</button>
            </div>
            <div class="md-modal-body">
                <button class="md-template-btn" data-template="meeting">Meeting Notes</button>
                <button class="md-template-btn" data-template="journal">Daily Journal</button>
                <button class="md-template-btn" data-template="todo">Todo List</button>
                <button class="md-template-btn" data-template="blog">Blog Post</button>
                <button class="md-template-btn" data-template="readme">README</button>
            </div>
        </div>
    </div>

    <!-- Toast Notifications -->
    <div id="toast-container" class="md-toast-container"></div>
</div>`,
  
  css: `
.md-root { display: flex; flex-direction: column; width: 100%; height: 100%; background-color: #0f172a; color: #cbd5e1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden !important; outline: none; box-sizing: border-box; contain: strict; min-width: 0 !important; min-height: 0 !important; position: relative; transition: background-color 0.3s, color 0.3s; }
.md-root.theme-light { background-color: #f8fafc; color: #1e293b; }
.md-root.focus-mode .md-header,
.md-root.focus-mode .md-toolbar,
.md-root.focus-mode .md-footer { display: none; }
.md-root.focus-mode .md-main { height: 100%; }

.md-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background-color: #1e293b; border-bottom: 1px solid #334155; flex-shrink: 0; height: 40px; box-sizing: border-box; position: relative; z-index: 50; transition: background-color 0.3s; }
.theme-light .md-header { background-color: #e2e8f0; border-bottom-color: #cbd5e1; }
.md-title { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #60a5fa; }
.theme-light .md-title { color: #2563eb; }
.md-controls { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; min-width: 0; }
.md-file-group { display: flex; align-items: center; gap: 4px; background: #334155; padding: 2px 4px; border-radius: 4px; border: 1px solid #475569; flex: 1; max-width: 240px; transition: all 0.2s; min-width: 0; position: relative; }
.theme-light .md-file-group { background: #cbd5e1; border-color: #94a3b8; }
.md-file-group:focus-within { border-color: #60a5fa; }
.md-input-wrap { flex: 1; display: flex; min-width: 0; position: relative; }
.md-input { background: transparent; border: none; color: white; font-size: 11px; width: 100%; outline: none; }
.theme-light .md-input { color: #1e293b; }
.md-input::placeholder { color: #94a3b8; }
.theme-light .md-input::placeholder { color: #64748b; }
.md-dropdown { position: absolute; top: 28px; right: 0; width: 300px; max-height: 50vh; overflow-y: auto; background: #1e293b; border: 1px solid #475569; border-radius: 4px; z-index: 100; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
.theme-light .md-dropdown { background: #ffffff; border-color: #cbd5e1; box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
.md-dropdown::-webkit-scrollbar { width: 4px; }
.md-dropdown::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
.md-dropdown-item { display: flex; flex-direction: column; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
.theme-light .md-dropdown-item { border-bottom-color: rgba(0,0,0,0.05); }
.md-dropdown-item:hover { background: #334155; }
.theme-light .md-dropdown-item:hover { background: #f1f5f9; }
.md-file-name { font-size: 12px; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.theme-light .md-file-name { color: #1e293b; }
.md-file-path { font-size: 10px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: rtl; text-align: left; }
.md-badge { background-color: #334155; color: #94a3b8; border: 1px solid #475569; padding: 2px 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; border-radius: 4px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
.theme-light .md-badge { background-color: #cbd5e1; color: #475569; border-color: #94a3b8; }
.md-badge.vault { background-color: #2563eb; color: white; border-color: #3b82f6; }
.md-sep { width: 1px; height: 16px; background-color: #475569; margin: 0 4px; flex-shrink: 0; }
.theme-light .md-sep { background-color: #cbd5e1; }
.md-icon-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; flex-shrink: 0; transition: all 0.2s; }
.theme-light .md-icon-btn { color: #64748b; }
.md-icon-btn:hover { background-color: #334155; color: white; }
.theme-light .md-icon-btn:hover { background-color: #cbd5e1; color: #1e293b; }

.md-toolbar { display: flex; align-items: center; gap: 4px; padding: 6px 8px; background-color: rgba(30, 41, 59, 0.5); border-bottom: 1px solid #334155; overflow-x: auto; flex-shrink: 0; z-index: 40; transition: background-color 0.3s; }
.theme-light .md-toolbar { background-color: rgba(226, 232, 240, 0.5); border-bottom-color: #cbd5e1; }
.md-toolbar::-webkit-scrollbar { height: 0; }
.md-tool-btn { background: transparent; border: none; color: #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-family: monospace; cursor: pointer; min-width: 24px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.theme-light .md-tool-btn { color: #64748b; }
.md-tool-btn:hover { background-color: #334155; color: white; }
.theme-light .md-tool-btn:hover { background-color: #cbd5e1; color: #1e293b; }
.md-tool-btn.bold { font-weight: bold; }
.md-tool-btn.italic { font-style: italic; }
.md-tool-btn.strike { text-decoration: line-through; }

/* Search Bar */
.md-search-bar { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: #1e293b; border-bottom: 1px solid #334155; flex-shrink: 0; z-index: 45; }
.theme-light .md-search-bar { background: #e2e8f0; border-bottom-color: #cbd5e1; }
.md-search-input { background: #0f172a; border: 1px solid #475569; color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; outline: none; flex: 1; min-width: 120px; }
.theme-light .md-search-input { background: #ffffff; border-color: #cbd5e1; color: #1e293b; }
.md-search-input:focus { border-color: #60a5fa; }
.md-search-btn { background: #334155; border: none; color: #94a3b8; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.theme-light .md-search-btn { background: #cbd5e1; color: #475569; }
.md-search-btn:hover { background: #475569; color: white; }
.theme-light .md-search-btn:hover { background: #94a3b8; color: white; }
.md-search-count { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.md-search-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 0 4px; }
.md-search-close:hover { color: #f87171; }
.md-search-highlight { background-color: rgba(250, 204, 21, 0.3) !important; }
.md-search-highlight.active { background-color: rgba(34, 197, 94, 0.4) !important; }

.md-main { flex: 1; position: relative; display: flex; min-height: 0 !important; overflow: hidden; z-index: 10; contain: layout size; }
.md-editor { flex: 1; width: 50%; height: 100%; background-color: #0f172a; color: #e2e8f0; border: none; padding: 16px; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; resize: none; outline: none; box-sizing: border-box; min-height: 0 !important; white-space: pre-wrap; overflow-wrap: break-word; overflow-y: auto; tab-size: 2; transition: background-color 0.3s, color 0.3s; }
.theme-light .md-editor { background-color: #ffffff; color: #1e293b; }
.md-preview { flex: 1; width: 50%; height: 100%; background-color: #0f172a; color: #cbd5e1; padding: 16px; overflow-y: auto; box-sizing: border-box; scroll-behavior: smooth; min-height: 0 !important; word-break: break-word; overflow-wrap: anywhere; contain: content; font-size: 14px; line-height: 1.6; transition: background-color 0.3s, color 0.3s; }
.theme-light .md-preview { background-color: #f8fafc; color: #1e293b; }
.hidden { display: none !important; }
.mode-hybrid .md-editor { display: block; width: 50%; border-right: 1px solid #334155; }
.theme-light.mode-hybrid .md-editor { border-right-color: #cbd5e1; }
.mode-hybrid .md-preview { display: block; width: 50%; }

/* TOC Sidebar */
.md-toc-sidebar { position: absolute; right: 0; top: 0; width: 250px; height: 100%; background: #1e293b; border-left: 1px solid #334155; z-index: 20; display: flex; flex-direction: column; transition: transform 0.3s; }
.theme-light .md-toc-sidebar { background: #ffffff; border-left-color: #cbd5e1; }
.md-toc-header { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #334155; font-weight: 600; font-size: 13px; }
.theme-light .md-toc-header { border-bottom-color: #cbd5e1; }
.md-toc-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; padding: 0; }
.md-toc-close:hover { color: #f87171; }
.md-toc-content { flex: 1; overflow-y: auto; padding: 8px; }
.md-toc-item { padding: 6px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; margin-bottom: 2px; transition: all 0.2s; }
.md-toc-item:hover { background: #334155; }
.theme-light .md-toc-item:hover { background: #f1f5f9; }
.md-toc-item.level-1 { font-weight: 600; color: #60a5fa; }
.md-toc-item.level-2 { padding-left: 20px; color: #e2e8f0; }
.md-toc-item.level-3 { padding-left: 32px; color: #cbd5e1; font-size: 11px; }
.theme-light .md-toc-item.level-1 { color: #2563eb; }
.theme-light .md-toc-item.level-2 { color: #1e293b; }
.theme-light .md-toc-item.level-3 { color: #475569; }

.md-footer { padding: 4px 8px; background-color: #1e293b; border-top: 1px solid #334155; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; z-index: 40; transition: background-color 0.3s; }
.theme-light .md-footer { background-color: #e2e8f0; border-top-color: #cbd5e1; }
.md-footer-right { display: flex; align-items: center; gap: 8px; }
.md-file-path { font-size: 10px; color: #64748b; font-style: italic; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Toggle Switch */
.md-toggle-label { display: flex; align-items: center; gap: 4px; font-size: 10px; cursor: pointer; user-select: none; }
.md-toggle-label input[type="checkbox"] { width: 28px; height: 14px; appearance: none; background: #334155; border-radius: 7px; position: relative; cursor: pointer; outline: none; transition: background 0.3s; }
.theme-light .md-toggle-label input[type="checkbox"] { background: #cbd5e1; }
.md-toggle-label input[type="checkbox"]:checked { background: #60a5fa; }
.md-toggle-label input[type="checkbox"]::before { content: ''; position: absolute; width: 10px; height: 10px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: transform 0.3s; }
.md-toggle-label input[type="checkbox"]:checked::before { transform: translateX(14px); }

/* Save Indicator */
.save-dot { font-size: 16px; transition: color 0.3s; }
.save-saved { color: #34d399; }
.save-saving { color: #fbbf24; animation: pulse-save 1s infinite; }
.save-error { color: #f87171; }
@keyframes pulse-save { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Popover Styles */
.md-popover { position: absolute; top: 110%; left: 0; background: #1e293b; border: 1px solid #475569; border-radius: 6px; width: 220px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 100; display: flex; flex-direction: column; }
.theme-light .md-popover { background: #ffffff; border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.md-popover-search { width: 100%; background: #0f172a; border: none; border-bottom: 1px solid #334155; color: white; padding: 8px; font-size: 12px; outline: none; border-radius: 6px 6px 0 0; box-sizing: border-box; }
.theme-light .md-popover-search { background: #f8fafc; border-bottom-color: #cbd5e1; color: #1e293b; }
.md-popover-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; padding: 6px; max-height: 160px; overflow-y: auto; }
.md-popover-item { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 4px; cursor: pointer; font-size: 16px; transition: all 0.2s; }
.md-popover-item:hover { background: #334155; transform: scale(1.2); }
.theme-light .md-popover-item:hover { background: #f1f5f9; }

/* Modals */
.md-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.md-modal-content { background: #1e293b; border: 1px solid #475569; border-radius: 8px; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
.theme-light .md-modal-content { background: #ffffff; border-color: #cbd5e1; }
.md-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #334155; }
.theme-light .md-modal-header { border-bottom-color: #cbd5e1; }
.md-modal-header h3 { margin: 0; font-size: 16px; color: #e2e8f0; }
.theme-light .md-modal-header h3 { color: #1e293b; }
.md-modal-close { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 20px; padding: 0; }
.md-modal-close:hover { color: #f87171; }
.md-modal-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.md-export-btn, .md-template-btn { background: #334155; border: 1px solid #475569; color: #e2e8f0; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; text-align: left; }
.theme-light .md-export-btn, .theme-light .md-template-btn { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
.md-export-btn:hover, .md-template-btn:hover { background: #475569; border-color: #60a5fa; transform: translateX(4px); }
.theme-light .md-export-btn:hover, .theme-light .md-template-btn:hover { background: #e2e8f0; }

/* Toast Notifications */
.md-toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.md-toast { background: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 12px 16px; color: #e2e8f0; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); animation: slideIn 0.3s, slideOut 0.3s 2.7s; opacity: 0; animation-fill-mode: forwards; max-width: 300px; }
.theme-light .md-toast { background: #ffffff; border-color: #cbd5e1; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.md-toast.success { border-left: 4px solid #34d399; }
.md-toast.error { border-left: 4px solid #f87171; }
.md-toast.info { border-left: 4px solid #60a5fa; }
@keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100px); } }

/* Sync Highlight */
.sync-line-highlight { 
  border-left: 3px solid #60a5fa; 
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.1) 0%, transparent 100%); 
  transition: background 0.3s; 
}
tr.sync-line-highlight > td:first-child { box-shadow: inset 3px 0 0 0 #60a5fa; border-left: none; }
tr.sync-line-highlight { border-left: none; }

/* MARKDOWN STYLES */
.markdown-body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #cbd5e1; line-height: 1.6; }
.theme-light .markdown-body { color: #1e293b; }
.markdown-body h1 { color: #60a5fa; border-bottom: 1px solid #334155; font-size: 1.8em; margin: 0.5em 0 0.8em 0; padding-bottom: 0.3em; font-weight: 600; }
.theme-light .markdown-body h1 { color: #2563eb; border-bottom-color: #cbd5e1; }
.markdown-body h2 { color: #e2e8f0; font-size: 1.5em; margin: 0.8em 0 0.6em 0; border-bottom: 1px solid #334155; padding-bottom: 0.2em; font-weight: 600; }
.theme-light .markdown-body h2 { color: #1e293b; border-bottom-color: #cbd5e1; }
.markdown-body h3 { color: #cbd5e1; font-size: 1.25em; margin: 0.8em 0 0.5em 0; font-weight: 600; }
.theme-light .markdown-body h3 { color: #334155; }
.markdown-body h4 { color: #94a3b8; font-size: 1.1em; margin: 0.6em 0 0.4em 0; font-weight: 600; }
.markdown-body a { color: #60a5fa; text-decoration: none; border-bottom: 1px solid #3b82f6; }
.theme-light .markdown-body a { color: #2563eb; border-bottom-color: #60a5fa; }
.markdown-body code { background: #1e293b; color: #f472b6; padding: 2px 6px; border-radius: 4px; font-family: 'Menlo', monospace; font-size: 0.9em; border: 1px solid #334155; }
.theme-light .markdown-body code { background: #f1f5f9; color: #ec4899; border-color: #cbd5e1; }
.markdown-body pre { background: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 1em; border: 1px solid #334155; position: relative; }
.theme-light .markdown-body pre { background: #f8fafc; border-color: #cbd5e1; }
.markdown-body pre code { background: transparent; color: #e2e8f0; padding: 0; border: none; font-size: 0.85em; }
.theme-light .markdown-body pre code { color: #1e293b; }
.markdown-body blockquote { border-left: 4px solid #475569; padding-left: 1em; color: #94a3b8; font-style: italic; margin: 0 0 1em 0; background: rgba(30, 41, 59, 0.5); padding: 0.5em 1em; border-radius: 0 4px 4px 0; }
.theme-light .markdown-body blockquote { border-left-color: #cbd5e1; background: rgba(241, 245, 249, 0.5); }
.markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 1em; }
.markdown-body img { max-width: 100% !important; height: auto !important; border-radius: 6px; border: 1px solid #334155; }
.theme-light .markdown-body img { border-color: #cbd5e1; }
.markdown-body table { width: 100% !important; border-collapse: collapse; margin-bottom: 1em; border: 1px solid #334155; }
.theme-light .markdown-body table { border-color: #cbd5e1; }
.markdown-body th, .markdown-body td { border: 1px solid #334155; padding: 8px 12px; }
.theme-light .markdown-body th, .theme-light .markdown-body td { border-color: #cbd5e1; }
.markdown-body th { background: #1e293b; color: #60a5fa; }
.theme-light .markdown-body th { background: #f1f5f9; color: #2563eb; }
.markdown-body hr { border: none; border-top: 2px solid #334155; margin: 2em 0; }
.theme-light .markdown-body hr { border-top-color: #cbd5e1; }
.markdown-body input[type="checkbox"] { margin-right: 0.5em; accent-color: #60a5fa; }

@media (max-width: 600px) {
  .mode-hybrid { flex-direction: column; }
  .mode-hybrid .md-editor { width: 100%; height: 50%; border-right: none; border-bottom: 1px solid #334155; }
  .mode-hybrid .md-preview { width: 100%; height: 50%; }
  .md-toc-sidebar { width: 100%; }
}
`,
  
  js: `
var root = typeof container !== 'undefined' ? container : document;
var app = window.app; 

const qs = (sel) => root.querySelector(sel);
const qsa = (sel) => root.querySelectorAll(sel);

// --- VARIABLES ---
const editor = qs('#editor');
const preview = qs('#preview');
const statsEl = qs('#stats');
const btnView = qs('#btn-view');
const btnMode = qs('#btn-mode');
const btnTheme = qs('#btn-theme');
const btnFocus = qs('#btn-focus');
const btnToc = qs('#btn-toc');
const mainArea = qs('.md-main');
const toolbar = qs('#toolbar');
const fileGroup = qs('#file-group');
const fileInput = qs('#file-input');
const fileDropdown = qs('#file-dropdown');
const btnFetch = qs('#btn-fetch');
const btnExport = qs('#btn-export');
const btnTemplate = qs('#btn-template');
const btnUndo = qs('#btn-undo');
const btnRedo = qs('#btn-redo');
const btnEmoji = qs('#btn-emoji');
const btnSearch = qs('#btn-search');
const iconEye = qs('#icon-eye');
const iconPen = qs('#icon-pen');
const statusEl = qs('#status');
const filePathEl = qs('#file-path');
const saveIndicator = qs('#save-indicator');
const emojiPopover = qs('#emoji-popover');
const emojiSearch = qs('#emoji-search');
const emojiGrid = qs('#emoji-grid');
const searchBar = qs('#search-bar');
const searchInput = qs('#search-input');
const replaceInput = qs('#replace-input');
const searchCount = qs('#search-count');
const btnFindPrev = qs('#btn-find-prev');
const btnFindNext = qs('#btn-find-next');
const btnReplace = qs('#btn-replace');
const btnReplaceAll = qs('#btn-replace-all');
const btnCloseSearch = qs('#btn-close-search');
const tocSidebar = qs('#toc-sidebar');
const tocContent = qs('#toc-content');
const btnCloseToc = qs('#btn-close-toc');
const exportModal = qs('#export-modal');
const btnCloseExport = qs('#btn-close-export');
const templateModal = qs('#template-modal');
const btnCloseTemplate = qs('#btn-close-template');
const toastContainer = qs('#toast-container');
const toggleBidirSync = qs('#toggle-bidir-sync');
const mdRoot = qs('.md-root');

let viewMode = 'edit';
let theme = 'dark';
let focusMode = false;
let saveTimeout = null;
let fileWatchInterval = null;
let allFiles = []; 
let currentMatchIndex = -1;
let searchMatches = [];
let bidirScrollEnabled = false;
let isPreviewScrolling = false;
let isEditorScrolling = false;

const MAX_HISTORY = 50;
let history = [];
let historyIndex = -1;
let lastContent = '';

let state = {
    content: '',
    filePath: '',
    mode: 'scratch',
    theme: 'dark'
};

const EMOJIS = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😋','😛','😜','🤪','😎','🤓','🤩','🥳','😏','😒','😔','😕','🙁','☹️','😣','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💪','🦾','🦵','🦿','🦶','👣','👀','👁','👅','👄','💋','🩸','🔥','✨','🌟','💫','💥','💢','💦','💧','🌈','☀️','⛅','☁️','❄️','⚡','🌊','💤','🎵','🎶','🎸','🎹','🎺','🎻','🥁','💾','💿','📀','📷','📹','🎥','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','⏰','🕰','⏳','⌛','📡','🔋','🔌','💡','🔦','🕯','🗑','🛢','💸','💵','💴','💶','💷','💰','💳','💎','⚖️','🔧','🔨','⚒','🛠','⛏','🔩','⚙️','⛓','🔫','💣','🔪','🗡','⚔️','🛡','🚬','⚰️','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳','💊','💉','🩸','🩹','🩺','🌡','🧬','🦠','🧫','🧪','🧹','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪒','🧽','🧴','🛎','🔑','🗝','🚪','🪑','🛋','🛏','🛌','🧸','🖼','🛍','🛒','🎁','🎈','🎏','🎀','🎊','🎉','🎎','🏮','🎐','✉️','📩','📨','📧','💌','📮','📪','📫','📬','📭','📦','📯','📥','📤','📜','📃','📄','📑','📊','📈','📉','📄','📅','📆','🗓','📇','🗃','🗳','🗄','📋','🗒','📁','📂','🗂','🗞','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🔗','📎','🖇','📐','📏','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'];

const TEMPLATES = {
    meeting: \`# Meeting Notes
**Date:** \${new Date().toLocaleDateString()}
**Attendees:** 

## Agenda
1. 

## Discussion

## Action Items
- [ ] 

## Next Steps
\`,
    journal: \`# Daily Journal - \${new Date().toLocaleDateString()}

## Morning
What I'm grateful for:
- 

## Today's Goals
- [ ] 

## Evening Reflection
What went well:
- 

What to improve:
- 
\`,
    todo: \`# Todo List

## Today
- [ ] 

## This Week
- [ ] 

## Backlog
- [ ] 
\`,
    blog: \`# Blog Post Title

**Author:** Your Name
**Date:** \${new Date().toLocaleDateString()}

## Introduction

## Main Content

### Section 1

### Section 2

## Conclusion
\`,
    readme: \`# Project Name

## Description
A brief description of your project.

## Installation
\\\`\\\`\\\`bash
npm install
\\\`\\\`\\\`

## Usage
\\\`\\\`\\\`bash
npm start
\\\`\\\`\\\`

## Features
- Feature 1
- Feature 2

## Contributing
Pull requests are welcome!

## License
MIT
\`
};

// --- UTILITIES ---
const loadLib = (url) => new Promise((resolve) => {
    if(document.querySelector(\`script[src="\${url}"]\`)) return resolve();
    const s = document.createElement('script'); s.src = url; s.onload = resolve;
    document.head.appendChild(s);
});

const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = \`md-toast \${type}\`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const setStatus = (msg, type = 'info') => {
    if (!statusEl) return;
    statusEl.innerText = msg;
};

const setSaveIndicator = (state) => {
    if (!saveIndicator) return;
    saveIndicator.className = 'save-dot save-' + state;
    saveIndicator.title = state === 'saved' ? 'Auto-saved' : state === 'saving' ? 'Saving...' : 'Error saving';
};

function updateStats() {
    if (!editor || !statsEl) return;
    const text = editor.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\\s+/).filter(w => w.length > 0).length : 0;
    const readTime = Math.ceil(words / 200);
    statsEl.innerText = \`\${words} words · \${chars} chars · \${readTime}min\`;
}

function updateFilePath() {
    if (!filePathEl) return;
    if (state.mode === 'file' && state.filePath) {
        filePathEl.textContent = state.filePath;
        filePathEl.title = state.filePath;
    } else {
        filePathEl.textContent = 'Unsaved Document';
        filePathEl.title = '';
    }
}

// --- HISTORY ---
function pushHistory() {
    const current = editor.value;
    if (current === lastContent) return;
    if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
    history.push(current);
    if (history.length > MAX_HISTORY) history.shift(); else historyIndex++;
    lastContent = current;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        editor.value = history[historyIndex];
        lastContent = editor.value;
        editor.dispatchEvent(new Event('input'));
        showToast('Undo', 'info');
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        editor.value = history[historyIndex];
        lastContent = editor.value;
        editor.dispatchEvent(new Event('input'));
        showToast('Redo', 'info');
    }
}

// --- SYNC PREVIEW ---
function norm(s) {
    return (s || '').replace(/[|#*_\`~\\[\\]]/g, '').trim().replace(/\\s+/g, ' ');
}

function syncPreviewToLine() {
    if (viewMode !== 'hybrid' || !preview || !editor) return;
    
    const cursorPos = editor.selectionStart;
    const text = editor.value;
    const lines = text.substring(0, cursorPos).split('\\n');
    let currentLineIndex = Math.max(0, lines.length - 1);
    
    preview.querySelectorAll('.sync-line-highlight').forEach(el => el.classList.remove('sync-line-highlight'));

    const allElements = preview.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, tr');
    let targetElement = null;
    
    let searchLineIdx = currentLineIndex;
    while (searchLineIdx >= 0 && !norm(lines[searchLineIdx])) searchLineIdx--;
    
    if (searchLineIdx >= 0) {
        const lineContent = norm(lines[searchLineIdx]);
        if (lineContent.length > 1) { 
            for(let i=0; i<allElements.length; i++) {
                const elText = norm(allElements[i].textContent);
                if (elText.includes(lineContent) || lineContent.includes(elText)) {
                    targetElement = allElements[i];
                    break;
                }
            }
        }
    }

    if (!targetElement) {
        const totalLines = text.split('\\n').length;
        const ratio = currentLineIndex / Math.max(1, totalLines);
        const elIdx = Math.floor(ratio * allElements.length);
        if (allElements[elIdx]) targetElement = allElements[elIdx];
    }

    if (targetElement) {
        targetElement.classList.add('sync-line-highlight');
        if (!isPreviewScrolling) {
            isEditorScrolling = true;
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => isEditorScrolling = false, 300);
        }
    }
}

function syncEditorToPreview() {
    if (!bidirScrollEnabled || viewMode !== 'hybrid' || !preview || !editor || isEditorScrolling) return;
    
    isPreviewScrolling = true;
    const previewScrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const editorScrollPos = previewScrollRatio * (editor.scrollHeight - editor.clientHeight);
    editor.scrollTop = editorScrollPos;
    
    setTimeout(() => isPreviewScrolling = false, 300);
}

// --- TABLE OF CONTENTS ---
function generateTOC() {
    if (!preview || !tocContent) return;
    
    const headings = preview.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) {
        tocContent.innerHTML = '<div style="padding: 12px; color: #64748b; font-size: 11px;">No headings found</div>';
        return;
    }
    
    tocContent.innerHTML = '';
    headings.forEach((h, idx) => {
        const level = parseInt(h.tagName[1]);
        const item = document.createElement('div');
        item.className = \`md-toc-item level-\${level}\`;
        item.textContent = h.textContent;
        item.onclick = () => {
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        tocContent.appendChild(item);
    });
}

// --- SEARCH & REPLACE ---
function performSearch() {
    const query = searchInput.value;
    if (!query) {
        clearSearchHighlights();
        return;
    }
    
    clearSearchHighlights();
    searchMatches = [];
    
    const text = editor.value;
    const specialRe = new RegExp('[' + '.*+?^$' + '{}()|' + '[\\\\]\\\\\\\\' + ']', 'g');
    const escapeRe = (s) => s.replace(specialRe, '\\\\$&');
    const regex = new RegExp(escapeRe(query), 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        searchMatches.push({ start: match.index, end: match.index + match[0].length });
    }
    
    searchCount.textContent = searchMatches.length > 0 ? \`\${searchMatches.length} matches\` : 'No matches';
    
    if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        highlightCurrentMatch();
    }
}

function clearSearchHighlights() {
    searchMatches = [];
    currentMatchIndex = -1;
    searchCount.textContent = '';
}

function highlightCurrentMatch() {
    if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length) return;
    
    const match = searchMatches[currentMatchIndex];
    editor.focus();
    editor.setSelectionRange(match.start, match.end);
    
    const lineHeight = 20;
    const lineIndex = editor.value.substring(0, match.start).split('\\n').length;
    editor.scrollTop = lineIndex * lineHeight - editor.clientHeight / 2;
    
    searchCount.textContent = \`\${currentMatchIndex + 1} of \${searchMatches.length}\`;
}

function findNext() {
    if (searchMatches.length === 0) return;
    currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
    highlightCurrentMatch();
}

function findPrev() {
    if (searchMatches.length === 0) return;
    currentMatchIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    highlightCurrentMatch();
}

function replaceOne() {
    if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length) return;
    
    const match = searchMatches[currentMatchIndex];
    const before = editor.value.substring(0, match.start);
    const after = editor.value.substring(match.end);
    editor.value = before + replaceInput.value + after;
    
    editor.dispatchEvent(new Event('input'));
    performSearch();
    showToast('Replaced 1 occurrence', 'success');
}

function replaceAll() {
    const query = searchInput.value;
    const replacement = replaceInput.value;
    if (!query || searchMatches.length === 0) return;
    
    const count = searchMatches.length;
    const specialRe2 = new RegExp('[' + '.*+?^$' + '{}()|' + '[\\\\]\\\\\\\\' + ']', 'g');
    const regex = new RegExp(query.replace(specialRe2, '\\\\$&'), 'gi');
    editor.value = editor.value.replace(regex, replacement);
    
    editor.dispatchEvent(new Event('input'));
    clearSearchHighlights();
    showToast(\`Replaced \${count} occurrences\`, 'success');
}

// --- OBSIDIAN ---
function getFile(path) { return (app && app.vault) ? app.vault.getAbstractFileByPath(path) : null; }
function cacheFiles() { if (app && app.vault) allFiles = app.vault.getMarkdownFiles().map(f => f.path); }

function renderDropdown(filter = "") {
    if (!fileDropdown) return;
    const matches = allFiles.filter(path => path.toLowerCase().includes(filter.toLowerCase()));
    if (matches.length === 0) {
        fileDropdown.innerHTML = '<div class="md-dropdown-item" style="cursor:default; color:#64748b">No matches</div>';
        fileDropdown.classList.remove('hidden');
        return;
    }
    const display = matches.slice(0, 50); 
    fileDropdown.innerHTML = display.map(path => {
        const name = path.split('/').pop();
        const folder = path.substring(0, path.lastIndexOf('/'));
        return \`<div class="md-dropdown-item" data-path="\${path}"><span class="md-file-name">\${name}</span>\${folder ? \`<span class="md-file-path">\${folder}</span>\` : ''}</div>\`;
    }).join('');
    fileDropdown.classList.remove('hidden');
    fileDropdown.querySelectorAll('.md-dropdown-item').forEach(el => {
        el.onclick = (e) => {
            e.stopPropagation();
            loadFile(el.dataset.path);
            fileInput.value = el.dataset.path.split('/').pop();
            fileDropdown.classList.add('hidden');
        };
    });
}

async function loadFile(path) {
    if (!app) return;
    const file = getFile(path);
    if (!file) {
        showToast('File not found', 'error');
        return;
    }
    setSaveIndicator('saving');
    try {
        const content = await app.vault.read(file);
        editor.value = content;
        state.filePath = path;
        state.content = content;
        history = [content];
        historyIndex = 0;
        lastContent = content;
        setSaveIndicator('saved');
        showToast('Loaded: ' + file.name, 'success');
        saveState(state);
        startFileWatch();
        updateStats();
        updateFilePath();
        if(viewMode !== 'edit') render();
    } catch(e) {
        setSaveIndicator('error');
        showToast('Error loading file', 'error');
    }
}

async function persistContent() {
    setSaveIndicator('saving');
    state.content = editor.value;
    try {
        if (state.mode === 'scratch') {
            saveState(state);
            setSaveIndicator('saved');
        } else if (state.mode === 'file' && state.filePath && app) {
            const file = getFile(state.filePath);
            if(file) {
                await app.vault.modify(file, state.content);
                setSaveIndicator('saved');
            }
        }
    } catch(e) {
        setSaveIndicator('error');
        showToast('Save failed', 'error');
    }
}

function startFileWatch() {
    if (fileWatchInterval || state.mode !== 'file' || !state.filePath || !app) return;
    fileWatchInterval = setInterval(async () => {
        if (state.mode !== 'file' || !state.filePath) return;
        const file = getFile(state.filePath);
        if(file) {
            try {
                const content = await app.vault.read(file);
                if (content !== editor.value && document.activeElement !== editor) {
                    editor.value = content;
                    state.content = content;
                    showToast('Updated externally', 'info');
                    updateStats();
                    if(viewMode !== 'edit') render();
                }
            } catch(e) {}
        }
    }, 2000);
}

function stopFileWatch() {
    if (fileWatchInterval) {
        clearInterval(fileWatchInterval);
        fileWatchInterval = null;
    }
}

function saveState(s) {
    localStorage.setItem('mini-md-state', JSON.stringify(s || state));
}

// --- EMOJI ---
function initEmojiPicker() {
    const render = (filter = '') => {
        emojiGrid.innerHTML = EMOJIS.filter(e => e.includes(filter))
            .map(e => \`<div class="md-popover-item" data-e="\${e}">\${e}</div>\`).join('');
        qsa('.md-popover-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                insertAtCursor(item.dataset.e);
                emojiPopover.classList.add('hidden');
            };
        });
    };
    
    btnEmoji.onclick = (e) => {
        e.stopPropagation();
        const isHidden = emojiPopover.classList.contains('hidden');
        qsa('.md-popover').forEach(p => p.classList.add('hidden')); 
        if(isHidden) {
            emojiPopover.classList.remove('hidden');
            render();
            emojiSearch.value = '';
            emojiSearch.focus();
        }
    };
    
    emojiSearch.addEventListener('input', (e) => render(e.target.value));
    
    root.addEventListener('click', (e) => {
        if (!e.target.closest('.emoji-container')) emojiPopover.classList.add('hidden');
    });
}

function insertAtCursor(text) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    editor.value = value.substring(0, start) + text + value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus();
    editor.dispatchEvent(new Event('input'));
}

function insertAroundSelection(before, after = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    const selected = value.substring(start, end);
    const newText = before + selected + after;
    editor.value = value.substring(0, start) + newText + value.substring(end);
    editor.selectionStart = start + before.length;
    editor.selectionEnd = end + before.length;
    editor.focus();
    editor.dispatchEvent(new Event('input'));
}

// --- EXPORT ---
async function exportDocument(format) {
    const content = editor.value;
    const filename = state.filePath ? state.filePath.split('/').pop().replace('.md', '') : 'document';
    
    try {
        if (format === 'html') {
            if (!window.marked) return;
            const html = \`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>\${filename}</title>
    <style>
        body { max-width: 800px; margin: 40px auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; padding-left: 16px; color: #666; }
    </style>
</head>
<body>
\${window.marked.parse(content)}
</body>
</html>\`;
            downloadFile(html, filename + '.html', 'text/html');
        } else if (format === 'md') {
            downloadFile(content, filename + '.md', 'text/markdown');
        } else if (format === 'txt') {
            downloadFile(content, filename + '.txt', 'text/plain');
        } else if (format === 'pdf') {
            showToast('PDF export requires html2pdf.js library. Exporting as HTML instead.', 'info');
            exportDocument('html');
        }
        
        showToast(\`Exported as \${format.toUpperCase()}\`, 'success');
        exportModal.classList.add('hidden');
    } catch(e) {
        showToast('Export failed', 'error');
    }
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// --- RENDER ---
function render() {
    if(!window.marked || !preview) return;
    if (!window.marked.__configured) {
        window.marked.use({ breaks: true });
        window.marked.__configured = true;
    }
    preview.innerHTML = window.marked.parse(editor.value);
    
    if (tocSidebar && !tocSidebar.classList.contains('hidden')) {
        generateTOC();
    }
}

// --- UI UPDATE ---
function updateUI() {
    mainArea.classList.remove('mode-hybrid');
    editor.classList.remove('hidden');
    preview.classList.add('hidden');
    toolbar.classList.remove('hidden'); 
    
    if(iconEye) iconEye.classList.remove('hidden'); 
    if(iconPen) iconPen.classList.add('hidden');
    
    if (viewMode === 'hybrid') {
        mainArea.classList.add('mode-hybrid');
        preview.classList.remove('hidden');
        if(iconEye) iconEye.classList.add('hidden'); 
        if(iconPen) iconPen.classList.remove('hidden');
    } else if (viewMode === 'preview') {
        editor.classList.add('hidden');
        preview.classList.remove('hidden');
        toolbar.classList.add('hidden');
    }

    if (state.mode === 'scratch') {
        stopFileWatch();
        btnMode.innerText = 'LOCAL';
        btnMode.classList.remove('vault');
        fileGroup.classList.add('hidden');
    } else {
        btnMode.innerText = 'VAULT';
        btnMode.classList.add('vault');
        fileGroup.classList.remove('hidden');
        cacheFiles(); 
        if(fileInput) fileInput.value = state.filePath ? state.filePath.split('/').pop() : '';
    }
    
    if (focusMode) {
        mdRoot.classList.add('focus-mode');
    } else {
        mdRoot.classList.remove('focus-mode');
    }
    
    updateFilePath();
}

function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    state.theme = theme;
    
    if (theme === 'light') {
        mdRoot.classList.add('theme-light');
    } else {
        mdRoot.classList.remove('theme-light');
    }
    
    saveState(state);
    showToast(\`Theme: \${theme}\`, 'info');
}

// --- KEYBOARD SHORTCUTS ---
function handleKeyboard(e) {
    // Ctrl/Cmd + B (Bold)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertAroundSelection('**', '**');
    }
    // Ctrl/Cmd + I (Italic)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertAroundSelection('*', '*');
    }
    // Ctrl/Cmd + K (Link)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        insertAroundSelection('[', '](url)');
    }
    // Ctrl/Cmd + S (Save)
    else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        persistContent();
        showToast('Saved', 'success');
    }
    // Ctrl/Cmd + F (Search)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            searchInput.focus();
        }
    }
    // Ctrl/Cmd + P (View toggle)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        btnView.click();
    }
    // Ctrl/Cmd + Z (Undo)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }
    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z (Redo)
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
    }
    // F11 (Focus mode)
    else if (e.key === 'F11') {
        e.preventDefault();
        btnFocus.click();
    }
    // Escape (Close modals/popovers)
    else if (e.key === 'Escape') {
        exportModal.classList.add('hidden');
        templateModal.classList.add('hidden');
        searchBar.classList.add('hidden');
        emojiPopover.classList.add('hidden');
        tocSidebar.classList.add('hidden');
    }
}

// --- INIT ---
async function init() {
    await loadLib('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    
    try {
        const s = JSON.parse(localStorage.getItem('mini-md-state'));
        if (s) {
            state = { ...state, ...s };
            theme = state.theme || 'dark';
            if (theme === 'light') mdRoot.classList.add('theme-light');
        }
    } catch(e) {}
    
    editor.value = state.content || '';
    history = [editor.value];
    historyIndex = 0;
    lastContent = editor.value;
    
    updateUI();
    updateStats();
    updateFilePath();
    
    if(state.mode === 'file' && state.filePath) loadFile(state.filePath);

    // Editor events
    editor.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            persistContent();
            pushHistory();
        }, 800);
        updateStats();
        if(viewMode === 'hybrid') {
            render();
            syncPreviewToLine();
        }
    });
    
    editor.addEventListener('click', () => {
        if(viewMode === 'hybrid') syncPreviewToLine();
    });
    
    editor.addEventListener('keyup', (e) => {
        if(viewMode === 'hybrid' && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
            syncPreviewToLine();
        }
    });
    
    // Bidirectional scroll sync
    preview.addEventListener('scroll', syncEditorToPreview);
    toggleBidirSync.addEventListener('change', (e) => {
        bidirScrollEnabled = e.target.checked;
        showToast(\`Bidirectional sync: \${bidirScrollEnabled ? 'ON' : 'OFF'}\`, 'info');
    });

    // View mode
    btnView.onclick = () => {
        if (viewMode === 'edit') viewMode = 'hybrid';
        else if (viewMode === 'hybrid') viewMode = 'preview';
        else viewMode = 'edit';
        updateUI();
        if(viewMode !== 'edit') render();
        if(viewMode === 'hybrid') setTimeout(syncPreviewToLine, 50);
    };
    
    // Mode toggle
    btnMode.onclick = () => {
        state.mode = state.mode === 'scratch' ? 'file' : 'scratch';
        if(state.mode === 'scratch') {
            editor.value = state.content;
        } else if(state.filePath) {
            loadFile(state.filePath);
        } else {
            editor.value = '';
        }
        updateUI();
        saveState(state);
    };
    
    // Theme toggle
    btnTheme.onclick = toggleTheme;
    
    // Focus mode
    btnFocus.onclick = () => {
        focusMode = !focusMode;
        updateUI();
        showToast(\`Focus mode: \${focusMode ? 'ON' : 'OFF'}\`, 'info');
    };
    
    // TOC
    btnToc.onclick = () => {
        if (viewMode === 'edit') {
            showToast('Switch to preview or hybrid mode to see TOC', 'info');
            return;
        }
        tocSidebar.classList.toggle('hidden');
        if (!tocSidebar.classList.contains('hidden')) {
            generateTOC();
        }
    };
    
    btnCloseToc.onclick = () => tocSidebar.classList.add('hidden');

    // Toolbar buttons
    qsa('.md-tool-btn[data-i]').forEach(btn => {
        btn.onclick = () => {
            if (btn.dataset.s) {
                insertAroundSelection(btn.dataset.i, btn.dataset.s);
            } else {
                insertAtCursor(btn.dataset.i);
            }
        };
    });
    
    // Search
    btnSearch.onclick = () => {
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) {
            searchInput.focus();
        }
    };
    
    btnCloseSearch.onclick = () => {
        searchBar.classList.add('hidden');
        clearSearchHighlights();
    };
    
    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            findNext();
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            findPrev();
        }
    });
    
    btnFindNext.onclick = findNext;
    btnFindPrev.onclick = findPrev;
    btnReplace.onclick = replaceOne;
    btnReplaceAll.onclick = replaceAll;
    
    // Export
    btnExport.onclick = () => exportModal.classList.remove('hidden');
    btnCloseExport.onclick = () => exportModal.classList.add('hidden');
    
    qsa('.md-export-btn').forEach(btn => {
        btn.onclick = () => exportDocument(btn.dataset.format);
    });
    
    // Templates
    btnTemplate.onclick = () => templateModal.classList.remove('hidden');
    btnCloseTemplate.onclick = () => templateModal.classList.add('hidden');
    
    qsa('.md-template-btn').forEach(btn => {
        btn.onclick = () => {
            const template = TEMPLATES[btn.dataset.template];
            if (editor.value.trim()) {
                if (!confirm('This will replace current content. Continue?')) return;
            }
            editor.value = template;
            editor.dispatchEvent(new Event('input'));
            templateModal.classList.add('hidden');
            showToast('Template inserted', 'success');
        };
    });
    
    // Undo/Redo
    btnUndo.onclick = undo;
    btnRedo.onclick = redo;

    // Emoji
    initEmojiPicker();

    // File management
    if(fileInput) {
        fileInput.oninput = (e) => renderDropdown(e.target.value);
        fileInput.onfocus = () => {
            cacheFiles();
            renderDropdown('');
        };
        document.addEventListener('click', (e) => {
            if(!fileGroup.contains(e.target)) fileDropdown.classList.add('hidden');
        });
        if(btnFetch) btnFetch.onclick = () => {
            cacheFiles();
            renderDropdown('');
            showToast('Files refreshed', 'info');
        };
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Close modals on outside click
    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) exportModal.classList.add('hidden');
    });
    
    templateModal.addEventListener('click', (e) => {
        if (e.target === templateModal) templateModal.classList.add('hidden');
    });
    
    setStatus('Ready');
}

init();
`
};