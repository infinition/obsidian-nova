import type { WebOSWidgetItem } from '../../../types';

export const widgetChess: WebOSWidgetItem = {
  id: 'chess-ai',
  pageIndex: 0,
  type: 'widget',
  title: 'Chess vs AI',
  widgetId: 'chess-ai',
  cols: 8,
  rows: 10,
  bgColor: '#1e293b',
  html: `<div class="chess-root flex flex-col h-full bg-slate-900 p-2 overflow-hidden outline-none" tabindex="0">
    <div class="flex justify-between items-center mb-2 px-1 h-8 shrink-0">
        <div class="text-slate-300 font-bold text-sm tracking-wider flex items-center gap-2">
            <span id="status">White to move</span>
            <div id="loader" class="hidden w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <button id="restart" class="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition border border-slate-600">New Game</button>
    </div>
    
    <div class="chess-board-wrapper flex-1 relative flex justify-center items-center overflow-hidden min-h-0">
        <div id="board" class="chess-board">
            </div>
    </div>
    
    <div class="mt-2 h-3 w-full bg-slate-800 rounded-full overflow-hidden shrink-0 border border-slate-700">
        <div id="eval-bar" class="h-full bg-blue-500 transition-all duration-500" style="width: 50%"></div>
    </div>
</div>`,
  css: `.chess-root { user-select: none; }
.chess-board-wrapper {
    width: 100%;
    height: 100%;
}
.chess-board {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    /* Force le carré parfait */
    aspect-ratio: 1/1;
    /* Prend la taille max possible sans dépasser le conteneur */
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    
    border: 4px solid #334155;
    background: #334155;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    margin: auto; /* Centre le board */
}
.square {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: clamp(12px, 5vmin, 32px); /* Taille adaptative */
    cursor: pointer;
    position: relative;
    overflow: hidden;
}
.square.light { background-color: #94a3b8; color: black; }
.square.dark { background-color: #475569; color: black; }
.square.selected { background-color: #fbbf24 !important; }
.square.last-move { box-shadow: inset 0 0 0 3px rgba(59, 130, 246, 0.6); }
.square.check { background-color: #ef4444 !important; }

.piece { 
    cursor: grab; 
    z-index: 10; 
    line-height: 1;
}
.piece.white { color: #f8fafc; text-shadow: 0 2px 4px rgba(0,0,0,0.6); }
.piece.black { color: #0f172a; text-shadow: 0 1px 2px rgba(255,255,255,0.2); }

.dot {
    position: absolute;
    width: 25%;
    height: 25%;
    background: rgba(0,0,0,0.2);
    border-radius: 50%;
    pointer-events: none;
}
.square.dark .dot { background: rgba(0,0,0,0.3); }

/* Animation Class */
.moving-piece {
    position: absolute;
    z-index: 100;
    pointer-events: none;
    transition: transform 0.25s ease-in-out;
    font-size: clamp(12px, 5vmin, 32px); /* Même taille que les pièces */
    line-height: 1;
}`,
  js: `
// --- Configuration & State ---
const boardEl = container.querySelector('#board');
const wrapperEl = container.querySelector('.chess-board-wrapper');
const statusEl = container.querySelector('#status');
const loaderEl = container.querySelector('#loader');
const evalBar = container.querySelector('#eval-bar');
const restartBtn = container.querySelector('#restart');

const PIECES = {
    p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
    P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚'
};

const WEIGHTS = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
// Tables simplifiées (Peano-like) pour encourager le centre
const CENTER_BONUS = [
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
    0,0,10,20,20,10,0,0,
    0,0,20,30,30,20,0,0,
    0,0,20,30,30,20,0,0,
    0,0,10,20,20,10,0,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0
];

let board = [];
let turn = 'w';
let selectedSq = null;
let lastMove = null;
let gameOver = false;
let isAnimating = false; // Bloque les inputs pendant l'animation

// --- Moteur de Jeu ---

const initGame = () => {
    // Minuscules = Noir, Majuscules = Blanc
    const setup = [
        'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
        'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '',
        'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
        'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'
    ];
    board = [...setup];
    turn = 'w';
    gameOver = false;
    selectedSq = null;
    lastMove = null;
    isAnimating = false;
    drawBoard();
    updateStatus("White to move");
    evalBar.style.width = '50%';
};

const getRC = (i) => ({r: Math.floor(i/8), c: i%8});
const getIdx = (r, c) => r * 8 + c;
const isColor = (p, c) => p && (c === 'w' ? p === p.toUpperCase() : p === p.toLowerCase());
const opponent = (c) => c === 'w' ? 'b' : 'w';

const updateStatus = (text, thinking = false) => {
    statusEl.innerText = text;
    if (thinking) loaderEl.classList.remove('hidden');
    else loaderEl.classList.add('hidden');
};

const getMoves = (bd, color) => {
    const moves = [];
    for (let i = 0; i < 64; i++) {
        const p = bd[i];
        if (!p || !isColor(p, color)) continue;
        
        const type = p.toLowerCase();
        const {r, c} = getRC(i);
        const dirs = {
            r: [[-1,0],[1,0],[0,-1],[0,1]],
            b: [[-1,-1],[-1,1],[1,-1],[1,1]],
            q: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]],
            n: [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]],
            k: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
        };

        if (type === 'p') {
            const dir = color === 'w' ? -1 : 1;
            const startRow = color === 'w' ? 6 : 1;
            if (bd[getIdx(r+dir, c)] === '') {
                moves.push({from: i, to: getIdx(r+dir, c)});
                if (r === startRow && bd[getIdx(r+dir*2, c)] === '') {
                    moves.push({from: i, to: getIdx(r+dir*2, c)});
                }
            }
            [[r+dir, c-1], [r+dir, c+1]].forEach(([nr, nc]) => {
                if (nc >= 0 && nc < 8) {
                    const target = bd[getIdx(nr, nc)];
                    if (target && !isColor(target, color)) moves.push({from: i, to: getIdx(nr, nc)});
                }
            });
        } else {
            const vectors = dirs[type];
            for (let v of vectors) {
                let nr = r + v[0], nc = c + v[1];
                while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    const targetIdx = getIdx(nr, nc);
                    const target = bd[targetIdx];
                    if (target === '') {
                        moves.push({from: i, to: targetIdx});
                        if (type === 'n' || type === 'k') break;
                    } else {
                        if (!isColor(target, color)) moves.push({from: i, to: targetIdx});
                        break;
                    }
                    nr += v[0]; nc += v[1];
                }
            }
        }
    }
    return moves;
};

const evaluate = (bd) => {
    let score = 0;
    for (let i = 0; i < 64; i++) {
        const p = bd[i];
        if (!p) continue;
        const type = p.toLowerCase();
        const val = WEIGHTS[type] + CENTER_BONUS[i];
        if (p === p.toUpperCase()) score += val;
        else score -= val;
    }
    return score;
};

const minimax = (bd, depth, alpha, beta, isMax) => {
    if (depth === 0) return evaluate(bd);
    const moves = getMoves(bd, isMax ? 'w' : 'b');
    if (moves.length === 0) return isMax ? -Infinity : Infinity;

    if (isMax) {
        let maxEval = -Infinity;
        for (let m of moves) {
            const saved = bd[m.to];
            bd[m.to] = bd[m.from]; bd[m.from] = '';
            // Promo
            if (bd[m.to] === 'P' && m.to < 8) bd[m.to] = 'Q';
            
            const eval = minimax(bd, depth - 1, alpha, beta, false);
            
            bd[m.from] = bd[m.to] === 'Q' && m.to < 8 ? 'P' : bd[m.to]; bd[m.to] = saved;
            
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let m of moves) {
            const saved = bd[m.to];
            bd[m.to] = bd[m.from]; bd[m.from] = '';
            if (bd[m.to] === 'p' && m.to > 55) bd[m.to] = 'q';

            const eval = minimax(bd, depth - 1, alpha, beta, true);
            
            bd[m.from] = bd[m.to] === 'q' && m.to > 55 ? 'p' : bd[m.to]; bd[m.to] = saved;
            
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

const aiMove = () => {
    updateStatus("Thinking...", true);
    
    // Délai artificiel pour l'animation et le réalisme
    setTimeout(() => {
        const moves = getMoves(board, 'b');
        if (moves.length === 0) {
            updateStatus("Checkmate! You win.");
            gameOver = true;
            return;
        }

        let bestMove = null;
        let minVal = Infinity;
        moves.sort(() => Math.random() - 0.5);

        for (let m of moves) {
            const saved = board[m.to];
            board[m.to] = board[m.from]; board[m.from] = '';
            const isPromo = board[m.to] === 'p' && m.to > 55;
            if (isPromo) board[m.to] = 'q';

            // Profondeur réduite pour la rapidité
            const moveVal = minimax(board, 2, -Infinity, Infinity, true);
            
            if (isPromo) board[m.to] = 'p'; 
            board[m.from] = board[m.to]; board[m.to] = saved;

            if (moveVal < minVal) {
                minVal = moveVal;
                bestMove = m;
            }
        }

        if (bestMove) {
            performMove(bestMove);
        } else {
            updateStatus("Stalemate.");
            gameOver = true;
        }
    }, 600 + Math.random() * 600); // Entre 0.6s et 1.2s
};

// --- ANIMATION SYSTEM ---

const performMove = (move) => {
    // 1. Calculer positions écran
    const fromSq = boardEl.children[move.from];
    const toSq = boardEl.children[move.to];
    
    const pieceChar = board[move.from];
    const pieceColor = isColor(pieceChar, 'w') ? 'white' : 'black';
    
    // Créer une pièce volante temporaire
    const ghost = document.createElement('div');
    ghost.className = \`moving-piece piece \${pieceColor}\`;
    ghost.innerText = PIECES[pieceChar];
    
    // Obtenir coordonnées relatives au wrapper pour éviter problèmes de scroll/offset
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const fromRect = fromSq.getBoundingClientRect();
    const toRect = toSq.getBoundingClientRect();
    
    // Position initiale
    ghost.style.left = (fromRect.left - wrapperRect.left) + 'px';
    ghost.style.top = (fromRect.top - wrapperRect.top) + 'px';
    ghost.style.width = fromRect.width + 'px';
    ghost.style.height = fromRect.height + 'px';
    ghost.style.display = 'flex';
    ghost.style.justifyContent = 'center';
    ghost.style.alignItems = 'center';
    
    wrapperEl.appendChild(ghost);
    isAnimating = true;
    
    // Cacher la vraie pièce temporairement
    fromSq.innerHTML = ''; 

    // Forcer le reflow
    ghost.getBoundingClientRect();

    // Déclencher l'animation
    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;
    ghost.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;

    // Fin de l'animation
    setTimeout(() => {
        ghost.remove();
        applyMoveLogic(move);
        isAnimating = false;
        
        // Si c'était les blancs, tour de l'IA
        if (turn === 'b' && !gameOver) {
            aiMove();
        }
    }, 250); // Doit correspondre à la durée CSS
};

const applyMoveLogic = (move) => {
    board[move.to] = board[move.from];
    board[move.from] = '';
    
    // Promo
    if (board[move.to] === 'P' && move.to < 8) board[move.to] = 'Q';
    if (board[move.to] === 'p' && move.to > 55) board[move.to] = 'q';
    
    lastMove = move;
    turn = opponent(turn);
    drawBoard();
    
    const score = evaluate(board);
    const per = Math.max(5, Math.min(95, 50 + (score / 1500) * 50));
    evalBar.style.width = per + '%';

    if (turn === 'w') updateStatus("Your turn");
};

// --- RENDER ---
const drawBoard = () => {
    boardEl.innerHTML = '';
    for (let i = 0; i < 64; i++) {
        const div = document.createElement('div');
        const {r, c} = getRC(i);
        const isDark = (r + c) % 2 === 1;
        div.className = \`square \${isDark ? 'dark' : 'light'}\`;
        
        if (selectedSq === i) div.classList.add('selected');
        if (lastMove && (lastMove.from === i || lastMove.to === i)) div.classList.add('last-move');
        
        const p = board[i];
        if (p) {
            const span = document.createElement('span');
            span.className = \`piece \${p === p.toUpperCase() ? 'white' : 'black'}\`;
            span.innerText = PIECES[p];
            div.appendChild(span);
        }
        
        if (selectedSq !== null && turn === 'w') {
             const moves = getMoves(board, 'w');
             if (moves.find(m => m.from === selectedSq && m.to === i)) {
                 const dot = document.createElement('div');
                 dot.className = 'dot';
                 div.appendChild(dot);
             }
        }

        div.onclick = () => onSquareClick(i);
        boardEl.appendChild(div);
    }
};

const onSquareClick = (i) => {
    if (gameOver || turn !== 'w' || isAnimating) return;

    if (board[i] && isColor(board[i], 'w')) {
        selectedSq = i;
        drawBoard();
        return;
    }

    if (selectedSq !== null) {
        const moves = getMoves(board, 'w');
        const move = moves.find(m => m.from === selectedSq && m.to === i);
        if (move) {
            performMove(move); // Déclenche l'animation puis la logique
            selectedSq = null;
        } else {
            selectedSq = null;
            drawBoard();
        }
    }
};

restartBtn.onclick = initGame;
initGame();
  `
};