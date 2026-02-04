import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetCalc: WebOSWidgetItem = {
  id: 'widget-calc',
  pageIndex: 0,
  type: 'widget',
  title: 'Glass Calculator',
  widgetId: 'widget-calc',
  cols: 6,
  rows: 8,
  bgColor: '#1f2937',
  html: `<div class="calc-root flex flex-col h-full min-h-0 p-1 sm:p-2 bg-gray-800 box-border outline-none relative" tabindex="0">
    <div class="calc-screen-container relative mb-1 z-50">
        <div id="disp" class="calc-disp bg-black/40 text-white flex items-center justify-end px-2 rounded overflow-hidden relative z-10">0</div>
        
        <div id="history" class="calc-history absolute bottom-full left-0 w-full max-h-48 bg-gray-900 text-white p-2 rounded shadow-2xl overflow-y-auto mb-2 opacity-0 invisible transition-all duration-200 border border-gray-700">
            <div class="text-xs text-gray-500 text-center mb-2 uppercase tracking-wider">Historique</div>
            <div id="history-content" class="flex flex-col-reverse gap-1"></div>
        </div>
    </div>

    <div class="calc-grid">
        <button class="btn bg-gray-600" data-key="C">C</button>
        <button class="btn bg-gray-600" data-key="Backspace">←</button>
        <button class="btn bg-gray-600" data-key="/">÷</button>
        <button class="btn bg-gray-600" data-key="*">×</button>
        
        <button class="btn bg-gray-700" data-key="7">7</button>
        <button class="btn bg-gray-700" data-key="8">8</button>
        <button class="btn bg-gray-700" data-key="9">9</button>
        <button class="btn bg-orange-500" data-key="-">−</button>
        
        <button class="btn bg-gray-700" data-key="4">4</button>
        <button class="btn bg-gray-700" data-key="5">5</button>
        <button class="btn bg-gray-700" data-key="6">6</button>
        <button class="btn bg-orange-500" data-key="+">+</button>
        
        <button class="btn bg-gray-700" data-key="1">1</button>
        <button class="btn bg-gray-700" data-key="2">2</button>
        <button class="btn bg-gray-700" data-key="3">3</button>
        <button class="btn bg-blue-600 row-span-2" data-key="=">=</button>

        <button class="btn bg-gray-700 col-span-2" data-key="0">0</button>
        <button class="btn bg-gray-700" data-key=".">.</button>
    </div>
</div>`,
  css: `.calc-root { display: flex; flex-direction: column; height: 100%; min-height: 0; box-sizing: border-box; overflow: visible !important; }
.calc-root:focus { outline: none; }

/* Affichage du popup au survol de la zone écran */
.calc-screen-container:hover #history { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0); }
.calc-history { transform: translateY(5px); pointer-events: none; z-index: 100; font-size: 13px; text-align: right; }

.calc-disp { flex: 0 0 auto; min-height: 2.5em; display: flex; align-items: center; justify-content: flex-end; font-size: clamp(14px, 4vmin, 28px); font-weight: 300; letter-spacing: 0.05em; box-sizing: border-box; }
.calc-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(5, 1fr); gap: 2px; z-index: 0; }
.calc-grid .btn { width: 100%; height: 100%; min-width: 0; min-height: 0; border-radius: 6px; color: white; font-weight: bold; font-size: clamp(11px, 2.5vmin, 22px); transition: transform 0.1s, filter 0.1s, background 0.15s; border: 1px solid rgba(255,255,255,0.05); box-sizing: border-box; display: flex; align-items: center; justify-content: center; user-select: none; }
.calc-grid .btn:hover { filter: brightness(1.05); }
.calc-grid .btn:active, .calc-grid .btn.active { transform: scale(0.96); filter: brightness(1.2); }`,
  js: `const d = container.querySelector('#disp');
const root = container.querySelector('.calc-root');
const historyContent = container.querySelector('#history-content');
let c = '';
let history = [];

// Fonction d'affichage
const display = (s) => { d.innerText = String(s).substring(0, 12) || '0'; };
const updateHistory = () => {
    historyContent.innerHTML = history.slice(-4).map(item => 
        \`<div class="border-b border-gray-700/50 pb-1 last:border-0">\${item}</div>\`
    ).join('');
};

// Fonction de traitement principale
const input = (k) => {
    // Gestion Egal
    if (k === '=' || k === 'Enter') {
        try { 
            const expression = c;
            const result = eval(c).toString(); 
            // On ajoute seulement si le calcul est valide
            if (expression) {
                history.push(\`<span class="text-gray-400 text-xs">\${expression} =</span> <span class="text-white font-bold">\${result}</span>\`);
                c = result;
                display(c); 
                updateHistory();
            }
        } 
        catch { display('Err'); c = ''; }
        return;
    }
    
    // Gestion Clear
    if (k === 'C' || k === 'Delete') {
        c = ''; 
        display('0');
        return;
    }

    // Gestion Retour Arriere
    if (k === 'Backspace') {
        c = c.slice(0, -1);
        display(c);
        return;
    }

    // Gestion virgule
    if (k === ',') k = '.';

    // Caractères autorisés
    const allowed = '0123456789/*-+.';
    if (allowed.includes(k)) {
        if (c === '' && k !== '.') { /* logique debut */ }
        c += k;
        display(c);
    }
};

// Clics Souris
container.querySelectorAll('.btn').forEach(b => {
    b.onclick = () => {
        b.blur(); 
        root.focus();
        input(b.dataset.key);
    };
});

// Clavier
root.addEventListener('keydown', (e) => {
    if(['Enter', 'Backspace', ' '].includes(e.key)) e.preventDefault();
    input(e.key);
    
    const btn = container.querySelector(\`button[data-key="\${e.key === 'Enter' ? '=' : e.key}"]\`);
    if(btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 100);
    }
});`,
  x: 1,
  y: 5
};