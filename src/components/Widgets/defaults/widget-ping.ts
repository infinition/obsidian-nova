import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetPing: WebOSWidgetItem = {
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
};
