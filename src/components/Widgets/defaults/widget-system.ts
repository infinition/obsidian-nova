import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetSystem: WebOSWidgetItem = {
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
};
