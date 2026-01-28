import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid, Maximize2, Minimize2, Plus, X } from 'lucide-react';
import type {
  WebOSAPI,
  WebOSConfig,
  WebOSItem,
  WebOSWidgetItem,
  WebOSWidgetTemplate,
  WebOSWindow
} from '../types';
// IMPORT DU NOUVEAU HOOK (assurez-vous du chemin relatif)
import { useResponsive } from '../hooks/useResponsive';
import { Dock } from './Dock';
import { FinderView } from './FinderView';
import { Taskbar } from './Taskbar';
import { WebViewWindow } from './WebViewWindow';
import { WindowFrame } from './WindowFrame';
import { ObsidgetWidgetRunner } from './Widgets/ObsidgetWidgetRunner';
import { QuickNoteWidget } from './Widgets/QuickNoteWidget';
import { TodoWidget } from './Widgets/TodoWidget';
import { WidgetRunner } from './Widgets/WidgetRunner';
import { WIDGET_TEMPLATES } from './Widgets/templates';

const WALLPAPERS = [
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1519681393798-38e43269d877?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2070&q=80'
];

const THEMES = {
  dark: {
    name: 'Dark',
    text: 'text-white',
    dock: 'bg-white/20',
    bar: 'bg-slate-900/80',
    barColor: 'rgba(15, 23, 42, 0.8)',
    folder: 'bg-slate-800/90'
  },
  light: {
    name: 'Light',
    text: 'text-slate-900',
    dock: 'bg-black/10',
    bar: 'bg-white/80',
    barColor: 'rgba(255, 255, 255, 0.8)',
    folder: 'bg-white/90'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    text: 'text-yellow-300',
    dock: 'bg-purple-900/50',
    bar: 'bg-black/80',
    barColor: 'rgba(0, 0, 0, 0.8)',
    folder: 'bg-slate-900/90'
  },
  forest: {
    name: 'Forest',
    text: 'text-green-100',
    dock: 'bg-black/20',
    bar: 'bg-green-900/80',
    barColor: 'rgba(20, 83, 45, 0.8)',
    folder: 'bg-green-800/90'
  }
} as const;

const DEFAULT_CONFIG: WebOSConfig = {
  barPosition: 'bottom',
  wallpaper: WALLPAPERS[1],
  viewMode: 'desktop',
  theme: 'dark',
  swipeThreshold: 30,
  lockVerticalSwipe: false,
  transparentObsidgetWidgets: true,
  fullscreenWidgetTransparent: false
};

const templateById = (id: string, templates: WebOSWidgetTemplate[]) =>
  templates.find((template) => template.id === id);

const buildWidgetItem = (
  templateId: string,
  overrides: Partial<WebOSWidgetItem>,
  templates: WebOSWidgetTemplate[]
): WebOSWidgetItem => {
  const template = templateById(templateId, templates);
  if (!template) {
    return {
      id: overrides.id || templateId,
      type: 'widget',
      title: overrides.title || 'Widget',
      widgetId: templateId,
      cols: overrides.cols || 1,
      rows: overrides.rows || 1,
      bgColor: overrides.bgColor || '#334155'
    };
  }

  const isObsidget = template.source === 'obsidget';
  return {
    id: overrides.id || templateId,
    type: 'widget',
    title: overrides.title || template.title,
    widgetId: template.id,
    cols: overrides.cols ?? template.cols,
    rows: overrides.rows ?? template.rows,
    bgColor: overrides.bgColor ?? template.bgColor,
    html: isObsidget ? undefined : template.html,
    css: isObsidget ? undefined : template.css,
    js: isObsidget ? undefined : template.js,
    ...overrides
  };
};

const DEFAULT_ITEMS: WebOSItem[] = [
  {
    id: 'finder',
    pageIndex: 0,
    type: 'app',
    title: 'Finder',
    icon: 'F',
    cols: 1,
    rows: 1,
    x: 1,
    y: 1,
    dockOrder: 0,
    bgColor: '#3b82f6',
    appId: 'finder'
  },
  {
    id: 'browser',
    pageIndex: 0,
    dockOrder: 1,
    type: 'app',
    title: 'Web',
    icon: 'W',
    cols: 1,
    rows: 1,
    x: 2,
    y: 1,
    bgColor: '#ffffff',
    url: 'https://obsidian.md'
  },
  {
    id: 'app-youtube',
    pageIndex: 0,
    dockOrder: 3,
    type: 'app',
    title: 'YouTube',
    url: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    icon: '▶️',
    cols: 1,
    rows: 1,
    x: 4,
    y: 1,
    bgColor: '#dc2626'
  },
  {
    id: 'widget-btc',
    pageIndex: 0,
    type: 'widget',
    title: 'Bitcoin Pro',
    widgetId: 'widget-btc',
    cols: 2,
    rows: 2,
    bgColor: '#111827',
    html: `<div class="flex flex-col justify-between h-full p-3 bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
    <div class="absolute top-0 right-0 p-2 opacity-10 text-6xl">₿</div>
    <div class="flex items-center justify-between z-10">
        <div class="flex items-center gap-2">
            <div class="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-lg shadow-yellow-500/50">₿</div>
            <div>
                <div class="text-xs text-gray-400 font-bold">BITCOIN</div>
                <div class="text-xs text-green-400 flex items-center">▲ 2.4%</div>
            </div>
        </div>
        <div class="text-2xl font-mono font-bold tracking-tighter" id="price">$96,432</div>
    </div>
    <div class="w-full h-8 flex items-end gap-1 mt-auto opacity-50">
        
        <div class="bg-green-500 w-1/6 h-2 rounded-t"></div>
        <div class="bg-green-500 w-1/6 h-4 rounded-t"></div>
        <div class="bg-green-500 w-1/6 h-3 rounded-t"></div>
        <div class="bg-green-500 w-1/6 h-6 rounded-t"></div>
        <div class="bg-green-500 w-1/6 h-5 rounded-t"></div>
        <div class="bg-green-500 w-1/6 h-8 rounded-t animate-pulse"></div>
    </div>
</div>`,
    css: '',
    js: `const p = container.querySelector('#price');
const tick = setInterval(() => {
    const base = 96000;
    const rand = Math.floor(Math.random() * 500);
    p.innerText = '$' + (base + rand).toLocaleString();
}, 3000);
container._cleanup = () => clearInterval(tick);`,
    x: 3,
    y: 9
  },
  {
    id: 'widget-calc',
    pageIndex: 0,
    type: 'widget',
    title: 'Calculatrice Glass',
    widgetId: 'widget-calc',
    cols: 2,
    rows: 3,
    bgColor: '#1f2937',
    html: `<div class="flex flex-col h-full p-2 bg-gray-800">
    <div id="disp" class="flex-1 bg-black/40 text-white flex items-center justify-end px-3 rounded mb-2 text-3xl font-light tracking-widest overflow-hidden">0</div>
    <div class="grid grid-cols-4 gap-2 h-4/5">
        <button class="btn bg-gray-600" onclick="clr()">C</button>
        <button class="btn bg-gray-600" onclick="app('/')">÷</button>
        <button class="btn bg-gray-600" onclick="app('*')">×</button>
        <button class="btn bg-orange-500" onclick="app('-')">-</button>
        <button class="btn bg-gray-700" onclick="app('7')">7</button>
        <button class="btn bg-gray-700" onclick="app('8')">8</button>
        <button class="btn bg-gray-700" onclick="app('9')">9</button>
        <button class="btn bg-orange-500" onclick="app('+')">+</button>
        <button class="btn bg-gray-700" onclick="app('4')">4</button>
        <button class="btn bg-gray-700" onclick="app('5')">5</button>
        <button class="btn bg-gray-700" onclick="app('6')">6</button>
        <button class="btn bg-blue-600 row-span-2" onclick="calc()">=</button>
        <button class="btn bg-gray-700" onclick="app('1')">1</button>
        <button class="btn bg-gray-700" onclick="app('2')">2</button>
        <button class="btn bg-gray-700" onclick="app('3')">3</button>
        <button class="btn bg-gray-700 col-span-2" onclick="app('0')">0</button>
        <button class="btn bg-gray-700" onclick="app('.')">.</button>
    </div>
</div>`,
    css: `.btn { border-radius: 8px; color: white; font-weight: bold; transition: all 0.1s; border: 1px solid rgba(255,255,255,0.05); } .btn:active { transform: scale(0.95); filter: brightness(1.2); }`,
    js: `const d = container.querySelector('#disp');
let c = '';
container.querySelectorAll('button').forEach(b => {
    const t = b.innerText;
    if(t === '=') b.onclick = () => { try { c = eval(c).toString(); d.innerText = c.substring(0,10); } catch { d.innerText = 'Err'; c=''; } };
    else if(t === 'C') b.onclick = () => { c = ''; d.innerText = '0'; };
    else b.onclick = () => { if(d.innerText==='0') c=''; c += (t==='×'?'*':t==='÷'?'/':t); d.innerText = c; };
});`,
    x: 9,
    y: 7
  },
  {
    id: 'widget-tictactoe',
    pageIndex: 0,
    type: 'widget',
    title: 'Morpion Neon',
    widgetId: 'widget-tictactoe',
    cols: 3,
    rows: 3,
    bgColor: '#475569',
    html: `<div class="relative flex flex-col h-full bg-slate-800 p-2">
    <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-400 uppercase tracking-widest">Morpion</span>
        <button id="reset" class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white hover:bg-white/20 uppercase tracking-widest">Recommencer</button>
    </div>
    <div id="status" class="text-[10px] text-slate-300 mb-1">X commence</div>
    <div class="grid grid-cols-3 gap-1 flex-1" id="grid"></div>
    <div id="overlay" class="absolute inset-0 hidden items-center justify-center bg-black/70 backdrop-blur-sm">
        <div class="bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-center shadow-xl">
            <div id="winner-text" class="text-lg font-bold text-white mb-2">X a gagne !</div>
            <button id="play-again" class="px-3 py-1 text-[10px] rounded-full bg-white/10 hover:bg-white/20 text-white uppercase tracking-widest">Recommencer</button>
        </div>
    </div>
</div>`,
    css: `#grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 6px; flex: 1 1 auto; min-height: 0; align-items: stretch; justify-items: stretch; }
.cell { background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; line-height: 1; color: white; cursor: pointer; border-radius: 6px; transition: background 0.2s, transform 0.1s; aspect-ratio: 1 / 1; width: 100%; height: 100%; padding: 0; min-width: 0; min-height: 0; overflow: hidden; }
.cell:hover { background: rgba(255,255,255,0.06); }
.cell:active { transform: scale(0.98); }
.cell:disabled { cursor: default; }
.x-mark { color: #f472b6; text-shadow: 0 0 10px rgba(244,114,182,0.8); }
.o-mark { color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.8); }
.win { background: rgba(34,197,94,0.25); box-shadow: inset 0 0 12px rgba(34,197,94,0.6); }`,
    js: `const g = container.querySelector('#grid');
const r = container.querySelector('#reset');
const status = container.querySelector('#status');
const overlay = container.querySelector('#overlay');
const winnerText = container.querySelector('#winner-text');
const playAgain = container.querySelector('#play-again');
const lines = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];
let board = Array(9).fill(null);
let turn = 'X';
let isOver = false;

const updateStatus = () => {
  if (!status) return;
  status.innerText = isOver ? 'Partie terminee' : turn + ' a toi';
};

const check = () => {
  for (const line of lines) {
    const a = line[0], b = line[1], c = line[2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every(Boolean)) return { winner: 'draw' };
  return null;
};

const showOverlay = (text, line) => {
  if (!overlay || !winnerText) return;
  winnerText.innerText = text;
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  if (line && g) {
    line.forEach((idx) => {
      const cell = g.children[idx];
      if (cell) cell.classList.add('win');
    });
  }
};

const hideOverlay = () => {
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.classList.remove('flex');
};

const render = () => {
  if (!g) return;
  g.innerHTML = '';
  board.forEach((val, idx) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'cell';
    if (val) {
      d.innerText = val;
      d.classList.add(val === 'X' ? 'x-mark' : 'o-mark');
    }
    d.disabled = !!val || isOver;
    d.onclick = () => {
      if (board[idx] || isOver) return;
      board[idx] = turn;
      const result = check();
      if (result) {
        isOver = true;
      } else {
        turn = turn === 'X' ? 'O' : 'X';
      }
      render();
      if (result) {
        if (result.winner === 'draw') showOverlay('Match nul ✨');
        else showOverlay(result.winner + ' a gagne !', result.line);
      }
      updateStatus();
    };
    g.appendChild(d);
  });
};

const resetGame = () => {
  board = Array(9).fill(null);
  turn = 'X';
  isOver = false;
  hideOverlay();
  render();
  updateStatus();
};

if (r) r.onclick = resetGame;
if (playAgain) playAgain.onclick = resetGame;
render();
updateStatus();`,
    x: 13,
    y: 2
  },
  {
    id: 'widget-system',
    pageIndex: 0,
    type: 'widget',
    title: 'Système Cyber',
    widgetId: 'widget-system',
    cols: 2,
    rows: 2,
    bgColor: '#000',
    html: `<div class="flex h-full p-4 gap-4 items-center bg-gray-900 border border-white/10">
    
    <div class="flex-1 flex flex-col items-center">
        <div class="relative w-16 h-16 flex items-center justify-center">
             <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path class="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                <path id="cpu-circle" class="text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
            </svg>
            <span class="absolute text-xs font-mono text-purple-300" id="cpu-txt">0%</span>
        </div>
        <span class="text-[10px] text-gray-400 mt-1 uppercase">CPU Load</span>
    </div>
    
    <div class="flex-1 flex flex-col justify-center gap-1">
        <div class="flex justify-between text-[10px] text-cyan-400 font-mono"><span>RAM</span><span id="ram-txt">0GB</span></div>
        <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
             <div id="ram-bar" class="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-500" style="width: 0%"></div>
        </div>
        <div class="flex justify-between text-[10px] text-pink-400 font-mono mt-1"><span>GPU</span><span id="gpu-txt">0%</span></div>
        <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
             <div id="gpu-bar" class="h-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)] transition-all duration-500" style="width: 0%"></div>
        </div>
    </div>
</div>`,
    css: '',
    js: `const setCircle = (el, percent) => { el.setAttribute('stroke-dasharray', percent + ', 100'); };
const r = () => Math.floor(Math.random()*100);
const inv = setInterval(() => {
    const cpu = r(); 
    const ram = Math.floor(Math.random() * 16);
    const gpu = r();
    
    container.querySelector('#cpu-txt').innerText = cpu+'%';
    setCircle(container.querySelector('#cpu-circle'), cpu);

    container.querySelector('#ram-txt').innerText = ram + 'GB';
    container.querySelector('#ram-bar').style.width = (ram/32*100)+'%';

    container.querySelector('#gpu-txt').innerText = gpu+'%';
    container.querySelector('#gpu-bar').style.width = gpu+'%';
}, 2000);
container._cleanup = () => clearInterval(inv);`,
    x: 3,
    y: 11
  },
  {
    id: 'widget-ping',
    pageIndex: 0,
    type: 'widget',
    title: 'Ping Radar',
    widgetId: 'widget-ping',
    cols: 2,
    rows: 2,
    bgColor: '#064e3b',
    html: `<div class="relative flex flex-col items-center justify-center h-full bg-black overflow-hidden">
    
    <div class="absolute inset-0 border border-green-900 rounded-full m-2 opacity-50"></div>
    <div class="absolute inset-0 border border-green-900 rounded-full m-6 opacity-50"></div>
    
    <div class="radar-scan absolute w-full h-full bg-gradient-to-r from-transparent via-green-500/20 to-transparent"></div>
    
    <div class="z-10 text-center">
        <div class="text-3xl font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" id="ping-val">24</div>
        <div class="text-[10px] text-green-600 uppercase tracking-widest">LATENCY (MS)</div>
    </div>
    <div class="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
</div>`,
    css: `.radar-scan { animation: scan 2s linear infinite; } @keyframes scan { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`,
    js: `const el = container.querySelector('#ping-val');
const inv = setInterval(() => {
    const ms = 15 + Math.floor(Math.random() * 40);
    el.innerText = ms;
    el.style.color = ms > 100 ? '#ef4444' : '#4ade80';
}, 1000);
container._cleanup = () => clearInterval(inv);`,
    x: 9,
    y: 10
  },
  {
    id: 'widget-water-adv',
    pageIndex: 0,
    type: 'widget',
    title: 'Hydratation Pro',
    widgetId: 'widget-water-adv',
    cols: 2,
    rows: 2,
    bgColor: '#3b82f6',
    html: `<div class="relative flex flex-col h-full bg-blue-900 overflow-hidden group">
    
    <div id="water-level" class="absolute bottom-0 w-full bg-blue-500 transition-all duration-700 ease-in-out z-0 opacity-80" style="height: 0%">
         <div class="absolute top-0 w-full h-4 bg-blue-400 opacity-50 animate-pulse"></div>
    </div>
    
    
    <div class="relative z-10 flex flex-col items-center justify-between h-full py-4">
        <div class="text-white font-bold text-xl drop-shadow-md">Objectif</div>
        <div class="text-4xl font-black text-white drop-shadow-lg"><span id="count">0</span><span class="text-sm opacity-60 font-normal">/8</span></div>
        
        <div class="flex gap-2">
            <button id="minus" class="w-8 h-8 rounded-full bg-black/20 text-white hover:bg-black/40 text-xl flex items-center justify-center transition">-</button>
            <button id="plus" class="w-8 h-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 shadow-lg text-xl flex items-center justify-center transition transform active:scale-90">+</button>
        </div>
    </div>
    
    
    <div class="bubble w-2 h-2 bg-white/20 absolute bottom-0 left-2 rounded-full animate-bounce" style="animation-duration: 2s"></div>
    <div class="bubble w-3 h-3 bg-white/20 absolute bottom-0 right-4 rounded-full animate-bounce" style="animation-duration: 3s"></div>
</div>`,
    css: '',
    js: `const c = container.querySelector('#count');
const w = container.querySelector('#water-level');
let val = parseInt(localStorage.getItem('w-water')||'0');
const max = 8;
const up = () => { 
    c.innerText = val; 
    w.style.height = (val/max * 100) + '%';
    localStorage.setItem('w-water', val); 
};
container.querySelector('#plus').onclick = () => { if(val<max) val++; up(); };
container.querySelector('#minus').onclick = () => { if(val>0) val--; up(); };
up();`,
    x: 15,
    y: 8
  },
  {
    id: 'widget-coffee',
    pageIndex: 0,
    type: 'widget',
    title: 'Compteur Café',
    widgetId: 'widget-coffee',
    cols: 2,
    rows: 2,
    bgColor: '#78350f',
    html: `<div class="flex flex-col items-center justify-center h-full text-[#fef3c7] relative overflow-hidden">
    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/coffee.png')] opacity-10"></div>
    <div class="z-10 flex flex-col items-center">
        <div class="text-2xl animate-pulse">☕</div>
        <div class="text-3xl font-bold my-1" id="coffee-count">0</div>
        <button id="add-coffee" class="bg-[#92400e] hover:bg-[#b45309] text-white text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wide transition shadow-lg">+ Drink</button>
        <div id="warning" class="hidden text-[10px] text-red-400 font-bold mt-1 bg-black/50 px-1 rounded">SLOW DOWN!</div>
    </div>
</div>`,
    css: '',
    js: `const d = container.querySelector('#coffee-count');
const btn = container.querySelector('#add-coffee');
const warn = container.querySelector('#warning');
let count = parseInt(localStorage.getItem('w-coffee')||'0');

const render = () => {
    d.innerText = count;
    warn.classList.toggle('hidden', count <= 5);
    d.style.color = count > 5 ? '#ef4444' : '#fef3c7';
    localStorage.setItem('w-coffee', count);
};
btn.onclick = () => { count++; render(); };
// Reset daily logic could go here
render();`,
    x: 15,
    y: 10
  },
  {
    id: 'widget-kanban',
    pageIndex: 0,
    type: 'widget',
    title: 'Mini Kanban',
    widgetId: 'widget-kanban',
    cols: 6,
    rows: 3,
    bgColor: '#1e293b',
    html: `<div class="flex h-full gap-2 p-2 overflow-hidden select-none">
    
    <div class="flex-1 flex flex-col bg-slate-800 rounded border border-slate-700/50">
        <div class="p-2 text-xs font-bold text-gray-400 uppercase border-b border-slate-700">À faire</div>
        <div class="flex-1 p-1 overflow-y-auto space-y-1 kanban-col" data-status="todo" id="col-todo"></div>
        <button onclick="addTask()" class="p-1 text-center text-xs text-slate-500 hover:text-slate-300">+ Ajouter</button>
    </div>
    
    <div class="flex-1 flex flex-col bg-slate-800 rounded border border-slate-700/50">
        <div class="p-2 text-xs font-bold text-blue-400 uppercase border-b border-slate-700">En cours</div>
        <div class="flex-1 p-1 overflow-y-auto space-y-1 kanban-col" data-status="doing" id="col-doing"></div>
    </div>
    
    <div class="flex-1 flex flex-col bg-slate-800 rounded border border-slate-700/50">
        <div class="p-2 text-xs font-bold text-green-400 uppercase border-b border-slate-700">Fait</div>
        <div class="flex-1 p-1 overflow-y-auto space-y-1 kanban-col" data-status="done" id="col-done"></div>
    </div>
</div>`,
    css: `.task-card { background: #334155; padding: 6px; border-radius: 4px; font-size: 11px; color: #e2e8f0; cursor: grab; border-left: 3px solid transparent; } .task-card:active { cursor: grabbing; } .task-todo { border-left-color: #94a3b8; } .task-doing { border-left-color: #60a5fa; } .task-done { border-left-color: #4ade80; opacity: 0.6; text-decoration: line-through; }`,
    js: `let tasks = JSON.parse(localStorage.getItem('w-kanban') || '[{"id":1, "txt":"Modifier JSON", "st":"doing"}]');
const render = () => {
    ['todo','doing','done'].forEach(s => container.querySelector('#col-' + s).innerHTML = '');
    tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'task-card task-' + t.st;
        el.innerText = t.txt;
        el.draggable = true;
        el.ondragstart = (e) => { e.dataTransfer.setData('tid', t.id); };
        // Double click to delete
        el.ondblclick = () => { if(confirm('Supprimer ?')) { tasks = tasks.filter(x=>x.id!==t.id); save(); } };
        container.querySelector('#col-' + t.st).appendChild(el);
    });
};
const save = () => { localStorage.setItem('w-kanban', JSON.stringify(tasks)); render(); };
window.addTask = () => { 
    const t = prompt('Tâche ?'); 
    if(t) { tasks.push({id: Date.now(), txt: t, st: 'todo'}); save(); } 
};

// Drop Logic
container.querySelectorAll('.kanban-col').forEach(col => {
    col.ondragover = e => e.preventDefault();
    col.ondrop = e => {
        e.preventDefault();
        const tid = parseInt(e.dataTransfer.getData('tid'));
        const newSt = col.getAttribute('data-status');
        const task = tasks.find(t => t.id === tid);
        if(task && task.st !== newSt) { task.st = newSt; save(); }
    };
});
render();`,
    x: 3,
    y: 2
  },
  {
    id: 'widget-ide',
    pageIndex: 0,
    type: 'widget',
    title: 'Mini IDE',
    widgetId: 'widget-ide',
    cols: 3,
    rows: 3,
    bgColor: '#171717',
    html: `<div class="flex flex-col h-full text-xs font-mono">
    <div class="flex justify-between items-center bg-[#262626] px-2 py-1 border-b border-white/10">
        <span class="text-yellow-500">script.js</span>
        <button class="bg-green-600 hover:bg-green-700 text-white px-2 rounded flex items-center gap-1 transition" onclick="runCode()">▶ Run</button>
    </div>
    <textarea id="code" class="flex-1 bg-[#171717] text-gray-300 p-2 outline-none resize-none" spellcheck="false">// Write JS here
const a = 10;
alert('Result: ' + (a * 2));</textarea>
    <div id="console" class="h-6 bg-black text-gray-500 px-2 flex items-center border-t border-white/10 overflow-hidden whitespace-nowrap">Console ready.</div>
</div>`,
    css: `textarea { font-family: 'Fira Code', monospace; line-height: 1.4; }`,
    js: `const ta = container.querySelector('#code');
const cons = container.querySelector('#console');
// Load saved
ta.value = localStorage.getItem('w-ide') || ta.value;
ta.addEventListener('input', () => localStorage.setItem('w-ide', ta.value));

window.runCode = () => {
    try {
        // Capture console.log roughly
        const oldLog = console.log;
        console.log = (msg) => { cons.innerText = '> ' + msg; oldLog(msg); setTimeout(()=>console.log=oldLog, 100); };
        eval(ta.value);
        cons.style.color = '#4ade80';
    } catch (e) {
        cons.innerText = 'Err: ' + e.message;
        cons.style.color = '#ef4444';
    }
};`,
    x: 5,
    y: 8
  },
  buildWidgetItem('game-2048', { id: 'widget-2048', x: 9, y: 12, pageIndex: 0 }, WIDGET_TEMPLATES),
  buildWidgetItem('chifoumi', { id: 'widget-chifoumi', x: 11, y: 12, pageIndex: 0 }, WIDGET_TEMPLATES)
];

const PROTECTED_ITEM_IDS = new Set(['finder', 'browser']);

interface DesktopProps {
  api: WebOSAPI;
}

interface DragPlaceholder {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ResizeHandle {
  id: string;
  startX: number;
  startY: number;
  startCols: number;
  startRows: number;
  currentCols: number;
  currentRows: number;
}

export const Desktop: React.FC<DesktopProps> = ({ api }) => {
  // UTILISATION DU NOUVEAU HOOK
  const { isMobile, width: windowWidth, height: windowHeight } = useResponsive();


  const [items, setItems] = useState<WebOSItem[]>([]);
  const [config, setConfig] = useState<WebOSConfig>(DEFAULT_CONFIG);
  const [windows, setWindows] = useState<WebOSWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [widgetTemplates, setWidgetTemplates] = useState<WebOSWidgetTemplate[]>(WIDGET_TEMPLATES);
  const [obsidgetSettings, setObsidgetSettings] = useState<{
    maxWidthValue: number;
    maxWidthUnit: 'percent' | 'pixel';
  } | null>(null);
  const [vaultWallpapers, setVaultWallpapers] = useState<string[]>([]);
  const [vaultVideos, setVaultVideos] = useState<string[]>([]);
  const [barSize, setBarSize] = useState(0);
  const [paneHeaderHeight, setPaneHeaderHeight] = useState(0);
  const [currentPageId, setCurrentPageId] = useState(0);
  const [pageDragOffset, setPageDragOffset] = useState({ x: 0, y: 0 });
  const [isPageDragging, setIsPageDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidgetGallery, setShowWidgetGallery] = useState(false);
  const [widgetGalleryTab, setWidgetGalleryTab] = useState<'all' | 'os' | 'obsidget'>('all');
  const [showPages, setShowPages] = useState(false);
  const [isPagesEditMode, setIsPagesEditMode] = useState(false);
  const [fullscreenWidgetId, setFullscreenWidgetId] = useState<string | null>(null);
  const [showPageDots, setShowPageDots] = useState(true);
  const [settingsTab, setSettingsTab] = useState<'display' | 'navigation'>('display');
  const [pageSnapOffset, setPageSnapOffset] = useState({ x: 0, y: 0 });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPlaceholder, setDragPlaceholder] = useState<DragPlaceholder | null>(null);
  const [swapPreview, setSwapPreview] = useState<{
    targetId: string;
    targetPos: { x: number; y: number };
    draggedPos: { x: number; y: number };
  } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);

  const zIndexCounter = useRef(100);
  const dragItemRef = useRef<WebOSItem | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const backgroundLongPressTimer = useRef<number | null>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const modifierDragRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pageFlipTimer = useRef<number | null>(null);
  const pageFlipDir = useRef<{ x: number; y: number } | null>(null);
  const pageDragIdRef = useRef<number | null>(null);
  const pageDotsTimerRef = useRef<number | null>(null);
  const wheelLockRef = useRef<number | null>(null);
  const pageSnapRafRef = useRef<number | null>(null);
  const pageDragAxisRef = useRef<'x' | 'y' | null>(null);
  const backgroundDragRef = useRef<{ x: number; y: number } | null>(null);
  const backgroundDragActiveRef = useRef(false);
  const pageDragOffsetRef = useRef({ x: 0, y: 0 });
  const pageDragRaf = useRef<number | null>(null);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const pageCreationBudgetRef = useRef(1);
  const isHydrated = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [gridRowHeight, setGridRowHeight] = useState(96);
  const [gridCols, setGridCols] = useState(8);

  // DEBUGGING LOGS (Step 6)
  useEffect(() => {
    console.log('=== WebOS Debug ===');
    console.log('Is Mobile:', isMobile);
    console.log('Window:', windowWidth, 'x', windowHeight);
    console.log('Grid cols:', gridCols);
    console.log('Cell width:', gridRowHeight);
  }, [isMobile, gridCols, gridRowHeight, windowWidth, windowHeight]);

  const currentTheme = THEMES[config.theme] ?? THEMES.dark;
  const isRemotePath = useCallback((value: string) => /^(https?:|data:|app:|file:)/i.test(value), []);
  const isVideoPath = useCallback(
    (value: string) => /^data:video\//i.test(value) || /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(value),
    []
  );

  const obsidgetMaxWidth = useMemo(() => {
    if (!obsidgetSettings) return undefined;
    return { value: obsidgetSettings.maxWidthValue, unit: obsidgetSettings.maxWidthUnit };
  }, [obsidgetSettings?.maxWidthUnit, obsidgetSettings?.maxWidthValue]);

  const defaultWidgetItems = useMemo(
    () => DEFAULT_ITEMS.filter((item): item is WebOSWidgetItem => item.type === 'widget'),
    []
  );
  const builtInTemplates = useMemo(
    () => widgetTemplates.filter((template) => template.source !== 'obsidget'),
    [widgetTemplates]
  );
  const obsidgetTemplates = useMemo(
    () => widgetTemplates.filter((template) => template.source === 'obsidget'),
    [widgetTemplates]
  );
  const builtInTemplateIds = useMemo(() => new Set(builtInTemplates.map((template) => template.id)), [builtInTemplates]);
  const osExtraItems = useMemo(
    () => defaultWidgetItems.filter((item) => !builtInTemplateIds.has(item.widgetId)),
    [defaultWidgetItems, builtInTemplateIds]
  );

  const resolveIcon = useCallback(
    (icon?: string) => {
      if (!icon) return undefined;
      if (/^(https?:|data:|app:|file:)/i.test(icon)) return icon;
      if (icon.includes('/')) return api.resolveResourcePath(icon);
      return undefined;
    },
    [api]
  );

  const resolvedWallpaper = useMemo(() => {
    if (!config.wallpaper) return api.resolveResourcePath(DEFAULT_CONFIG.wallpaper);
    const candidate = config.wallpaper.replace(/\\/g, '/');
    if (isRemotePath(candidate)) return candidate;
    return api.resolveResourcePath(candidate);
  }, [api, config.wallpaper, isRemotePath]);

  const [wallpaperSrc, setWallpaperSrc] = useState(resolvedWallpaper);
  const isVideoWallpaper = useMemo(() => isVideoPath(wallpaperSrc), [isVideoPath, wallpaperSrc]);

  useEffect(() => {
    setWallpaperSrc(resolvedWallpaper);
  }, [resolvedWallpaper]);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-widget]')) {
        isWidgetInteractionRef.current = true;
      }
    };
    const handleFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Element && event.relatedTarget.closest('[data-widget]')) return;
      isWidgetInteractionRef.current = false;
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-widget]')) {
        isWidgetInteractionRef.current = true;
      } else {
        isWidgetInteractionRef.current = false;
      }
    };
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const pages = useMemo(() => {
    const ids = new Set<number>();
    ids.add(0);
    ids.add(currentPageId);
    items.forEach((item) => ids.add(item.pageIndex ?? 0));
    if (config.pageCoords) {
      Object.keys(config.pageCoords).forEach((key) => {
        const id = Number(key);
        if (!Number.isNaN(id)) ids.add(id);
      });
    }
    if (config.pageOrder && config.pageOrder.length > 0) {
      config.pageOrder.forEach((id) => ids.add(id));
    }
    const sorted = Array.from(ids).sort((a, b) => a - b);
    if (config.pageOrder && config.pageOrder.length > 0) {
      const ordered = config.pageOrder.filter((id) => ids.has(id));
      sorted.forEach((id) => {
        if (!ordered.includes(id)) ordered.push(id);
      });
      return ordered;
    }
    return sorted;
  }, [items, config.pageOrder, currentPageId]);

  const currentPageIndex = useMemo(() => {
    const idx = pages.indexOf(currentPageId);
    return idx === -1 ? 0 : idx;
  }, [pages, currentPageId]);

  const normalizePageCoords = useCallback(
    (coords: Record<number, { x: number; y: number }> | undefined, pageIds: number[]) => {
      const next: Record<number, { x: number; y: number }> = {};
      let maxX = -1;
      if (coords) {
        Object.entries(coords).forEach(([key, value]) => {
          const id = Number(key);
          if (Number.isNaN(id) || !value) return;
          const x = Number.isFinite(value.x) ? value.x : 0;
          const y = Number.isFinite(value.y) ? value.y : 0;
          next[id] = { x, y };
          maxX = Math.max(maxX, x);
        });
      }
      pageIds.forEach((id) => {
        if (next[id]) return;
        next[id] = { x: maxX + 1, y: 0 };
        maxX += 1;
      });
      return next;
    },
    []
  );

  const arePageCoordsEqual = (a: Record<number, { x: number; y: number }> | undefined, b: Record<number, { x: number; y: number }> | undefined) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      const av = a[Number(key)];
      const bv = b[Number(key)];
      if (!av || !bv) return false;
      if (av.x !== bv.x || av.y !== bv.y) return false;
    }
    return true;
  };

  const pageCoords = useMemo(
    () => normalizePageCoords(config.pageCoords, pages),
    [config.pageCoords, pages, normalizePageCoords]
  );

  useEffect(() => {
    setConfig((prev) => {
      const normalized = normalizePageCoords(prev.pageCoords, pages);
      if (arePageCoordsEqual(prev.pageCoords, normalized)) return prev;
      return { ...prev, pageCoords: normalized };
    });
  }, [pages, normalizePageCoords]);

  const getPageCoord = useCallback(
    (pageId: number) => {
      return pageCoords[pageId] ?? { x: 0, y: 0 };
    },
    [pageCoords]
  );

  const coordToPageId = useMemo(() => {
    const map = new Map<string, number>();
    pages.forEach((id) => {
      const coord = getPageCoord(id);
      map.set(`${coord.x},${coord.y}`, id);
    });
    return map;
  }, [pages, getPageCoord]);

  const currentPageCoord = useMemo(() => getPageCoord(currentPageId), [currentPageId, getPageCoord]);

  useEffect(() => {
    if (!pages.includes(currentPageId)) {
      setCurrentPageId(pages[0] ?? 0);
    }
  }, [pages, currentPageId]);

  useEffect(() => {
    let active = true;
    api.loadState().then((data) => {
      if (!active) return;
      if (data?.items?.length) setItems(data.items);
      else setItems(DEFAULT_ITEMS);

      if (data?.config) setConfig({ ...DEFAULT_CONFIG, ...data.config });
      if (data?.windows) {
        setWindows(data.windows);
        const maxZ = data.windows.reduce((max, win) => Math.max(max, win.zIndex), 100);
        zIndexCounter.current = maxZ + 1;
        const widgetWindow = data.windows.find((win) => win.kind === 'widget' && !win.isMinimized);
        if (widgetWindow?.widgetItemId) setFullscreenWidgetId(widgetWindow.widgetItemId);
        const active = data.windows.filter((win) => !win.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0];
        if (active) setActiveWindowId(active.id);
      }
      if (data?.widgetTemplates) setWidgetTemplates(data.widgetTemplates);
      isHydrated.current = true;
    });

    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    const updatePaneHeader = () => {
      const rootEl = rootRef.current;
      if (!rootEl) return;
      const viewEl = rootEl.closest('.view');
      const headerEl = viewEl?.querySelector('.view-header') as HTMLElement | null;
      if (!headerEl) {
        setPaneHeaderHeight(0);
        return;
      }
      const headerRect = headerEl.getBoundingClientRect();
      const rootRect = rootEl.getBoundingClientRect();
      const overlap = Math.max(0, headerRect.bottom - rootRect.top);
      setPaneHeaderHeight(overlap);
    };
    updatePaneHeader();
    const onResize = () => updatePaneHeader();
    window.addEventListener('resize', onResize);
    const timeoutId = window.setTimeout(updatePaneHeader, 0);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    const leafEl = rootEl.closest('.workspace-leaf');
    if (!leafEl) return;
    leafEl.classList.add('webos-hide-header');
    return () => {
      leafEl.classList.remove('webos-hide-header');
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadObsidget = async () => {
      const gallery = await api.getObsidgetGallery();
      const settings = await api.getObsidgetSettings();
      if (!active) return;
      if (settings) setObsidgetSettings(settings);
      if (!gallery || gallery.length === 0) return;
      const mapped = (gallery as Array<Record<string, unknown>>).map((entry) => ({
        id: String(entry.id || entry.name || `obsidget-${Math.random()}`),
        title: String(entry.name || entry.id || 'Widget'),
        cols: 2,
        rows: 2,
        bgColor: '#1f2937',
        kind: 'runner' as const,
        html: typeof entry.html === 'string' ? entry.html : '',
        css: typeof entry.css === 'string' ? entry.css : '',
        js: typeof entry.js === 'string' ? entry.js : '',
        source: 'obsidget' as const
      }));
      setWidgetTemplates((prev) => {
        const map = new Map(prev.map((template) => [template.id, template]));
        mapped.forEach((template) => {
          map.set(template.id, template);
        });
        return Array.from(map.values());
      });
    };
    loadObsidget();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!config.wallpaper || isRemotePath(config.wallpaper)) return;
    if (vaultWallpapers.length === 0) return;
    const normalized = config.wallpaper.replace(/\\/g, '/');
    if (vaultWallpapers.includes(normalized)) return;
    const targetName = normalized.split('/').pop()?.toLowerCase();
    if (!targetName) return;
    const match = vaultWallpapers.find((path) => path.split('/').pop()?.toLowerCase() === targetName);
    if (match) {
      setConfig((prev) => ({ ...prev, wallpaper: match }));
    }
  }, [config.wallpaper, vaultWallpapers, isRemotePath]);

  useEffect(() => {
    let active = true;
    const loadVaultWallpapers = async () => {
      const exts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'];
      const files: string[] = [];
      for (const ext of exts) {
        const found = await api.getFiles(ext);
        files.push(...found);
      }
      if (!active) return;
      const unique = Array.from(new Set(files));
      setVaultWallpapers(unique);
    };
    loadVaultWallpapers();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    let active = true;
    const loadVaultVideos = async () => {
      const exts = ['mp4', 'webm', 'mov', 'm4v', 'ogg'];
      const files: string[] = [];
      for (const ext of exts) {
        const found = await api.getFiles(ext);
        files.push(...found);
      }
      if (!active) return;
      const unique = Array.from(new Set(files));
      setVaultVideos(unique);
    };
    loadVaultVideos();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!isHydrated.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api.saveState({ items, config, windows, widgetTemplates });
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [items, config, windows, widgetTemplates, api]);

  const updateGridMetrics = useCallback(() => {
    const container = gridRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Safety check for zero width (e.g. on initial load or hidden tab)
    if (rect.width <= 0) {
      setGridCols(8);
      setGridRowHeight(96); // Default sensible value
      return;
    }

    let cols = 8;
    if (rect.width >= 768) cols = 12;
    if (rect.width >= 1024) cols = 16;
    setGridCols(cols);
    const gap = 16;
    const colWidth = (rect.width - gap * (cols - 1)) / cols;
    // Ensure we never have a negative or too small row height
    setGridRowHeight(Math.max(48, colWidth));
  }, []);

  useEffect(() => {
    updateGridMetrics();
    window.addEventListener('resize', updateGridMetrics);
    return () => window.removeEventListener('resize', updateGridMetrics);
  }, [updateGridMetrics]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => updateGridMetrics());
    return () => window.cancelAnimationFrame(id);
  }, [updateGridMetrics, currentPageId, barSize, config.barPosition]);

  const ensurePageAtCoord = useCallback(
    (x: number, y: number, allowCreate = true) => {
      const key = `${x},${y}`;
      const existing = coordToPageId.get(key);
      if (existing !== undefined) {
        setCurrentPageId(existing);
        return true;
      }
      if (!allowCreate || pageCreationBudgetRef.current <= 0) return false;
      const nextId = Math.max(...pages) + 1;
      const nextOrder = [...pages, nextId];
      setConfig((prev) => ({
        ...prev,
        pageOrder: nextOrder,
        pageCoords: { ...(prev.pageCoords ?? {}), [nextId]: { x, y } }
      }));
      setCurrentPageId(nextId);
      pageCreationBudgetRef.current = Math.max(0, pageCreationBudgetRef.current - 1);
      return true;
    },
    [coordToPageId, pages]
  );

  const movePageBy = useCallback(
    (dx: number, dy: number, allowCreate = true) => {
      const coord = getPageCoord(currentPageId);
      const hasItems = items.some((item) => (item.pageIndex ?? 0) === currentPageId);
      const canCreate = allowCreate && hasItems;
      return ensurePageAtCoord(coord.x + dx, coord.y + dy, canCreate);
    },
    [ensurePageAtCoord, getPageCoord, currentPageId, items]
  );

  const isWidgetInteractionRef = useRef(false);
  const isPageNavBlocked = useMemo(() => {
    const hasActiveWindow = windows.some((win) => !win.isMinimized);
    const fullscreenActive = fullscreenWidgetId
      ? windows.some(
        (win) => win.kind === 'widget' && win.widgetItemId === fullscreenWidgetId && !win.isMinimized
      )
        (win) => win.kind === 'widget' && win.widgetItemId === fullscreenWidgetId && !win.isMinimized
      )
      : false;
return hasActiveWindow || fullscreenActive;
  }, [windows, fullscreenWidgetId]);

useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      const activeEl = document.activeElement;
      if (activeEl instanceof Element && activeEl.closest('input, textarea, [contenteditable="true"]')) return;
      if (showSettings || showWidgetGallery) return;
      if (showPages) return;
      event.preventDefault();
      setShowPages((prev) => !prev);
      setIsPagesEditMode(false);
      return;
    }
    if (draggingId && dragItemRef.current && !showSettings && !showWidgetGallery && !showPages) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        pageCreationBudgetRef.current = 1;
        if (movePageBy(1, 0)) {
          setDragPlaceholder(null);
          setSwapPreview(null);
        }
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        pageCreationBudgetRef.current = 1;
        if (movePageBy(-1, 0)) {
          setDragPlaceholder(null);
          setSwapPreview(null);
        }
        return;
      }
      if (event.key === 'ArrowUp') {
        if (config.lockVerticalSwipe) return;
        event.preventDefault();
        pageCreationBudgetRef.current = 1;
        if (movePageBy(0, -1)) {
          setDragPlaceholder(null);
          setSwapPreview(null);
        }
        return;
      }
      if (event.key === 'ArrowDown') {
        if (config.lockVerticalSwipe) return;
        event.preventDefault();
        pageCreationBudgetRef.current = 1;
        if (movePageBy(0, 1)) {
          setDragPlaceholder(null);
          setSwapPreview(null);
        }
        return;
      }
    }
    if (showSettings || showWidgetGallery || showPages || isPageNavBlocked) return;
    if (isWidgetInteractionRef.current) return;
    const activeEl = document.activeElement;
    if (activeEl instanceof Element && activeEl.closest('[data-widget]')) return;
    if (event.target instanceof Element && event.target.closest('[data-widget]')) return;
    if (event.key === 'ArrowRight') {
      pageCreationBudgetRef.current = 1;
      movePageBy(1, 0);
    } else if (event.key === 'ArrowLeft') {
      pageCreationBudgetRef.current = 1;
      movePageBy(-1, 0);
    } else if (event.key === 'ArrowUp') {
      if (config.lockVerticalSwipe) return;
      pageCreationBudgetRef.current = 1;
      movePageBy(0, -1);
    } else if (event.key === 'ArrowDown') {
      if (config.lockVerticalSwipe) return;
      pageCreationBudgetRef.current = 1;
      movePageBy(0, 1);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [draggingId, showSettings, showWidgetGallery, showPages, isPageNavBlocked, movePageBy, config.lockVerticalSwipe]);

useEffect(() => {
  setShowPageDots(true);
  if (pageDotsTimerRef.current) {
    window.clearTimeout(pageDotsTimerRef.current);
    pageDotsTimerRef.current = null;
  }
  if (isPageDragging) return;
  pageDotsTimerRef.current = window.setTimeout(() => {
    setShowPageDots(false);
    pageDotsTimerRef.current = null;
  }, 5000);
  return () => {
    if (pageDotsTimerRef.current) {
      window.clearTimeout(pageDotsTimerRef.current);
      pageDotsTimerRef.current = null;
    }
  };
}, [currentPageId, isPageDragging]);

useEffect(() => {
  const handleWheel = (event: WheelEvent) => {
    if (isEditing || showSettings || showWidgetGallery || showPages || isPageNavBlocked) return;
    if (isWidgetInteractionRef.current) return;
    if (event.target instanceof Element && event.target.closest('[data-widget]')) return;
    if (Math.abs(event.deltaX) < 20 && Math.abs(event.deltaY) < 20) return;
    if (wheelLockRef.current) return;
    pageCreationBudgetRef.current = 1;
    let moved = false;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      moved = event.deltaX > 0 ? movePageBy(1, 0) : movePageBy(-1, 0);
    } else {
      if (config.lockVerticalSwipe) return;
      moved = event.deltaY > 0 ? movePageBy(0, 1) : movePageBy(0, -1);
    }
    if (moved) {
      if (wheelLockRef.current) window.clearTimeout(wheelLockRef.current);
      wheelLockRef.current = window.setTimeout(() => {
        wheelLockRef.current = null;
      }, 350);
    }
  };
  window.addEventListener('wheel', handleWheel, { passive: true });
  return () => {
    window.removeEventListener('wheel', handleWheel);
    if (wheelLockRef.current) {
      window.clearTimeout(wheelLockRef.current);
      wheelLockRef.current = null;
    }
  };
}, [isEditing, showSettings, showWidgetGallery, showPages, isPageNavBlocked, movePageBy, config.lockVerticalSwipe]);

const pixelsToGrid = useCallback(
  (x: number, y: number, rect: DOMRect) => {
    const gap = 16;
    const colWidth = (rect.width - gap * (gridCols - 1)) / gridCols;
    const gridX = Math.floor((x - rect.left) / (colWidth + gap)) + 1;
    const gridY = Math.floor((y - rect.top) / (gridRowHeight + 24)) + 1;
    return {
      x: Math.max(1, Math.min(gridX, gridCols)),
      y: Math.max(1, gridY)
    };
  },
  [gridCols, gridRowHeight]
);

const getItemStyle = (item: WebOSItem) => {
  const layout = !item.x || !item.y ? layoutOverrides.get(item.id) : undefined;
  const style: React.CSSProperties = {
    gridColumnEnd: `span ${item.cols || 1}`,
    gridRowEnd: `span ${item.rows || 1}`
  };
  let x = layout?.x ?? item.x;
  let y = layout?.y ?? item.y;
  if (swapPreview && draggingId && item.id === swapPreview.targetId) {
    x = swapPreview.draggedPos.x;
    y = swapPreview.draggedPos.y;
  }
  if (x && y) {
    style.gridColumnStart = x;
    style.gridRowStart = y;
  }
  return style;
};

const updateItem = (id: string, updates: Partial<WebOSItem>) => {
  setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
};

const deleteItem = (id: string) => {
  if (PROTECTED_ITEM_IDS.has(id)) return;
  setItems((prev) => prev.filter((item) => item.id !== id));
};

const findFreeSlot = (cols: number, rows: number) => {
  for (let y = 1; y <= 10; y += 1) {
    for (let x = 1; x <= gridCols - cols + 1; x += 1) {
      const overlaps = items.some((item) => {
        if ((item.pageIndex ?? 0) !== currentPageId) return false;
        if (!item.x || !item.y) return false;
        const width = item.cols || 1;
        const height = item.rows || 1;
        return !(item.x + width <= x || x + cols <= item.x || item.y + height <= y || y + rows <= item.y);
      });
      if (!overlaps) return { x, y };
    }
  }
  return { x: 1, y: 1 };
};

const findFreeSlotForItems = (
  list: WebOSItem[],
  cols: number,
  rows: number,
  pageIndex: number,
  ignoreId?: string
) => {
  for (let y = 1; y <= 10; y += 1) {
    for (let x = 1; x <= gridCols - cols + 1; x += 1) {
      const overlaps = list.some((item) => {
        if (item.id === ignoreId) return false;
        if ((item.pageIndex ?? 0) !== pageIndex) return false;
        if (!item.x || !item.y) return false;
        const width = item.cols || 1;
        const height = item.rows || 1;
        return !(item.x + width <= x || x + cols <= item.x || item.y + height <= y || y + rows <= item.y);
      });
      if (!overlaps) return { x, y };
    }
  }
  return { x: 1, y: 1 };
};

const resolveOverlapsAfterResize = (resizedId: string) => {
  setItems((prev) => {
    const updated = [...prev];
    const resized = updated.find((item) => item.id === resizedId);
    if (!resized || !resized.x || !resized.y) return prev;
    const pageIndex = resized.pageIndex ?? 0;
    const width = resized.cols || 1;
    const height = resized.rows || 1;
    const overlaps = (item: WebOSItem) => {
      if (!item.x || !item.y) return false;
      const w = item.cols || 1;
      const h = item.rows || 1;
      return !(
        item.x + w <= resized.x! ||
        resized.x! + width <= item.x ||
        item.y + h <= resized.y! ||
        resized.y! + height <= item.y
      );
    };

    updated.forEach((item) => {
      if (item.id === resizedId) return;
      if ((item.pageIndex ?? 0) !== pageIndex) return;
      if (overlaps(item)) {
        const slot = findFreeSlotForItems(updated, item.cols || 1, item.rows || 1, pageIndex, resizedId);
        item.x = slot.x;
        item.y = slot.y;
      }
    });
    return updated;
  });
};

const openWindowForItem = (item: WebOSItem, details: Partial<WebOSWindow>) => {
  const existing = windows.find((win) => win.itemId === item.id && win.kind === details.kind);
  if (existing) {
    focusWindow(existing.id);
    if (existing.isMinimized) minimizeWindow(existing.id);
    return;
  }

  const newWindow: WebOSWindow = {
    id: `${Date.now()}`,
    itemId: item.id,
    title: details.title || item.title,
    kind: details.kind || 'custom',
    url: details.url,
    path: details.path,
    history: details.url ? [details.url] : [],
    historyIndex: details.url ? 0 : -1,
    x: 100 + windows.length * 20,
    y: 100 + windows.length * 20,
    w: 840,
    h: 560,
    zIndex: zIndexCounter.current + 1,
    isMinimized: false,
    isMaximized: false
  };

  zIndexCounter.current += 1;
  setWindows((prev) => [...prev, newWindow]);
  setActiveWindowId(newWindow.id);
};

const closeWindow = (id: string) => {
  const closed = windows.find((win) => win.id === id);
  setWindows((prev) => prev.filter((win) => win.id !== id));
  if (closed?.kind === 'widget' && closed.widgetItemId) {
    setFullscreenWidgetId((prev) => (prev === closed.widgetItemId ? null : prev));
  }
  if (activeWindowId === id) setActiveWindowId(null);
};

const focusWindow = (id: string) => {
  zIndexCounter.current += 1;
  setWindows((prev) =>
    prev.map((win) => (win.id === id ? { ...win, zIndex: zIndexCounter.current } : win))
  );
  setActiveWindowId(id);
};

const minimizeWindow = (id: string) => {
  setWindows((prev) =>
    prev.map((win) => {
      if (win.id !== id) return win;
      const next = { ...win, isMinimized: !win.isMinimized };
      if (next.kind === 'widget' && next.isMinimized && next.widgetItemId) {
        setFullscreenWidgetId((current) => (current === next.widgetItemId ? null : current));
      }
      if (next.isMinimized && activeWindowId === id) {
        setActiveWindowId(null);
      }
      return next;
    })
  );
};

const maximizeWindow = (id: string) => {
  setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, isMaximized: !win.isMaximized } : win)));
};

const updateWindow = (id: string, updates: Partial<WebOSWindow>) => {
  setWindows((prev) => prev.map((win) => (win.id === id ? { ...win, ...updates } : win)));
};

const launchItem = (item: WebOSItem) => {
  if (item.type !== 'app') return;
  if (item.appId === 'finder') {
    openWindowForItem(item, { kind: 'finder', title: 'Finder' });
    return;
  }

  if (item.url) {
    if (item.external) window.open(item.url, '_blank');
    else openWindowForItem(item, { kind: 'url', url: item.url, title: item.title });
  }
};

const handlePointerDown = (event: React.PointerEvent, item: WebOSItem) => {
  pointerDownPos.current = { x: event.clientX, y: event.clientY };
  pageCreationBudgetRef.current = 1;
  setPageSnapOffset({ x: 0, y: 0 });
  if (pageSnapRafRef.current) {
    window.cancelAnimationFrame(pageSnapRafRef.current);
    pageSnapRafRef.current = null;
  }
  pageDragAxisRef.current = null;
  const hasModifier = event.shiftKey || event.ctrlKey;
  if (hasModifier) {
    modifierDragRef.current = true;
    event.preventDefault();
    startDrag(event, item);
    return;
  }
  modifierDragRef.current = false;
  if (!isEditing) {
    longPressTimer.current = window.setTimeout(() => {
      setIsEditing(true);
      startDrag(event, item);
    }, 600);
    return;
  }
  event.preventDefault();
  startDrag(event, item);
};

const startDrag = (event: React.PointerEvent, item: WebOSItem) => {
  const element = document.getElementById(item.id);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  setDragPos({ x: event.clientX, y: event.clientY });
  dragItemRef.current = item;
  setDraggingId(item.id);
  if (event.target instanceof Element && event.target.setPointerCapture) {
    event.target.setPointerCapture(event.pointerId);
  }
};

const handlePointerMove = (event: React.PointerEvent) => {
  if (backgroundLongPressTimer.current && pointerDownPos.current) {
    const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
    if (dist > 30) {
      window.clearTimeout(backgroundLongPressTimer.current);
      backgroundLongPressTimer.current = null;
    }
  }

  if (
    backgroundDragActiveRef.current &&
    backgroundDragRef.current &&
    !isEditing &&
    !draggingId &&
    !isPageNavBlocked
  ) {
    const dx = event.clientX - backgroundDragRef.current.x;
    const dy = event.clientY - backgroundDragRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (!pageDragAxisRef.current && (absDx > 6 || absDy > 6)) {
      pageDragAxisRef.current = absDx >= absDy ? 'x' : 'y';
    }
    if (pageDragAxisRef.current === 'x') {
      const rect = gridRef.current?.getBoundingClientRect();
      const containerWidth = rect && rect.width > 50 ? rect.width : window.innerWidth;
      const dragPercent = Math.max(-100, Math.min(100, (dx / containerWidth) * 100));
      setIsPageDragging(true);
      setPageDragOffsetRaf({ x: dragPercent, y: 0 });
    } else if (pageDragAxisRef.current === 'y') {
      if (config.lockVerticalSwipe) return;
      const rect = gridRef.current?.getBoundingClientRect();
      const containerHeight = rect && rect.height > 50 ? rect.height : window.innerHeight;
      const dragPercent = Math.max(-100, Math.min(100, (dy / containerHeight) * 100));
      setIsPageDragging(true);
      setPageDragOffsetRaf({ x: 0, y: dragPercent });
    } else if (isPageDragging) {
      setPageDragOffsetRaf({ x: 0, y: 0 });
    }
  }
  if (pointerDownPos.current && !draggingId && !resizeHandle) {
    const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
    if (dist > 10 && longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  if (resizeHandle) {
    event.preventDefault();
    const diffX = event.clientX - resizeHandle.startX;
    const diffY = event.clientY - resizeHandle.startY;
    const colDiff = Math.round(diffX / gridRowHeight);
    const rowDiff = Math.round(diffY / gridRowHeight);
    const rawCols = Math.max(1, resizeHandle.startCols + colDiff);
    const rawRows = Math.max(1, resizeHandle.startRows + rowDiff);
    const resizedItem = items.find((item) => item.id === resizeHandle.id);
    if (resizedItem?.x && resizedItem?.y) {
      const maxCols = Math.max(1, gridCols - resizedItem.x + 1);
      const newCols = Math.min(rawCols, maxCols);
      const newRows = rawRows;
      const overlaps = items.some((item) => {
        if (item.id === resizeHandle.id) return false;
        if ((item.pageIndex ?? 0) !== (resizedItem.pageIndex ?? 0)) return false;
        if (!item.x || !item.y) return false;
        const w = item.cols || 1;
        const h = item.rows || 1;
        return !(
          item.x + w <= resizedItem.x! ||
          resizedItem.x! + newCols <= item.x ||
          item.y + h <= resizedItem.y! ||
          resizedItem.y! + newRows <= item.y
        );
      });
      if (!overlaps && (newCols !== resizeHandle.currentCols || newRows !== resizeHandle.currentRows)) {
        updateItem(resizeHandle.id, { cols: newCols, rows: newRows });
        setResizeHandle({ ...resizeHandle, currentCols: newCols, currentRows: newRows });
      }
    }
    return;
  }

  if (!draggingId || !dragItemRef.current) return;
  event.preventDefault();
  setDragPos({ x: event.clientX, y: event.clientY });

  if (!isPageNavBlocked) {
    const edgeThreshold = 48;
    const containerRect = gridRef.current?.getBoundingClientRect();
    const rightEdge = containerRect ? containerRect.right : window.innerWidth;
    const leftEdge = containerRect ? containerRect.left : 0;
    const topEdge = containerRect ? containerRect.top : 0;
    const bottomEdge = containerRect ? containerRect.bottom : window.innerHeight;

    const scheduleFlip = (dx: number, dy: number) => {
      const currentDir = pageFlipDir.current;
      if (currentDir && currentDir.x === dx && currentDir.y === dy && pageFlipTimer.current) return;
      if (pageFlipTimer.current) window.clearTimeout(pageFlipTimer.current);
      pageFlipDir.current = { x: dx, y: dy };
      pageFlipTimer.current = window.setTimeout(() => {
        movePageBy(dx, dy);
      }, 700);
    };

    const clearFlip = () => {
      if (pageFlipTimer.current) window.clearTimeout(pageFlipTimer.current);
      pageFlipTimer.current = null;
      pageFlipDir.current = null;
    };

    if (event.clientX > rightEdge - edgeThreshold) {
      scheduleFlip(1, 0);
    } else if (event.clientX < leftEdge + edgeThreshold) {
      scheduleFlip(-1, 0);
    } else if (event.clientY > bottomEdge - edgeThreshold) {
      scheduleFlip(0, 1);
    } else if (event.clientY < topEdge + edgeThreshold) {
      scheduleFlip(0, -1);
    } else {
      clearFlip();
    }
  }

  const container = gridRef.current;
  if (container) {
    const rect = container.getBoundingClientRect();
    const itemX = event.clientX - dragOffset.x;
    const itemY = event.clientY - dragOffset.y;
    const { x, y } = pixelsToGrid(itemX, itemY, rect);
    const placeholder = {
      x,
      y,
      w: dragItemRef.current.cols || 1,
      h: dragItemRef.current.rows || 1
    };
    setDragPlaceholder(placeholder);

    const draggedX = dragItemRef.current.x ?? layoutOverrides.get(dragItemRef.current.id)?.x;
    const draggedY = dragItemRef.current.y ?? layoutOverrides.get(dragItemRef.current.id)?.y;
    const overlapTarget = items.find((item) => {
      if (item.id === draggingId) return false;
      if ((item.pageIndex ?? 0) !== currentPageId) return false;
      const ix = item.x ?? layoutOverrides.get(item.id)?.x;
      const iy = item.y ?? layoutOverrides.get(item.id)?.y;
      if (!ix || !iy) return false;
      const iw = item.cols || 1;
      const ih = item.rows || 1;
      return !(
        ix + iw <= placeholder.x ||
        placeholder.x + placeholder.w <= ix ||
        iy + ih <= placeholder.y ||
        placeholder.y + placeholder.h <= iy
      );
    });

    const nextPreview =
      overlapTarget && draggedX && draggedY
        ? {
          targetId: overlapTarget.id,
          targetPos: {
            x: overlapTarget.x ?? layoutOverrides.get(overlapTarget.id)?.x ?? 0,
            y: overlapTarget.y ?? layoutOverrides.get(overlapTarget.id)?.y ?? 0
          },
          draggedPos: { x: draggedX, y: draggedY }
        }
            targetId: overlapTarget.id,
      targetPos: {
      x: overlapTarget.x ?? layoutOverrides.get(overlapTarget.id)?.x ?? 0,
        y: overlapTarget.y ?? layoutOverrides.get(overlapTarget.id)?.y ?? 0
    },
    draggedPos: { x: draggedX, y: draggedY }
  }
          : null;

setSwapPreview((prev) => {
  if (!nextPreview && !prev) return prev;
  if (nextPreview && prev) {
    if (
      prev.targetId === nextPreview.targetId &&
      prev.targetPos.x === nextPreview.targetPos.x &&
      prev.targetPos.y === nextPreview.targetPos.y &&
      prev.draggedPos.x === nextPreview.draggedPos.x &&
      prev.draggedPos.y === nextPreview.draggedPos.y
    ) {
      return prev;
    }
  }
  if (nextPreview && (!nextPreview.targetPos.x || !nextPreview.targetPos.y)) {
    return null;
  }
  return nextPreview;
});
    }
  };

const handlePointerUp = (event: React.PointerEvent) => {
  if (longPressTimer.current) {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }
  if (backgroundLongPressTimer.current) {
    window.clearTimeout(backgroundLongPressTimer.current);
    backgroundLongPressTimer.current = null;
  }
  if (pageFlipTimer.current) {
    window.clearTimeout(pageFlipTimer.current);
    pageFlipTimer.current = null;
    pageFlipDir.current = null;
  }
  if (
    backgroundDragActiveRef.current &&
    backgroundDragRef.current &&
    !isEditing &&
    !draggingId &&
    !isPageNavBlocked
  ) {
    const dx = event.clientX - backgroundDragRef.current.x;
    const dy = event.clientY - backgroundDragRef.current.y;
    const dragOffset = pageDragOffsetRef.current;
    if (isPageDragging) {
      let snapped = false;
      if (Math.abs(dragOffset.x) >= 30 && Math.abs(dragOffset.x) >= Math.abs(dragOffset.y)) {
        const dirX = dragOffset.x < 0 ? 1 : -1;
        snapped = movePageBy(dirX, 0);
        schedulePageSnap({ x: dragOffset.x + dirX * 100, y: dragOffset.y });
      } else if (Math.abs(dragOffset.y) >= 30 && Math.abs(dragOffset.y) >= Math.abs(dragOffset.x)) {
        if (!config.lockVerticalSwipe) {
          const dirY = dragOffset.y < 0 ? 1 : -1;
          snapped = movePageBy(0, dirY);
          schedulePageSnap({ x: dragOffset.x, y: dragOffset.y + dirY * 100 });
        }
      }
      if (!snapped) {
        schedulePageSnap({ x: dragOffset.x, y: dragOffset.y });
      }
    } else if (Math.abs(dx) > swipeThreshold && Math.abs(dy) < swipePerpTolerance) {
      movePageBy(dx < 0 ? 1 : -1, 0);
    } else if (Math.abs(dy) > swipeThreshold && Math.abs(dx) < swipePerpTolerance) {
      if (!config.lockVerticalSwipe) movePageBy(0, dy < 0 ? 1 : -1);
    }
  }
  if (isPageDragging) {
    setIsPageDragging(false);
  }
  backgroundDragRef.current = null;
  backgroundDragActiveRef.current = false;

  if (resizeHandle) {
    setResizeHandle(null);
    modifierDragRef.current = false;
    setSwapPreview(null);
    return;
  }

  if (!draggingId && pointerDownPos.current) {
    const dist = Math.hypot(event.clientX - pointerDownPos.current.x, event.clientY - pointerDownPos.current.y);
    if (dist < 8) {
      if (!modifierDragRef.current) {
        const target = event.target instanceof Element ? event.target.closest('[data-id]') : null;
        const id = target?.getAttribute('data-id');
        const item = items.find((candidate) => candidate.id === id);
        if (item && !isEditing) launchItem(item);
      }
    }
  }

  pointerDownPos.current = null;
  modifierDragRef.current = false;

  if (draggingId && dragItemRef.current) {
    const trashRect = trashRef.current?.getBoundingClientRect();
    const isOverTrash =
      !!trashRect &&
      event.clientX >= trashRect.left &&
      event.clientX <= trashRect.right &&
      event.clientY >= trashRect.top &&
      event.clientY <= trashRect.bottom;
    if (isOverTrash) {
      deleteItem(draggingId);
    } else {
      const container = gridRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const itemX = event.clientX - dragOffset.x;
        const itemY = event.clientY - dragOffset.y;
        const { x, y } = pixelsToGrid(itemX, itemY, rect);
        const colliding = items.find(
          (item) => item.id !== draggingId && (item.pageIndex ?? 0) === currentPageId && item.x === x && item.y === y
        );
        if (colliding) {
          const draggedItem = items.find((item) => item.id === draggingId);
          if (draggedItem) {
            updateItem(draggingId, { x, y, pageIndex: currentPageId });
            updateItem(colliding.id, { x: draggedItem.x, y: draggedItem.y, pageIndex: currentPageId });
          }
        } else {
          updateItem(draggingId, { x, y, pageIndex: currentPageId });
        }
      }
    }
  }

  setDraggingId(null);
  setDragPlaceholder(null);
  setSwapPreview(null);
  dragItemRef.current = null;
};

const addWidget = (template: WebOSWidgetTemplate) => {
  const id = `widget-${Date.now()}`;
  const { x, y } = findFreeSlot(template.cols, template.rows);
  const newItem: WebOSWidgetItem = {
    id,
    type: 'widget',
    title: template.title,
    widgetId: template.id,
    cols: template.cols,
    rows: template.rows,
    bgColor: template.bgColor,
    html: template.source === 'obsidget' ? undefined : template.html,
    css: template.source === 'obsidget' ? undefined : template.css,
    js: template.source === 'obsidget' ? undefined : template.js,
    x,
    y,
    pageIndex: currentPageId
  };
  setItems((prev) => [...prev, newItem]);
  setShowWidgetGallery(false);
};

const addWidgetFromItem = (item: WebOSWidgetItem) => {
  const cols = item.cols ?? 1;
  const rows = item.rows ?? 1;
  const { x, y } = findFreeSlot(cols, rows);
  const newItem: WebOSWidgetItem = {
    id: `widget-${Date.now()}`,
    type: 'widget',
    title: item.title,
    widgetId: item.widgetId,
    cols,
    rows,
    bgColor: item.bgColor ?? '#334155',
    html: item.html,
    css: item.css,
    js: item.js,
    x,
    y,
    pageIndex: currentPageId
  };
  setItems((prev) => [...prev, newItem]);
  setShowWidgetGallery(false);
};

const dockItems = useMemo(
  () => items.filter((item) => item.type === 'app').sort((a, b) => (a.dockOrder ?? 0) - (b.dockOrder ?? 0)),
  [items]
);

const layoutOverrides = useMemo(() => {
  const overrides = new Map<string, { x: number; y: number }>();
  const byPage = new Map<number, WebOSItem[]>();
  items.forEach((item) => {
    const pageIndex = item.pageIndex ?? 0;
    const list = byPage.get(pageIndex) ?? [];
    list.push(item);
    byPage.set(pageIndex, list);
  });

  byPage.forEach((pageItems, pageIndex) => {
    const sorted = [...pageItems].sort((a, b) => {
      const ay = a.y ?? 999;
      const by = b.y ?? 999;
      if (ay !== by) return ay - by;
      return (a.x ?? 999) - (b.x ?? 999);
    });
    const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
    const place = (item: WebOSItem) => {
      const cols = item.cols || 1;
      const rows = item.rows || 1;
      for (let y = 1; y <= 10; y += 1) {
        for (let x = 1; x <= gridCols - cols + 1; x += 1) {
          const overlaps = occupied.some((cell) => {
            return !(
              cell.x + cell.w <= x ||
              x + cols <= cell.x ||
              cell.y + cell.h <= y ||
              y + rows <= cell.y
            );
          });
          if (!overlaps) {
            occupied.push({ x, y, w: cols, h: rows });
            overrides.set(item.id, { x, y });
            return;
          }
        }
      }
      overrides.set(item.id, { x: 1, y: 1 });
    };
    sorted.forEach((item) => {
      const x = item.x ?? 1;
      const y = item.y ?? 1;
      const cols = item.cols || 1;
      const rows = item.rows || 1;
      if (x + cols - 1 <= gridCols) {
        const overlaps = occupied.some((cell) => {
          return !(
            cell.x + cell.w <= x ||
            x + cols <= cell.x ||
            cell.y + cell.h <= y ||
            y + rows <= cell.y
          );
        });
        if (!overlaps) {
          occupied.push({ x, y, w: cols, h: rows });
          return;
        }
      }
      place(item);
    });
  });

  return overrides;
}, [items, gridCols]);

const openDockIds = useMemo(() => {
  return new Set(windows.filter((win) => win.itemId).map((win) => win.itemId as string));
}, [windows]);

const openWidgetIds = useMemo(() => {
  return new Set(
    windows
      .filter((win) => win.kind === 'widget' && win.widgetItemId)
      .map((win) => win.widgetItemId as string)
  );
}, [windows]);

const currentPageLabel = useMemo(() => {
  const name = config.pageNames?.[currentPageId];
  return name && name.trim() ? name : `Page ${currentPageIndex + 1}`;
}, [config.pageNames, currentPageId, currentPageIndex]);

const setPageDragOffsetRaf = useCallback((value: { x: number; y: number }) => {
  pageDragOffsetRef.current = value;
  if (pageDragRaf.current) return;
  pageDragRaf.current = window.requestAnimationFrame(() => {
    setPageDragOffset(pageDragOffsetRef.current);
    pageDragRaf.current = null;
  });
}, []);

const schedulePageSnap = useCallback(
  (offset: { x: number; y: number }) => {
    setPageSnapOffset(offset);
    if (pageSnapRafRef.current) {
      window.cancelAnimationFrame(pageSnapRafRef.current);
      pageSnapRafRef.current = null;
    }
    pageSnapRafRef.current = window.requestAnimationFrame(() => {
      pageSnapRafRef.current = window.requestAnimationFrame(() => {
        setPageSnapOffset({ x: 0, y: 0 });
        setPageDragOffsetRaf({ x: 0, y: 0 });
        pageSnapRafRef.current = null;
      });
    });
  },
  [setPageDragOffsetRaf]
);

const handleTouchStart = (event: React.TouchEvent) => {
  if (showSettings || showWidgetGallery || showPages) return;
  const isSwipeBlockedTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return (
      !!target.closest('[data-widget]') ||
      !!target.closest('[data-window]') ||
      !!target.closest('.webos-dock') ||
      !!target.closest('.webos-taskbar')
    );
  };
  if (isSwipeBlockedTarget(event.target)) return;
  if (isEditing) return;
  if (isPageNavBlocked || isWidgetInteractionRef.current) return;
  pageCreationBudgetRef.current = 1;
  setPageSnapOffset({ x: 0, y: 0 });
  if (pageSnapRafRef.current) {
    window.cancelAnimationFrame(pageSnapRafRef.current);
    pageSnapRafRef.current = null;
  }
  pageDragAxisRef.current = null;
  if (backgroundLongPressTimer.current) window.clearTimeout(backgroundLongPressTimer.current);
  backgroundLongPressTimer.current = window.setTimeout(() => {
    setIsEditing(true);
  }, 3000);
  touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
};

const handleTouchMove = (event: React.TouchEvent) => {
  if (showSettings || showWidgetGallery || showPages) return;
  if (!touchStartRef.current || isEditing || isPageNavBlocked) return;
  if (isWidgetInteractionRef.current) return;
  const touch = event.touches[0];
  if (!touch) return;
  const dx = touch.clientX - touchStartRef.current.x;
  const dy = touch.clientY - touchStartRef.current.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (backgroundLongPressTimer.current && (absDx > 30 || absDy > 30)) {
    window.clearTimeout(backgroundLongPressTimer.current);
    backgroundLongPressTimer.current = null;
  }
  if (absDx < 6 && absDy < 6) return;
  event.preventDefault();
  if (!pageDragAxisRef.current && (absDx > 6 || absDy > 6)) {
    pageDragAxisRef.current = absDx >= absDy ? 'x' : 'y';
  }
  if (pageDragAxisRef.current === 'x') {
    const rect = gridRef.current?.getBoundingClientRect();
    const containerWidth = rect && rect.width > 50 ? rect.width : window.innerWidth;
    const dragPercent = Math.max(-100, Math.min(100, (dx / containerWidth) * 100));
    setIsPageDragging(true);
    setPageDragOffsetRaf({ x: dragPercent, y: 0 });
  } else if (pageDragAxisRef.current === 'y') {
    if (config.lockVerticalSwipe) return;
    const rect = gridRef.current?.getBoundingClientRect();
    const containerHeight = rect && rect.height > 50 ? rect.height : window.innerHeight;
    const dragPercent = Math.max(-100, Math.min(100, (dy / containerHeight) * 100));
    setIsPageDragging(true);
    setPageDragOffsetRaf({ x: 0, y: dragPercent });
  }
};

const handleTouchEnd = (event: React.TouchEvent) => {
  if (showSettings || showWidgetGallery || showPages) return;
  const isSwipeBlockedTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return (
      !!target.closest('[data-widget]') ||
      !!target.closest('[data-window]') ||
      !!target.closest('.webos-dock') ||
      !!target.closest('.webos-taskbar')
    );
  };
  if (backgroundLongPressTimer.current) {
    window.clearTimeout(backgroundLongPressTimer.current);
    backgroundLongPressTimer.current = null;
  }
  if (isEditing && !isSwipeBlockedTarget(event.target)) {
    setIsEditing(false);
    touchStartRef.current = null;
    return;
  }
  if (!touchStartRef.current || isEditing || isPageNavBlocked) return;
  if (isWidgetInteractionRef.current) return;
  const diffX = touchStartRef.current.x - event.changedTouches[0].clientX;
  const diffY = touchStartRef.current.y - event.changedTouches[0].clientY;
  const dragOffset = pageDragOffsetRef.current;
  if (isPageDragging) {
    let snapped = false;
    if (Math.abs(dragOffset.x) >= 30 && Math.abs(dragOffset.x) >= Math.abs(dragOffset.y)) {
      const dirX = dragOffset.x < 0 ? 1 : -1;
      snapped = movePageBy(dirX, 0);
      schedulePageSnap({ x: dragOffset.x + dirX * 100, y: dragOffset.y });
    } else if (Math.abs(dragOffset.y) >= 30 && Math.abs(dragOffset.y) >= Math.abs(dragOffset.x)) {
      if (!config.lockVerticalSwipe) {
        const dirY = dragOffset.y < 0 ? 1 : -1;
        snapped = movePageBy(0, dirY);
        schedulePageSnap({ x: dragOffset.x, y: dragOffset.y + dirY * 100 });
      }
    }
    if (Math.abs(dragOffset.x) >= 30 && Math.abs(dragOffset.x) >= Math.abs(dragOffset.y)) {
      const dirX = dragOffset.x < 0 ? 1 : -1;
      snapped = movePageBy(dirX, 0);
      schedulePageSnap({ x: dragOffset.x + dirX * 100, y: dragOffset.y });
    } else if (Math.abs(dragOffset.y) >= 30 && Math.abs(dragOffset.y) >= Math.abs(dragOffset.x)) {
      if (!config.lockVerticalSwipe) {
        const dirY = dragOffset.y < 0 ? 1 : -1;
        snapped = movePageBy(0, dirY);
        schedulePageSnap({ x: dragOffset.x, y: dragOffset.y + dirY * 100 });
      }
    }
    if (!snapped) {
      schedulePageSnap({ x: dragOffset.x, y: dragOffset.y });
    }
  } else if (Math.abs(diffX) > swipeThreshold && Math.abs(diffY) < swipePerpTolerance) {
    movePageBy(diffX > 0 ? 1 : -1, 0);
  } else if (Math.abs(diffY) > swipeThreshold && Math.abs(diffX) < swipePerpTolerance) {
    if (!config.lockVerticalSwipe) {
      movePageBy(0, diffY > 0 ? 1 : -1);
    }
  }
  if (isPageDragging) {
    setIsPageDragging(false);
  }
  pageDragAxisRef.current = null;
  touchStartRef.current = null;
};

const renderWidget = (item: WebOSWidgetItem, options?: { isEditingOverride?: boolean }) => {
  const editing = options?.isEditingOverride ?? isEditing;
  const template = widgetTemplates.find((tpl) => tpl.id === item.widgetId);
  const html = item.html ?? template?.html;
  const css = item.css ?? template?.css;
  const js = item.js ?? template?.js;
  const isObsidget = template?.source === 'obsidget';

  if (item.widgetId === 'quick-note') return <QuickNoteWidget api={api} />;
  if (item.widgetId === 'todo') return <TodoWidget api={api} />;
  if (!html && !css && !js && !isObsidget) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
        Widget introuvable
      </div>
    );
  }
  if (isObsidget) {
    return (
      <ObsidgetWidgetRunner
        id={item.id}
        html={html}
        css={css}
        js={js}
        isEditing={editing}
        api={api}
        maxWidth={obsidgetMaxWidth}
      />
    );
  }
  return <WidgetRunner id={item.id} html={html} css={css} js={js} isEditing={editing} />;
};

const renderWindowContent = (win: WebOSWindow) => {
  if (win.kind === 'url' && win.url) {
    return (
      <WebViewWindow
        window={win}
        onNavigate={(url) => {
          setWindows((prev) =>
            prev.map((entry) => {
              if (entry.id !== win.id) return entry;
              const history = entry.history ? [...entry.history] : [];
              const index = entry.historyIndex ?? -1;
              const nextHistory = history.slice(0, Math.max(index + 1, 0));
              if (nextHistory[nextHistory.length - 1] !== url) nextHistory.push(url);
              return {
                ...entry,
                url,
                history: nextHistory,
                historyIndex: nextHistory.length - 1
              };
            })
          );
        }}
        onBack={() => {
          setWindows((prev) =>
            prev.map((entry) => {
              if (entry.id !== win.id) return entry;
              const history = entry.history ?? [];
              const index = entry.historyIndex ?? history.length - 1;
              const nextIndex = Math.max(0, index - 1);
              const nextUrl = history[nextIndex];
              if (!nextUrl) return entry;
              return { ...entry, url: nextUrl, historyIndex: nextIndex };
            })
          );
        }}
        onForward={() => {
          setWindows((prev) =>
            prev.map((entry) => {
              if (entry.id !== win.id) return entry;
              const history = entry.history ?? [];
              const index = entry.historyIndex ?? history.length - 1;
              const nextIndex = Math.min(history.length - 1, index + 1);
              const nextUrl = history[nextIndex];
              if (!nextUrl) return entry;
              return { ...entry, url: nextUrl, historyIndex: nextIndex };
            })
          );
        }}
        onAddWidget={(url) => {
          const { x, y } = findFreeSlot(1, 1);
          const id = `web-${Date.now()}`;
          const newItem: WebOSItem = {
            id,
            type: 'app',
            title: win.title || 'Web',
            icon: '🌐',
            cols: 1,
            rows: 1,
            x,
            y,
            pageIndex: currentPageId,
            dockOrder: items.length,
            bgColor: '#111827',
            url: url || win.url,
            external: false
          };
          setItems((prev) => [...prev, newItem]);
        }}
        onUpdate={(updates) => updateWindow(win.id, updates)}
        barColor={currentTheme.barColor}
      />
    );
  }

  if (win.kind === 'finder') {
    return (
      <FinderView
        api={api}
        onOpenImage={(path) =>
          openWindowForItem({ id: `${path}-img`, title: path, type: 'app' } as WebOSItem, {
            kind: 'image',
            title: path.split('/').pop() || 'Image',
            path
          })
        }
      />
    );
  }

  if (win.kind === 'image' && win.path) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <img src={api.resolveResourcePath(win.path)} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }

  if (win.kind === 'widget' && win.widgetItemId) {
    const item = items.find((entry) => entry.id === win.widgetItemId);
    if (item && item.type === 'widget') {
      return (
        <div className="w-full h-full" data-widget="true">
          {renderWidget(item as WebOSWidgetItem, { isEditingOverride: false })}
        </div>
      );
    }
  }

  return <div className="w-full h-full flex items-center justify-center text-slate-400">Contenu indisponible</div>;
};

const toggleWidgetFullscreen = (item: WebOSWidgetItem) => {
  const existing = windows.find((win) => win.kind === 'widget' && win.widgetItemId === item.id);
  if (existing) {
    setWindows((prev) => prev.filter((win) => win.id !== existing.id));
    setFullscreenWidgetId(null);
    return;
  }

  const newWindow: WebOSWindow = {
    id: `widget-${item.id}`,
    itemId: item.id,
    widgetItemId: item.id,
    title: item.title || 'Widget',
    kind: 'widget',
    x: 80,
    y: 80,
    w: 900,
    h: 650,
    zIndex: zIndexCounter.current + 1,
    isMinimized: false,
    isMaximized: true
  };
  zIndexCounter.current += 1;
  setWindows((prev) => [...prev, newWindow]);
  setFullscreenWidgetId(item.id);
};

const renderItem = (item: WebOSItem) => {
  const icon = resolveIcon(item.icon);
  const isWidget = item.type === 'widget';
  const showIconLabel = !isWidget && (item.cols || 1) === 1 && (item.rows || 1) === 1;
  const isObsidgetWidget =
    isWidget && widgetTemplates.find((tpl) => tpl.id === (item as WebOSWidgetItem).widgetId)?.source === 'obsidget';
  const shouldHideWidgetBg = isObsidgetWidget && config.transparentObsidgetWidgets;

  return (
    <div
      key={item.id}
      id={item.id}
      data-id={item.id}
      data-widget={isWidget ? 'true' : undefined}
      onPointerEnter={() => {
        if (isWidget) isWidgetInteractionRef.current = true;
      }}
      onPointerLeave={() => {
        if (isWidget) isWidgetInteractionRef.current = false;
      }}
      onFocusCapture={() => {
        if (isWidget) isWidgetInteractionRef.current = true;
      }}
      onBlurCapture={(event) => {
        if (!isWidget) return;
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        isWidgetInteractionRef.current = false;
      }}
      onPointerDown={(event) => {
        const hasModifier = event.shiftKey || event.ctrlKey;
        if (!isEditing && isWidget && !hasModifier) return;
        handlePointerDown(event, item);
      }}
      onDoubleClick={(event) => {
        if (!isEditing) return;
        event.stopPropagation();
      }}
      className={`relative group transition-transform duration-200 select-none touch-none
          ${isEditing ? 'cursor-move animate-jiggle' : isWidget ? '' : 'cursor-pointer active:scale-95 hover:scale-105'}
          ${draggingId === item.id ? 'opacity-0' : 'opacity-100'}
        `}
      style={getItemStyle(item)}
    >
      {isWidget && !isEditing && (
        <div className="widget-fullscreen-hotspot">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleWidgetFullscreen(item as WebOSWidgetItem);
            }}
            className="widget-fullscreen-toggle p-1.5 rounded-full bg-black/70 text-white shadow-lg"
            title={fullscreenWidgetId === item.id ? 'Réduire' : 'Agrandir'}
          >
            {fullscreenWidgetId === item.id ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      )}
      {isWidget && shouldHideWidgetBg ? (
        <div className="w-full h-full">
          {renderWidget(item as WebOSWidgetItem)}
        </div>
      ) : (
        <div
          className={`rounded-2xl shadow-lg flex flex-col items-center justify-center overflow-hidden w-full h-full
              ${item.bgColor === 'glass' ? 'bg-white/20 backdrop-blur-md border border-white/20' : ''}
              ${isEditing ? 'border-2 border-white/20' : ''}
            `}
          style={
            item.bgColor !== 'glass'
              ? {
                backgroundColor: item.fullSize ? 'transparent' : item.bgColor,
                border: undefined
              }
                  backgroundColor:item.fullSize ? 'transparent' : item.bgColor,
        border: undefined
                }
      : { }
            }
          >
      {isWidget ? (
        renderWidget(item as WebOSWidgetItem)
      ) : (
        <>
          {showIconLabel ? (
            <div className="w-full h-full flex flex-col items-center justify-between py-2">
              <div className="w-full flex-1 flex items-center justify-center">
                {icon ? (
                  <img
                    src={icon}
                    alt={item.title}
                    className={item.fullSize ? 'w-full h-full object-cover' : 'w-2/3 h-2/3 object-contain'}
                  />
                ) : (
                  item.icon
                )}
              </div>
              <div className="text-[10px] md:text-xs font-medium text-white text-center px-2 truncate w-full pointer-events-none">
                {item.title}
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-1 filter drop-shadow-md w-full h-full flex items-center justify-center">
                {icon ? (
                  <img
                    src={icon}
                    alt={item.title}
                    className={item.fullSize ? 'w-full h-full object-cover' : 'w-2/3 h-2/3 object-contain'}
                  />
                ) : (
                  item.icon
                )}
              </div>
              {(item.rows || 1) > 1 && (
                <div className="text-xs font-bold text-white px-2 text-center pointer-events-none">
                  {item.title}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

{
  isEditing && isWidget && (
    <div
      className="absolute bottom-0 right-0 p-1 cursor-se-resize z-30 opacity-60 hover:opacity-100 bg-black/50 rounded-tl-lg"
      onPointerDown={(event) => {
        event.stopPropagation();
        event.preventDefault();
        setResizeHandle({
          id: item.id,
          startX: event.clientX,
          startY: event.clientY,
          startCols: item.cols || 1,
          startRows: item.rows || 1,
          currentCols: item.cols || 1,
          currentRows: item.rows || 1
        });
      }}
    >
      <Grid size={12} className="text-white rotate-90" />
    </div>
  )
}
      </div >
    );
  };
const SettingsModal = () => {
  if (!showSettings) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setShowSettings(false)}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Paramètres</h3>
          <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSettingsTab('display')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${settingsTab === 'display' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${settingsTab === 'display' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
          >
            Affichage
          </button>
          <button
            onClick={() => setSettingsTab('navigation')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${settingsTab === 'navigation'
              ? 'bg-blue-600 border-blue-500'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
          >
            Navigation
          </button>
        </div>

        {settingsTab === 'navigation' && (
          <div className="space-y-6">
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Sensibilité du swipe</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={15}
                  max={80}
                  step={1}
                  value={config.swipeThreshold ?? 30}
                  onChange={(event) =>
                    setConfig((prev) => ({ ...prev, swipeThreshold: Number(event.target.value) }))
                  }
                  className="w-full"
                />
                <span className="text-xs font-semibold w-10 text-right">{config.swipeThreshold ?? 30}px</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Plus bas = swipe plus sensible.</div>
            </div>

            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  lockVerticalSwipe: !prev.lockVerticalSwipe
                }))
              }
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${config.lockVerticalSwipe
                ? 'bg-blue-600/30 border-blue-500'
                : 'bg-slate-800 border-white/10 hover:bg-white/5'
                }`}
            >
              <span className="text-sm font-medium">Verrouiller swipe vertical</span>
              <span className="text-xs font-bold">{config.lockVerticalSwipe ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}

        {settingsTab === 'display' && (
          <>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Mode d'affichage</label>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, viewMode: 'grid' }))}
                  className={`flex-1 py-2 rounded-md text-sm font-bold transition ${config.viewMode === 'grid' ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5'
                    }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, viewMode: 'desktop' }))}
                  className={`flex-1 py-2 rounded-md text-sm font-bold transition ${config.viewMode === 'desktop' ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5'
                    }`}
                >
                  Bureau
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Mode d'affichage</label>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, viewMode: 'grid' }))}
                  className={`flex-1 py-2 rounded-md text-sm font-bold transition ${config.viewMode === 'grid' ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5'
                    }`}
                >
                  Grille
                </button>
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, viewMode: 'desktop' }))}
                  className={`flex-1 py-2 rounded-md text-sm font-bold transition ${config.viewMode === 'desktop' ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5'
                    }`}
                >
                  Bureau
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Position de la barre</label>
              <div className="grid grid-cols-4 gap-2">
                {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setConfig((prev) => ({ ...prev, barPosition: pos }))}
                    className={`py-2 rounded-lg border capitalize text-sm ${config.barPosition === pos ? 'bg-blue-600 border-blue-500' : 'border-white/10 hover:bg-white/5'
                      }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Position de la barre</label>
              <div className="grid grid-cols-4 gap-2">
                {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setConfig((prev) => ({ ...prev, barPosition: pos }))}
                    className={`py-2 rounded-lg border capitalize text-sm ${config.barPosition === pos ? 'bg-blue-600 border-blue-500' : 'border-white/10 hover:bg-white/5'
                      }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Thème</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setConfig((prev) => ({ ...prev, theme: key as WebOSConfig['theme'] }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${config.theme === key ? 'border-blue-500 bg-white/5' : 'border-white/10 hover:bg-white/5'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full shadow-lg ${theme.bar} border border-white/20 relative`} />
                    <span className="font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Thème</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setConfig((prev) => ({ ...prev, theme: key as WebOSConfig['theme'] }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition text-left ${config.theme === key ? 'border-blue-500 bg-white/5' : 'border-white/10 hover:bg-white/5'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full shadow-lg ${theme.bar} border border-white/20 relative`} />
                    <span className="font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Widgets Obsidg(et)</label>
              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    transparentObsidgetWidgets: !prev.transparentObsidgetWidgets
                  }))
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${config.transparentObsidgetWidgets
                  ? 'bg-blue-600/30 border-blue-500'
                  : 'bg-slate-800 border-white/10 hover:bg-white/5'
                  }`}
              >
                <span className="text-sm font-medium">Fond transparent (par défaut)</span>
                <span className="text-xs font-bold">{config.transparentObsidgetWidgets ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Widget plein écran</label>
              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    fullscreenWidgetTransparent: !prev.fullscreenWidgetTransparent
                  }))
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${config.fullscreenWidgetTransparent
                  ? 'bg-blue-600/30 border-blue-500'
                  : 'bg-slate-800 border-white/10 hover:bg-white/5'
                  }`}
              >
                <span className="text-sm font-medium">Fond transparent (plein écran)</span>
                <span className="text-xs font-bold">{config.fullscreenWidgetTransparent ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Fond d'écran</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {WALLPAPERS.map((url) => (
                  <button
                    key={url}
                    onClick={() => setConfig((prev) => ({ ...prev, wallpaper: url }))}
                    className={`aspect-video rounded-lg bg-cover bg-center border-2 transition ${config.wallpaper === url ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                      }`}
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
              <input
                value={config.wallpaper}
                onChange={(event) => setConfig((prev) => ({ ...prev, wallpaper: event.target.value }))}
                className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-sm focus:border-blue-500 outline-none"
                placeholder="Chemin local ou URL..."
              />
            </div>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Fond d'écran</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {WALLPAPERS.map((url) => (
                  <button
                    key={url}
                    onClick={() => setConfig((prev) => ({ ...prev, wallpaper: url }))}
                    className={`aspect-video rounded-lg bg-cover bg-center border-2 transition ${config.wallpaper === url ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                      }`}
                    style={{ backgroundImage: `url(${url})` }}
                  />
                ))}
              </div>
              <input
                value={config.wallpaper}
                onChange={(event) => setConfig((prev) => ({ ...prev, wallpaper: event.target.value }))}
                className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-sm focus:border-blue-500 outline-none"
                placeholder="Chemin local ou URL..."
              />
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Fond d'écran vidéo</label>
              {vaultVideos.length === 0 ? (
                <div className="text-xs text-slate-500">Aucune vidéo trouvée dans le vault.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {vaultVideos.slice(0, 6).map((path) => (
                    <button
                      key={path}
                      onClick={() => setConfig((prev) => ({ ...prev, wallpaper: path }))}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition ${config.wallpaper === path ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                        }`}
                      title={path}
                    >
                      <video
                        src={api.resolveResourcePath(path)}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    </button>
                  ))}
                </div>
              )}
              <input
                value={config.wallpaper}
                onChange={(event) => setConfig((prev) => ({ ...prev, wallpaper: event.target.value }))}
                className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-sm focus:border-blue-500 outline-none"
                placeholder="Chemin local ou URL vidéo..."
              />
              <div className="text-[11px] text-slate-500 mt-1">Formats conseillés: mp4, webm, mov.</div>
            </div>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Fond d'écran vidéo</label>
              {vaultVideos.length === 0 ? (
                <div className="text-xs text-slate-500">Aucune vidéo trouvée dans le vault.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {vaultVideos.slice(0, 6).map((path) => (
                    <button
                      key={path}
                      onClick={() => setConfig((prev) => ({ ...prev, wallpaper: path }))}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition ${config.wallpaper === path ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                        }`}
                      title={path}
                    >
                      <video
                        src={api.resolveResourcePath(path)}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        autoPlay
                      />
                    </button>
                  ))}
                </div>
              )}
              <input
                value={config.wallpaper}
                onChange={(event) => setConfig((prev) => ({ ...prev, wallpaper: event.target.value }))}
                className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-sm focus:border-blue-500 outline-none"
                placeholder="Chemin local ou URL vidéo..."
              />
              <div className="text-[11px] text-slate-500 mt-1">Formats conseillés: mp4, webm, mov.</div>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Fond du vault</label>
              {vaultWallpapers.length === 0 ? (
                <div className="text-xs text-slate-500">Aucune image trouvée dans le vault.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {vaultWallpapers.slice(0, 12).map((path) => (
                    <button
                      key={path}
                      onClick={() => setConfig((prev) => ({ ...prev, wallpaper: path }))}
                      className={`aspect-video rounded-lg bg-cover bg-center border-2 transition ${config.wallpaper === path ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                        }`}
                      style={{ backgroundImage: `url(${api.resolveResourcePath(path)})` }}
                      title={path}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Fond du vault</label>
              {vaultWallpapers.length === 0 ? (
                <div className="text-xs text-slate-500">Aucune image trouvée dans le vault.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {vaultWallpapers.slice(0, 12).map((path) => (
                    <button
                      key={path}
                      onClick={() => setConfig((prev) => ({ ...prev, wallpaper: path }))}
                      className={`aspect-video rounded-lg bg-cover bg-center border-2 transition ${config.wallpaper === path ? 'border-blue-500 scale-105' : 'border-transparent hover:border-white/50'
                        }`}
                      style={{ backgroundImage: `url(${api.resolveResourcePath(path)})` }}
                      title={path}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-bold">
                Fermer
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowSettings(false)} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-bold">
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const WidgetGallery = () => {
  if (!showWidgetGallery) return null;
  const allEntries: Array<
    | { kind: 'template'; template: WebOSWidgetTemplate }
    | { kind: 'item'; item: WebOSWidgetItem }
  > = [
      ...builtInTemplates.map((template) => ({ kind: 'template' as const, template })),
      ...osExtraItems.map((item) => ({ kind: 'item' as const, item })),
      ...obsidgetTemplates.map((template) => ({ kind: 'template' as const, template }))
    ];
        ...builtInTemplates.map((template) => ({ kind: 'template' as const, template })),
        ...osExtraItems.map((item) => ({ kind: 'item' as const, item })),
        ...obsidgetTemplates.map((template) => ({ kind: 'template' as const, template }))
      ];

const osEntries: Array<
  | { kind: 'template'; template: WebOSWidgetTemplate }
  | { kind: 'item'; item: WebOSWidgetItem }
> = [
    ...builtInTemplates.map((template) => ({ kind: 'template' as const, template })),
    ...osExtraItems.map((item) => ({ kind: 'item' as const, item }))
  ];
        ...builtInTemplates.map((template) => ({ kind: 'template' as const, template })),
        ...osExtraItems.map((item) => ({ kind: 'item' as const, item }))
      ];

const galleryEntries =
  widgetGalleryTab === 'os'
    ? osEntries
    : widgetGalleryTab === 'obsidget'
      ? obsidgetTemplates.map((template) => ({ kind: 'template' as const, template }))
      : allEntries;

return (
  <div
    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={() => setShowWidgetGallery(false)}
  >
    <div
      className="bg-slate-900 text-white w-full max-w-4xl p-6 rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Galerie de Widgets</h3>
        <button onClick={() => setShowWidgetGallery(false)} className="p-2 hover:bg-white/10 rounded-full">
          <X size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setWidgetGalleryTab('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${widgetGalleryTab === 'all' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${widgetGalleryTab === 'all' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
        >
          Tout
        </button>
        <button
          onClick={() => setWidgetGalleryTab('os')}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${widgetGalleryTab === 'os' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${widgetGalleryTab === 'os' ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
        >
          OS
        </button>
        {obsidgetTemplates.length > 0 && (
          <button
            onClick={() => setWidgetGalleryTab('obsidget')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${widgetGalleryTab === 'obsidget'
              ? 'bg-blue-600 border-blue-500'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
          >
            Obsidget
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryEntries.map((entry) => {
          const isTemplate = entry.kind === 'template';
          const template = isTemplate ? entry.template : undefined;
          const item = !isTemplate ? entry.item : undefined;
          const title = template?.title ?? item?.title ?? 'Widget';
          const cols = template?.cols ?? item?.cols ?? 1;
          const rows = template?.rows ?? item?.rows ?? 1;
          const bgColor = template?.bgColor ?? item?.bgColor ?? '#334155';
          const html = template?.html ?? item?.html ?? '<div class="text-xs text-white/60">Widget</div>';

          return (
            <div
              key={isTemplate ? `tpl-${template?.id}` : `item-${item?.id}`}
              className="bg-slate-800 rounded-xl p-4 border border-white/5 hover:border-blue-500/50 transition"
            >
              <div className="h-32 mb-4 rounded-lg overflow-hidden relative bg-slate-900/50 flex items-center justify-center">
                <div
                  className="scale-50 origin-center w-[200%] h-[200%] flex items-center justify-center pointer-events-none"
                  style={{ backgroundColor: bgColor === 'glass' ? 'transparent' : bgColor }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                {bgColor === 'glass' && <div className="absolute inset-0 bg-white/10 backdrop-blur-md -z-10" />}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">{title}</div>
                  <div className="text-xs text-slate-400">
                    {cols}x{rows}
                  </div>
                </div>
                <button
                  onClick={() => (isTemplate && template ? addWidget(template) : item ? addWidgetFromItem(item) : null)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Ajouter
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
  };

const PagesModal = () => {
  const [atlasFocus, setAtlasFocus] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const baseRows = 10;
  const miniCols = 6;
  const miniRows = 4;
  const rootCoord = getPageCoord(0);
  const relPages = pages.map((pageId) => {
    const coord = getPageCoord(pageId);
    return { id: pageId, dx: coord.x - rootCoord.x, dy: coord.y - rootCoord.y, coord };
  });
  let extentX = 0;
  let extentY = 0;
  relPages.forEach((entry) => {
    extentX = Math.max(extentX, Math.abs(entry.dx));
    extentY = Math.max(extentY, Math.abs(entry.dy));
  });
  const mapCols = extentX * 2 + 1;
  const mapRows = extentY * 2 + 1;
  const mapGap = 14;
  const baseCardWidth = 210;
  const baseCardHeight = 160;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const panelWidth = viewportWidth;
  const panelHeight = viewportHeight;
  const headerHeight = 0;
  const availableWidth = panelWidth - 48;
  const availableHeight = panelHeight - headerHeight - 48;
  const naturalGridWidth = mapCols * baseCardWidth + (mapCols - 1) * mapGap;
  const naturalGridHeight = mapRows * baseCardHeight + (mapRows - 1) * mapGap;
  const gridScale = Math.min(1, availableWidth / naturalGridWidth, availableHeight / naturalGridHeight);

  const pageByRel = new Map<string, { id: number; coord: { x: number; y: number } }>();
  relPages.forEach((entry) => pageByRel.set(`${entry.dx},${entry.dy}`, { id: entry.id, coord: entry.coord }));

  const closeModal = () => {
    setShowPages(false);
    setIsPagesEditMode(false);
    pageDragIdRef.current = null;
  };
  const goToPage = (pageId: number) => {
    setCurrentPageId(pageId);
    closeModal();
  };
  const swapPageCoords = (sourceId: number, targetId: number) => {
    if (sourceId === 0 || targetId === 0) return;
    setConfig((prev) => {
      const coords = { ...(prev.pageCoords ?? {}) };
      const source = coords[sourceId] ?? { x: 0, y: 0 };
      const target = coords[targetId] ?? { x: 0, y: 0 };
      coords[sourceId] = { x: target.x, y: target.y };
      coords[targetId] = { x: source.x, y: source.y };
      return { ...prev, pageCoords: coords };
    });
  };
  const movePageToCoord = (pageId: number, coord: { x: number; y: number }) => {
    if (pageId === 0) return;
    setConfig((prev) => ({
      ...prev,
      pageCoords: { ...(prev.pageCoords ?? {}), [pageId]: { x: coord.x, y: coord.y } }
    }));
  };
  const usedCoords = new Set<string>();
  pages.forEach((pageId) => {
    const coord = getPageCoord(pageId);
    usedCoords.add(`${coord.x},${coord.y}`);
  });
  const findNearestEmptyCoord = (origin: { x: number; y: number }) => {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ];
    for (let r = 1; r < 6; r += 1) {
      for (const [dx, dy] of directions) {
        const coord = { x: origin.x + dx * r, y: origin.y + dy * r };
        if (!usedCoords.has(`${coord.x},${coord.y}`)) return coord;
      }
    }
    return { x: origin.x + 1, y: origin.y };
  };

  const cells: Array<{ dx: number; dy: number; pageId?: number; coord: { x: number; y: number } }> = [];
  for (let y = -extentY; y <= extentY; y += 1) {
    for (let x = -extentX; x <= extentX; x += 1) {
      const entry = pageByRel.get(`${x},${y}`);
      const coord = entry?.coord ?? { x: rootCoord.x + x, y: rootCoord.y + y };
      cells.push({ dx: x, dy: y, pageId: entry?.id, coord });
    }
  }

  useEffect(() => {
    if (!showPages) return;
    const current = getPageCoord(currentPageId);
    setAtlasFocus({ dx: current.x - rootCoord.x, dy: current.y - rootCoord.y });
  }, [showPages, currentPageId, getPageCoord, rootCoord.x, rootCoord.y]);

  useEffect(() => {
    if (!showPages) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'Tab') {
        event.preventDefault();
        const entry = pageByRel.get(`${atlasFocus.dx},${atlasFocus.dy}`);
        if (entry) goToPage(entry.id);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const entry = pageByRel.get(`${atlasFocus.dx},${atlasFocus.dy}`);
        if (entry) goToPage(entry.id);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setAtlasFocus((prev) => ({ dx: Math.max(-extentX, prev.dx - 1), dy: prev.dy }));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setAtlasFocus((prev) => ({ dx: Math.min(extentX, prev.dx + 1), dy: prev.dy }));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAtlasFocus((prev) => ({ dx: prev.dx, dy: Math.max(-extentY, prev.dy - 1) }));
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAtlasFocus((prev) => ({ dx: prev.dx, dy: Math.min(extentY, prev.dy + 1) }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPages, atlasFocus.dx, atlasFocus.dy, extentX, extentY, pageByRel, closeModal, goToPage]);

  if (!showPages) return null;

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/10 backdrop-blur-[2px]"
      onClick={closeModal}
    >
      <div className="absolute inset-0 flex items-center justify-center p-6" onClick={(event) => event.stopPropagation()}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${mapCols}, ${baseCardWidth}px)`,
            gridAutoRows: `${baseCardHeight}px`,
            gap: `${mapGap}px`,
            transform: `scale(${gridScale})`,
            transformOrigin: 'top left'
          }}
        >
          {cells.map((cell) => {
            const pageId = cell.pageId;
            const isEmpty = pageId === undefined;
            const isActive = pageId === currentPageId;
            const pageName = pageId !== undefined ? config.pageNames?.[pageId] ?? '' : '';
            const itemsInPage = pageId !== undefined ? items.filter((item) => (item.pageIndex ?? 0) === pageId) : [];
            const isHome = pageId === 0;
            const isFocused = atlasFocus.dx === cell.dx && atlasFocus.dy === cell.dy;
            return (
              <div
                key={`${cell.dx},${cell.dy}`}
                draggable={!!pageId && isPagesEditMode && pageId !== 0}
                onDragStart={(event) => {
                  if (!isPagesEditMode || !pageId || pageId === 0) return;
                  pageDragIdRef.current = pageId;
                  event.dataTransfer.setData('text/plain', String(pageId));
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (!isPagesEditMode) return;
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!isPagesEditMode) return;
                  event.preventDefault();
                  const sourceId = pageDragIdRef.current ?? Number(event.dataTransfer.getData('text/plain'));
                  if (!sourceId || sourceId === pageId || sourceId === 0) return;
                  if (pageId) {
                    swapPageCoords(sourceId, pageId);
                  } else {
                    movePageToCoord(sourceId, cell.coord);
                  }
                }}
                onDragEnd={() => {
                  pageDragIdRef.current = null;
                }}
                onClick={() => {
                  if (pageId === undefined) return;
                  if (pageId === 0) {
                    goToPage(0);
                    return;
                  }
                  if (isPagesEditMode) return;
                  goToPage(pageId);
                }}
                className={`relative rounded-2xl border transition cursor-pointer ${isEmpty
                  ? isPagesEditMode
                    ? 'border-dashed border-white/20 bg-white/5'
                    : 'border-white/5 bg-white/5'
                  : isActive
                    ? 'border-blue-500 shadow-lg shadow-blue-500/30 bg-slate-800/80'
                    : 'border-white/10 bg-slate-800/60 hover:border-white/30'
                  } ${isFocused ? 'ring-2 ring-white/60' : ''}`}
              >
                {pageId !== undefined ? (
                  <div className="h-full p-3 flex flex-col">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {cell.coord.x},{cell.coord.y}
                      </span>
                      {isHome && <span className="text-yellow-300">HOME</span>}
                    </div>
                    <div className="flex-1 mt-2 rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
                      <div
                        className="w-full h-full grid gap-1 p-2"
                        style={{
                          gridTemplateColumns: `repeat(${miniCols}, minmax(0, 1fr))`,
                          gridTemplateRows: `repeat(${miniRows}, minmax(0, 1fr))`
                        }}
                      >
                        {itemsInPage.map((item) => {
                          if (!item.x || !item.y) return null;
                          const miniX = Math.max(1, Math.min(miniCols, Math.round((item.x / gridCols) * miniCols)));
                          const miniY = Math.max(1, Math.min(miniRows, Math.round((item.y / baseRows) * miniRows)));
                          const miniW = Math.max(1, Math.min(miniCols, Math.round(((item.cols || 1) / gridCols) * miniCols)));
                          const miniH = Math.max(1, Math.min(miniRows, Math.round(((item.rows || 1) / baseRows) * miniRows)));
                          return (
                            <div
                              key={item.id}
                              className="rounded-sm opacity-80"
                              style={{
                                gridColumnStart: miniX,
                                gridColumnEnd: `span ${miniW}`,
                                gridRowStart: miniY,
                                gridRowEnd: `span ${miniH}`,
                                backgroundColor: item.bgColor || '#334155'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-2">
                      {isPagesEditMode ? (
                        <input
                          value={pageName}
                          onChange={(event) =>
                            setConfig((prev) => ({
                              ...prev,
                              pageNames: { ...(prev.pageNames ?? {}), [pageId]: event.target.value }
                            }))
                          }
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                          placeholder={`Page ${pageId}`}
                          className="w-full bg-slate-900/70 border border-white/10 rounded-lg px-2 py-1 text-xs"
                        />
                      ) : (
                        <div className="text-xs font-semibold text-white truncate">
                          {pageName && pageName.trim() ? pageName : `Page ${pageId}`}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                    {isPagesEditMode ? 'Déposer ici' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          setIsPagesEditMode((prev) => !prev);
        }}
        className={`fixed top-4 right-4 px-3 py-1 rounded-full text-[10px] font-semibold border transition backdrop-blur ${isPagesEditMode ? 'bg-blue-600/70 border-blue-500 text-white' : 'bg-white/10 border-white/10 text-white/80'
          }`}
        className={`fixed top-4 right-4 px-3 py-1 rounded-full text-[10px] font-semibold border transition backdrop-blur ${isPagesEditMode ? 'bg-blue-600/70 border-blue-500 text-white' : 'bg-white/10 border-white/10 text-white/80'
          }`}
      >
        {isPagesEditMode ? 'Terminer' : 'Edit'}
      </button>
    </div>
  );
};

const pageTranslate = {
  x: -(currentPageCoord.x * 100) + (isPageDragging ? pageDragOffset.x : pageSnapOffset.x),
  y: -(currentPageCoord.y * 100) + (isPageDragging ? pageDragOffset.y : pageSnapOffset.y)
};
const pageDotMeta = useMemo(() => {
  const root = getPageCoord(0);
  const rels = pages.map((pageId) => {
    const coord = getPageCoord(pageId);
    return { id: pageId, dx: coord.x - root.x, dy: coord.y - root.y };
  });
  let extentX = 0;
  let extentY = 0;
  rels.forEach((entry) => {
    extentX = Math.max(extentX, Math.abs(entry.dx));
    extentY = Math.max(extentY, Math.abs(entry.dy));
  });
  const cols = extentX * 2 + 1;
  const rows = extentY * 2 + 1;
  const map = new Map<string, number>();
  rels.forEach((entry) => {
    map.set(`${entry.dx},${entry.dy}`, entry.id);
  });
  return { root, extentX, extentY, cols, rows, map };
}, [pages, getPageCoord]);
const pageDotCols = Math.max(1, pageDotMeta.cols);
const pageDotRows = Math.max(1, pageDotMeta.rows);
const dotBase = Math.max(pageDotCols, pageDotRows);
const dotSize = Math.max(4, Math.min(8, Math.floor(64 / dotBase)));
const dotGap = Math.max(3, Math.min(6, Math.floor(dotSize * 0.9)));
const dotGridWidth = pageDotCols * dotSize + (pageDotCols - 1) * dotGap;
const dotGridHeight = pageDotRows * dotSize + (pageDotRows - 1) * dotGap;
const swipeThreshold = Math.max(10, Math.min(120, config.swipeThreshold ?? 30));
const swipePerpTolerance = Math.max(10, Math.round(swipeThreshold * 0.8));
const edgePadding = 16;
const topInset = (config.barPosition === 'top' ? barSize + edgePadding : edgePadding) + paneHeaderHeight;
const bottomInset = config.barPosition === 'bottom' ? barSize + edgePadding : edgePadding;

return (
  <div
    className={`webos-root relative w-full h-full overflow-hidden select-none ${currentTheme.text}`}
    ref={rootRef}
    style={{ backgroundColor: '#0b0b0b' }}
    onPointerDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (isPageNavBlocked || isWidgetInteractionRef.current) return;
      pointerDownPos.current = { x: event.clientX, y: event.clientY };
      pageCreationBudgetRef.current = 1;
      setPageSnapOffset({ x: 0, y: 0 });
      if (pageSnapRafRef.current) {
        window.cancelAnimationFrame(pageSnapRafRef.current);
        pageSnapRafRef.current = null;
      }
      pageDragAxisRef.current = null;
      backgroundDragRef.current = { x: event.clientX, y: event.clientY };
      backgroundDragActiveRef.current = true;
      setIsPageDragging(false);
      setPageDragOffsetRaf({ x: 0, y: 0 });
      if (backgroundLongPressTimer.current) window.clearTimeout(backgroundLongPressTimer.current);
      if (!isEditing) {
        backgroundLongPressTimer.current = window.setTimeout(() => {
          setIsEditing(true);
        }, 3000);
      }
    }}
    onPointerMove={handlePointerMove}
    onPointerUp={(event) => {
      if (backgroundLongPressTimer.current) {
        window.clearTimeout(backgroundLongPressTimer.current);
        backgroundLongPressTimer.current = null;
      }
      if (event.target === event.currentTarget && isEditing) {
        setIsEditing(false);
      }
      handlePointerUp(event);
    }}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
    onContextMenu={(event) => {
      if (event.target instanceof Element && event.target.closest('[data-widget]')) return;
      event.preventDefault();
    }}
  >
    {isVideoWallpaper ? (
      <video
        src={wallpaperSrc}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        onError={() => setWallpaperSrc(api.resolveResourcePath(DEFAULT_CONFIG.wallpaper))}
      />
    ) : (
      <img
        src={wallpaperSrc}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        onError={() => setWallpaperSrc(api.resolveResourcePath(DEFAULT_CONFIG.wallpaper))}
      />
    )}
    <div className="absolute inset-0 bg-black/10" />

    <div
      className={`absolute overflow-hidden ${config.barPosition === 'left'
        ? 'pl-20 pr-4 py-4'
        : config.barPosition === 'right'
          ? 'pr-20 pl-4 py-4'
          : 'px-4'
        }`}
      style={{
        top: topInset,
        bottom: bottomInset,
        left: 0,
        right: 0
      }}
    >
      {isEditing && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)',
            backgroundSize: `calc((100% - ${gridCols - 1} * 16px) / ${gridCols} + 16px) calc(${gridRowHeight}px + 24px)`
          }}
        />
      )}
      <div
        className="absolute inset-0 gpu-layer"
        style={{
          transform: isMobile
            ? `translate(${pageTranslate.x}%, ${pageTranslate.y}%)`
            : `translate3d(${pageTranslate.x}%, ${pageTranslate.y}%, 0)`,
          transition: isPageDragging && pageSnapOffset.x === 0 && pageSnapOffset.y === 0
            ? 'none'
            : isMobile
              ? 'transform 0.4s ease-out'
              : 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        {pages.map((pageIdx) => {
          const coord = getPageCoord(pageIdx);
          return (
            <div
              key={pageIdx}
              className="absolute inset-0"
              style={{ transform: `translate3d(${coord.x * 100}%, ${coord.y * 100}%, 0)` }}
            >
              <div
                ref={pageIdx === currentPageId ? gridRef : null}
                className="grid gap-x-4 gap-y-6 max-w-7xl mx-auto"
                style={{
                  display: 'grid', // Force grid display
                  gridAutoRows: `${gridRowHeight}px`,
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                }}
              >
                {items
                  .filter((item) => (item.pageIndex ?? 0) === pageIdx)
                  .filter((item) => (config.viewMode === 'desktop' ? item.type !== 'app' : true))
                  .filter(
                    (item) =>
                      !(
                        item.type === 'widget' &&
                        (openWidgetIds.has(item.id) || item.id === fullscreenWidgetId)
                      )
                  )
                  .map((item) => renderItem(item))}

                {dragPlaceholder && pageIdx === currentPageId && (
                  <div
                    className="rounded-2xl bg-white/20 border-2 border-white/50 border-dashed transition-all duration-100"
                    style={{
                      gridColumnStart: dragPlaceholder.x,
                      gridColumnEnd: `span ${dragPlaceholder.w}`,
                      gridRowStart: dragPlaceholder.y,
                      gridRowEnd: `span ${dragPlaceholder.h}`,
                      zIndex: 0
                    }}
                  />
                )}

                {isEditing && pageIdx === currentPageId && (
                  <div className="flex gap-2" style={{ height: gridRowHeight }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {config.viewMode === 'desktop' && dockItems.length > 0 && (
      <div
        className={`absolute left-1/2 -translate-x-1/2 max-w-[95%] w-auto z-40 ${config.barPosition === 'bottom' ? 'bottom-16' : 'bottom-4'
          }`}
        className={`absolute left-1/2 -translate-x-1/2 max-w-[95%] w-auto z-40 ${config.barPosition === 'bottom' ? 'bottom-16' : 'bottom-4'
          }`}
      >
        <Dock items={dockItems} openItemIds={openDockIds} themeClass={currentTheme.dock} onLaunch={launchItem} resolveIcon={resolveIcon} />
      </div>
    )}

    {windows.map((win) => (
      <WindowFrame
        key={win.id}
        window={win}
        barPosition={config.barPosition}
        barSize={barSize}
        onClose={closeWindow}
        onMinimize={minimizeWindow}
        onMaximize={maximizeWindow}
        onFocus={focusWindow}
        onUpdate={updateWindow}
        barColor={currentTheme.barColor}
        widgetTransparent={config.fullscreenWidgetTransparent}
      >
        {renderWindowContent(win)}
      </WindowFrame>
    ))}

    <div
      className={`absolute left-0 right-0 flex justify-center pointer-events-none z-30 transition-opacity duration-300 ${showPageDots ? 'opacity-100' : 'opacity-0'
        }`}
      className={`absolute left-0 right-0 flex justify-center pointer-events-none z-30 transition-opacity duration-300 ${showPageDots ? 'opacity-100' : 'opacity-0'
        }`}
      style={config.barPosition === 'bottom' ? { top: topInset } : { bottom: bottomInset }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${pageDotCols}, ${dotSize}px)`,
          gridTemplateRows: `repeat(${pageDotRows}, ${dotSize}px)`,
          gap: `${dotGap}px`,
          width: `${dotGridWidth}px`,
          height: `${dotGridHeight}px`
        }}
      >
        {Array.from({ length: pageDotMeta.rows }).map((_, rowIndex) =>
          Array.from({ length: pageDotMeta.cols }).map((__, colIndex) => {
            const dx = colIndex - pageDotMeta.extentX;
            const dy = rowIndex - pageDotMeta.extentY;
            const pageId = pageDotMeta.map.get(`${dx},${dy}`);
            const isMain = pageId === 0;
            const isCurrent = pageId === currentPageId;
            const isEmpty = pageId === undefined;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`rounded-full transition-all ${isCurrent
                  ? 'bg-white scale-125'
                  : isMain
                    ? 'bg-white/70'
                    : isEmpty
                      ? 'bg-white/15'
                      : 'bg-white/35'
                  }`}
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`
                }}
              />
            );
          })
        )}
      </div>
    </div>

    <Taskbar
      config={config}
      theme={{ bar: currentTheme.bar }}
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing((prev) => !prev)}
      onToggleView={() => setConfig((prev) => ({ ...prev, viewMode: prev.viewMode === 'desktop' ? 'grid' : 'desktop' }))}
      onOpenSettings={() => setShowSettings(true)}
      onOpenWidgetGallery={() => setShowWidgetGallery(true)}
      onHeightChange={(height) =>
        setBarSize((prev) => (prev === height ? prev : height))
      }
      openWindows={windows.map((win) => ({ id: win.id, title: win.title, isMinimized: win.isMinimized }))}
      onFocusWindow={(id) => {
        const target = windows.find((win) => win.id === id);
        if (!target) return;
        if (!target.isMinimized && activeWindowId === id) {
          minimizeWindow(id);
          return;
        }
        if (target.isMinimized) minimizeWindow(id);
        focusWindow(id);
      }}
      onOpenPages={() => setShowPages(true)}
      currentPageLabel={currentPageLabel}
      showTrash={isEditing}
      trashRef={trashRef}
    />

    <SettingsModal />
    <WidgetGallery />
    <PagesModal />

    {draggingId && dragItemRef.current && (
      <div
        className="fixed z-[100] pointer-events-none opacity-80 shadow-2xl rounded-2xl overflow-hidden scale-110"
        style={{ left: dragPos.x - dragOffset.x, top: dragPos.y - dragOffset.y, width: 80, height: 80 }}
      >
        <div
          className="w-full h-full flex items-center justify-center text-4xl text-white"
          style={{ backgroundColor: dragItemRef.current.bgColor || '#334155' }}
        >
          {dragItemRef.current.icon}
        </div>
      </div>
    )}
  </div>
);
};