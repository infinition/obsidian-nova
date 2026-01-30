import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetIde: WebOSWidgetItem = {
  id: 'widget-ide',
  pageIndex: 0,
  type: 'widget',
  title: 'Mini IDE',
  widgetId: 'widget-ide',
  cols: 3,
  rows: 3,
  bgColor: '#171717',
  html: `<div class="flex flex-col h-full text-xs font-mono">
    <div class="flex justify-between items-center bg-[#262626] px-2 py-1 border-b border-white/10">
        <span class="text-yellow-500">script.js</span>
        <button class="bg-green-600 hover:bg-green-700 text-white px-2 rounded flex items-center gap-1 transition" onclick="runCode()">▶ Run</button>
    </div>
    <textarea id="code" class="flex-1 bg-[#171717] text-gray-300 p-2 outline-none resize-none" spellcheck="false">// Write JS here
const a = 10;
alert('Result: ' + (a * 2));</textarea>
    <div id="console" class="h-6 bg-black text-gray-500 px-2 flex items-center border-t border-white/10 overflow-hidden whitespace-nowrap">Console ready.</div>
</div>`,
  css: `textarea { font-family: 'Fira Code', monospace; line-height: 1.4; }`,
  js: `const ta = container.querySelector('#code');
const cons = container.querySelector('#console');
// Load saved
ta.value = localStorage.getItem('w-ide') || ta.value;
ta.addEventListener('input', () => localStorage.setItem('w-ide', ta.value));

window.runCode = () => {
    try {
        // Capture console.log roughly
        const oldLog = console.log;
        console.log = (msg) => { cons.innerText = '> ' + msg; oldLog(msg); setTimeout(()=>console.log=oldLog, 100); };
        eval(ta.value);
        cons.style.color = '#4ade80';
    } catch (e) {
        cons.innerText = 'Err: ' + e.message;
        cons.style.color = '#ef4444';
    }
};`,
  x: 5,
  y: 8
};
