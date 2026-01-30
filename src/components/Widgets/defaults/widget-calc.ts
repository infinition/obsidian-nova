import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetCalc: WebOSWidgetItem = {
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
};
