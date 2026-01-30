import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetCoffee: WebOSWidgetItem = {
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
};
