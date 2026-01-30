import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetBtc: WebOSWidgetItem = {
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
};
