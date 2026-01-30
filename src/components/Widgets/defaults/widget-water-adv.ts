import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetWaterAdv: WebOSWidgetItem = {
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
};
