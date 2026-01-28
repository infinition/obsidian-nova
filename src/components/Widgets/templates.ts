import type { WebOSWidgetTemplate } from '../../types';

export const WIDGET_TEMPLATES: WebOSWidgetTemplate[] = [
  {
    id: 'clock',
    title: 'Horloge',
    cols: 2,
    rows: 1,
    bgColor: '#334155',
    kind: 'runner',
    html: `<div id="clock" class="flex flex-col items-center justify-center h-full text-white font-mono">
      <div class="text-4xl font-bold" id="time">00:00</div>
      <div class="text-sm opacity-70" id="date">...</div>
    </div>`,
    css: `#clock { font-family: 'Courier New', monospace; }`,
    js: `const update = () => {
      const now = new Date();
      container.querySelector('#time').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      container.querySelector('#date').innerText = now.toLocaleDateString();
    };
    update();
    const interval = setInterval(update, 1000);
    container._cleanup = () => clearInterval(interval);`
  },
  {
    id: 'quick-note',
    title: 'Note rapide',
    cols: 2,
    rows: 2,
    bgColor: '#fef08a',
    kind: 'react'
  },
  {
    id: 'weather',
    title: 'Meteo',
    cols: 2,
    rows: 1,
    bgColor: 'glass',
    kind: 'runner',
    html: `<div class="flex items-center justify-between px-4 h-full text-white">
      <div class="flex flex-col">
        <span class="text-2xl font-bold">22C</span>
        <span class="text-xs opacity-80">Paris</span>
      </div>
      <div class="text-4xl">WX</div>
    </div>`
  },
  {
    id: 'calendar',
    title: 'Calendrier',
    cols: 2,
    rows: 2,
    bgColor: '#ffffff',
    kind: 'runner',
    html: `<div class="h-full flex flex-col p-2 text-slate-800">
      <div class="text-center font-bold text-red-500 uppercase text-xs mb-1" id="month">Month</div>
      <div class="text-center text-4xl font-bold flex-1 flex items-center justify-center" id="day">1</div>
      <div class="text-center text-xs opacity-50" id="weekday">Day</div>
    </div>`,
    js: `const now = new Date();
    container.querySelector('#month').innerText = now.toLocaleString('default', { month: 'long' });
    container.querySelector('#day').innerText = now.getDate();
    container.querySelector('#weekday').innerText = now.toLocaleString('default', { weekday: 'long' });`
  },
  {
    id: 'calculator',
    title: 'Calculatrice',
    cols: 2,
    rows: 2,
    bgColor: '#1f2937',
    kind: 'runner',
    html: `<div class="grid grid-cols-4 gap-1 h-full p-1">
      <div id="disp" class="col-span-4 bg-gray-900 text-white flex items-center justify-end px-2 rounded mb-1 text-xl">0</div>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">7</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">8</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">9</button>
      <button class="bg-orange-500 text-white rounded">+</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">4</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">5</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">6</button>
      <button class="bg-orange-500 text-white rounded">-</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">1</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">2</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600">3</button>
      <button class="bg-blue-500 text-white rounded row-span-2">=</button>
      <button class="bg-gray-700 text-white rounded hover:bg-gray-600 col-span-2">0</button>
      <button class="bg-red-500 text-white rounded">C</button>
    </div>`,
    css: `button { transition: background 0.1s; } button:active { transform: scale(0.95); }`,
    js: `const d = container.querySelector('#disp');
    let c = '';
    container.querySelectorAll('button').forEach(b => {
      const t = b.innerText;
      if(t === '=') b.onclick = () => { try { c = String(eval(c)); d.innerText = c; } catch { d.innerText = 'Err'; c=''; } };
      else if(t === 'C') b.onclick = () => { c = ''; d.innerText = '0'; };
      else b.onclick = () => { c += t; d.innerText = c; };
    });`
  },
  {
    id: 'todo',
    title: 'To-Do',
    cols: 2,
    rows: 2,
    bgColor: '#ffffff',
    kind: 'react'
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro',
    cols: 2,
    rows: 2,
    bgColor: '#e11d48',
    kind: 'runner',
    html: `<div class="flex flex-col items-center justify-center h-full text-white">
      <div class="text-4xl font-mono font-bold mb-2" id="timer">25:00</div>
      <div class="flex gap-2">
        <button id="start" class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-red-600 transition">></button>
        <button id="reset" class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center hover:bg-white hover:text-red-600 transition">R</button>
      </div>
    </div>`,
    js: `let time = 1500; let int = null;
    const disp = container.querySelector('#timer');
    const update = () => {
      const minutes = Math.floor(time / 60).toString().padStart(2,'0');
      const seconds = (time % 60).toString().padStart(2,'0');
      disp.innerText = minutes + ':' + seconds;
    };
    container.querySelector('#start').onclick = () => {
      if(int) { clearInterval(int); int=null; }
      else { int = setInterval(() => { if(time>0) { time--; update(); } else { clearInterval(int); alert('Fini!'); } }, 1000); }
    };
    container.querySelector('#reset').onclick = () => { clearInterval(int); int=null; time=1500; update(); };
    container._cleanup = () => clearInterval(int);`
  },
  {
    id: 'breath',
    title: 'Respire',
    cols: 2,
    rows: 2,
    bgColor: '#8b5cf6',
    kind: 'runner',
    html: `<div class="flex flex-col items-center justify-center h-full text-white relative overflow-hidden">
      <div class="circle absolute bg-white/20 rounded-full"></div>
      <div class="text-lg font-bold z-10 animate-pulse">Inhale... Exhale</div>
    </div>`,
    css: `.circle { width: 50px; height: 50px; animation: breathe 4s infinite ease-in-out; }
    @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(3); } }`
  },
  {
    id: 'game-2048',
    title: '2048',
    cols: 2,
    rows: 2,
    bgColor: '#0f172a',
    kind: 'runner',
    html: `<div class="g2048">
      <div class="g2048-head">
        <div class="g2048-title">2048</div>
        <div id="g2048-score" class="g2048-score">0</div>
        <button id="g2048-new" class="g2048-new">Nouveau</button>
      </div>
      <div id="g2048-grid" class="g2048-grid"></div>
      <div id="g2048-msg" class="g2048-msg">Utilise les fleches</div>
    </div>`,
    css: `.g2048 { height: 100%; padding: 10px; color: #e2e8f0; border-radius: 14px; background: radial-gradient(circle at top, rgba(251,191,36,0.15), transparent 60%), linear-gradient(135deg, #0f172a, #111827 60%); border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 6px; }
.g2048-head { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; align-items: center; }
.g2048-title { font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; color: #fde68a; font-weight: 800; }
.g2048-score { font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 999px; }
.g2048-new { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 2px 8px; border-radius: 999px; cursor: pointer; }
.g2048-grid { flex: 1; background: rgba(15,23,42,0.6); border-radius: 10px; padding: 6px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 6px; }
.g2048-tile { border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: #0f172a; background: rgba(255,255,255,0.08); transition: transform 0.15s, background 0.2s; }
.g2048-tile[data-val="0"] { background: rgba(255,255,255,0.05); color: transparent; }
.g2048-tile[data-val="2"] { background: #fef3c7; }
.g2048-tile[data-val="4"] { background: #fde68a; }
.g2048-tile[data-val="8"] { background: #fdba74; }
.g2048-tile[data-val="16"] { background: #fb923c; color: #fff; }
.g2048-tile[data-val="32"] { background: #f97316; color: #fff; }
.g2048-tile[data-val="64"] { background: #ea580c; color: #fff; }
.g2048-tile[data-val="128"] { background: #facc15; }
.g2048-tile[data-val="256"] { background: #eab308; }
.g2048-tile[data-val="512"] { background: #84cc16; color: #0f172a; }
.g2048-tile[data-val="1024"] { background: #22c55e; color: #0f172a; }
.g2048-tile[data-val="2048"] { background: #38bdf8; color: #0f172a; }
.g2048-msg { font-size: 10px; text-align: center; color: #cbd5f5; }`,
    js: `const gridEl = container.querySelector('#g2048-grid');
const scoreEl = container.querySelector('#g2048-score');
const msgEl = container.querySelector('#g2048-msg');
const newBtn = container.querySelector('#g2048-new');
const root = container.querySelector('.g2048');
const size = 4;
let grid = Array.from({ length: size }, () => Array(size).fill(0));
let score = 0;
let locked = false;

const setMsg = (text) => { if (msgEl) msgEl.innerText = text; };
const setScore = (val) => { if (scoreEl) scoreEl.innerText = String(val); };

const addRandom = () => {
  const empties = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) empties.push([r, c]);
    }
  }
  if (empties.length === 0) return false;
  const pick = empties[Math.floor(Math.random() * empties.length)];
  grid[pick[0]][pick[1]] = Math.random() < 0.9 ? 2 : 4;
  return true;
};

const slideLine = (line) => {
  const arr = line.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      gained += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < size) arr.push(0);
  const changed = arr.some((v, i) => v !== line[i]);
  return { line: arr, gained, changed };
};

const move = (dir) => {
  if (locked) return;
  let moved = false;
  let gained = 0;
  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < size; r++) {
      const original = grid[r].slice();
      const line = dir === 'left' ? original : original.slice().reverse();
      const result = slideLine(line);
      const next = dir === 'left' ? result.line : result.line.slice().reverse();
      grid[r] = next;
      moved = moved || result.changed;
      gained += result.gained;
    }
  } else {
    for (let c = 0; c < size; c++) {
      const original = grid.map((row) => row[c]);
      const line = dir === 'up' ? original : original.slice().reverse();
      const result = slideLine(line);
      const next = dir === 'up' ? result.line : result.line.slice().reverse();
      for (let r = 0; r < size; r++) grid[r][c] = next[r];
      moved = moved || result.changed;
      gained += result.gained;
    }
  }
  if (moved) {
    score += gained;
    setScore(score);
    addRandom();
    render();
    checkState();
  }
};

const hasMoves = () => {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) return true;
      if (r < size - 1 && grid[r][c] === grid[r + 1][c]) return true;
      if (c < size - 1 && grid[r][c] === grid[r][c + 1]) return true;
    }
  }
  return false;
};

const checkState = () => {
  const won = grid.some((row) => row.includes(2048));
  if (won) setMsg('Bravo, 2048 !');
  else if (!hasMoves()) setMsg('Perdu. Nouveau ?');
  else setMsg('Utilise les fleches');
};

const render = () => {
  if (!gridEl) return;
  gridEl.innerHTML = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      const tile = document.createElement('div');
      tile.className = 'g2048-tile';
      tile.dataset.val = String(val);
      tile.innerText = val === 0 ? '' : String(val);
      gridEl.appendChild(tile);
    }
  }
};

const reset = () => {
  grid = Array.from({ length: size }, () => Array(size).fill(0));
  score = 0;
  setScore(score);
  addRandom();
  addRandom();
  render();
  checkState();
};

const onKey = (event) => {
  const key = event.key;
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)) {
    event.preventDefault();
    if (key === 'ArrowLeft') move('left');
    if (key === 'ArrowRight') move('right');
    if (key === 'ArrowUp') move('up');
    if (key === 'ArrowDown') move('down');
  }
};

let touchStart = null;
const onTouchStart = (event) => {
  if (!event.touches || event.touches.length === 0) return;
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
};
const onTouchEnd = (event) => {
  if (!touchStart || !event.changedTouches || event.changedTouches.length === 0) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (Math.max(absX, absY) < 20) return;
  if (absX > absY) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
  touchStart = null;
};

if (root) {
  root.tabIndex = 0;
  root.addEventListener('pointerdown', () => root.focus());
  root.addEventListener('keydown', onKey);
  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });
}
if (newBtn) newBtn.onclick = reset;
reset();
container._cleanup = () => {
  if (root) root.removeEventListener('keydown', onKey);
  if (root) root.removeEventListener('touchstart', onTouchStart);
  if (root) root.removeEventListener('touchend', onTouchEnd);
};`
  },
  {
    id: 'chifoumi',
    title: 'Chifoumi',
    cols: 2,
    rows: 2,
    bgColor: '#111827',
    kind: 'runner',
    html: `<div class="rps-root">
      <div class="rps-head">
        <div class="rps-title">Chifoumi</div>
        <div id="rps-score" class="rps-score">0 - 0</div>
      </div>
      <div class="rps-arena">
        <div class="rps-side">
          <div class="rps-label">Toi</div>
          <div id="rps-you" class="rps-hand">✊</div>
        </div>
        <div class="rps-vs">VS</div>
        <div class="rps-side">
          <div class="rps-label">CPU</div>
          <div id="rps-cpu" class="rps-hand">✊</div>
        </div>
      </div>
      <div id="rps-msg" class="rps-msg">Choisis ton coup</div>
      <div class="rps-actions">
        <button class="rps-btn" data-move="rock">✊</button>
        <button class="rps-btn" data-move="paper">✋</button>
        <button class="rps-btn" data-move="scissors">✌️</button>
      </div>
    </div>`,
    css: `.rps-root { height: 100%; padding: 10px; color: #e2e8f0; border-radius: 14px; background: radial-gradient(circle at top, rgba(59,130,246,0.2), transparent 60%), linear-gradient(135deg, #0f172a, #111827 60%); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 6px; }
.rps-head { display: flex; align-items: center; justify-content: space-between; }
.rps-title { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #93c5fd; font-weight: 700; }
.rps-score { font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 999px; }
.rps-arena { flex: 1; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
.rps-side { text-align: center; }
.rps-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; }
.rps-hand { font-size: 30px; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4)); transition: transform 0.2s; }
.rps-vs { font-size: 10px; letter-spacing: 0.4em; color: #64748b; }
.rps-msg { font-size: 10px; text-align: center; color: #e2e8f0; }
.rps-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.rps-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #fff; border-radius: 10px; padding: 6px 0; font-size: 18px; cursor: pointer; transition: transform 0.1s, background 0.2s, box-shadow 0.2s; }
.rps-btn:hover { background: rgba(59,130,246,0.3); box-shadow: 0 0 12px rgba(59,130,246,0.35); }
.rps-btn:active { transform: scale(0.95) rotate(-2deg); }
.rps-pop { animation: rps-pop 0.25s ease; }
@keyframes rps-pop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`,
    js: `const you = container.querySelector('#rps-you');
const cpu = container.querySelector('#rps-cpu');
const msg = container.querySelector('#rps-msg');
const score = container.querySelector('#rps-score');
const icons = { rock: '✊', paper: '✋', scissors: '✌️' };
const moves = ['rock', 'paper', 'scissors'];
let youScore = 0;
let cpuScore = 0;

const decide = (a, b) => {
  if (a === b) return 'draw';
  if ((a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper')) {
    return 'win';
  }
  return 'lose';
};

const pop = (el) => {
  if (!el) return;
  el.classList.remove('rps-pop');
  void el.offsetWidth;
  el.classList.add('rps-pop');
};

container.querySelectorAll('.rps-btn').forEach((btn) => {
  btn.onclick = () => {
    const choice = btn.getAttribute('data-move');
    if (!choice) return;
    const cpuChoice = moves[Math.floor(Math.random() * moves.length)];
    if (you) you.innerText = icons[choice];
    if (cpu) cpu.innerText = icons[cpuChoice];
    pop(you); pop(cpu);
    const result = decide(choice, cpuChoice);
    if (result === 'win') {
      youScore += 1;
      if (msg) msg.innerText = 'Bien joue !';
    } else if (result === 'lose') {
      cpuScore += 1;
      if (msg) msg.innerText = 'Ouch... encore !';
    } else {
      if (msg) msg.innerText = 'Egalite !';
    }
    if (score) score.innerText = youScore + ' - ' + cpuScore;
  };
});`
  }
];


