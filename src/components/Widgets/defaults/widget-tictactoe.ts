import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetTictactoe: WebOSWidgetItem = {
  id: 'widget-tictactoe',
  pageIndex: 0,
  type: 'widget',
  title: 'Neon Tic-Tac-Toe',
  widgetId: 'widget-tictactoe',
  cols: 8,
  rows: 9,
  bgColor: '#475569',
  html: `<div class="relative flex flex-col h-full min-h-0 bg-slate-800 p-2 box-border overflow-hidden">
    <div class="flex items-center justify-between mb-1 shrink-0">
        <span class="text-xs text-gray-400 uppercase tracking-widest">Tic-Tac-Toe</span>
        <button id="reset" class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white hover:bg-white/20 uppercase tracking-widest transition active:scale-95">Restart</button>
    </div>
    <div id="status" class="text-[10px] text-slate-300 mb-1 shrink-0">X's turn</div>
    <div class="flex-1 min-h-0 flex items-center justify-center" id="grid-wrap">
      <div class="grid grid-cols-3 gap-1 w-full h-full min-w-0 min-h-0" id="grid"></div>
    </div>
    <div id="overlay" class="absolute inset-0 hidden items-center justify-center bg-black/70 backdrop-blur-sm">
        <div class="bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-center shadow-xl">
            <div id="winner-text" class="text-lg font-bold text-white mb-2">X wins!</div>
            <button id="play-again" class="px-3 py-1 text-[10px] rounded-full bg-white/10 hover:bg-white/20 text-white uppercase tracking-widest transition active:scale-95">Restart</button>
        </div>
    </div>
</div>`,
  css: `#grid-wrap { container-type: size; display: flex; align-items: center; justify-content: center; min-height: 0; width: 100%; height: 100%; }
#grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 6px; width: min(100cqw, 100cqh); height: min(100cqw, 100cqh); min-width: 0; min-height: 0; align-items: stretch; justify-items: stretch; }
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
  status.innerText = isOver ? 'Game over' : turn + \"'s turn\";
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
      if (result) isOver = true;
      else turn = turn === 'X' ? 'O' : 'X';
      if (typeof api !== 'undefined' && api.saveState) api.saveState({ board: board.slice(), turn, isOver });
      render();
      if (result) {
        if (result.winner === 'draw') showOverlay('Draw ✨');
        else showOverlay(result.winner + ' wins!', result.line);
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
  if (typeof api !== 'undefined' && api.saveState) api.saveState({ board: board.slice(), turn, isOver });
  hideOverlay();
  render();
  updateStatus();
};

if (r) r.onclick = resetGame;
if (playAgain) playAgain.onclick = resetGame;

if (typeof api !== 'undefined' && api.getState) {
  api.getState().then(function(s) {
    if (s && s.board && Array.isArray(s.board) && s.board.length === 9) {
      board = s.board.slice();
      turn = (s.turn === 'O' ? 'O' : 'X');
      isOver = !!s.isOver;
    }
    render();
    updateStatus();
  });
} else { render(); updateStatus(); }`,
  x: 8,
  y: 2
};
