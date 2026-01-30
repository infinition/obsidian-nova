import type { WebOSWidgetItem } from '../../../types';

export const defaultWidgetKanban: WebOSWidgetItem = {
  id: 'widget-kanban',
  pageIndex: 0,
  type: 'widget',
  title: 'Mini Kanban',
  widgetId: 'widget-kanban',
  cols: 6,
  rows: 3,
  bgColor: '#1e293b',
  html: `<div class="flex h-full gap-2 p-2 overflow-hidden select-none">
    
    <div class="flex-1 flex flex-col bg-slate-800 rounded border border-slate-700/50">
        <div class="p-2 text-xs font-bold text-gray-400 uppercase border-b border-slate-700">À faire</div>
        <div class="flex-1 p-1 overflow-y-auto space-y-1 kanban-col" data-status="todo" id="col-todo"></div>
        <button onclick="addTask()" class="p-1 text-center text-xs text-slate-500 hover:text-slate-300">+ Ajouter</button>
    </div>
    
    <div class="flex-1 flex flex-col bg-slate-800 rounded border border-slate-700/50">
        <div class="p-2 text-xs font-bold text-blue-400 uppercase border-b border-slate-700">En cours</div>
        <div class="flex-1 p-1 overflow-y-auto space-y-1 kanban-col" data-status="doing" id="col-doing"></div>
    </div>
    
    <div class="flex-1 flex flex-col bg-slate-800 rounded border border-slate-700/50">
        <div class="p-2 text-xs font-bold text-green-400 uppercase border-b border-slate-700">Fait</div>
        <div class="flex-1 p-1 overflow-y-auto space-y-1 kanban-col" data-status="done" id="col-done"></div>
    </div>
</div>`,
  css: `.task-card { background: #334155; padding: 6px; border-radius: 4px; font-size: 11px; color: #e2e8f0; cursor: grab; border-left: 3px solid transparent; } .task-card:active { cursor: grabbing; } .task-todo { border-left-color: #94a3b8; } .task-doing { border-left-color: #60a5fa; } .task-done { border-left-color: #4ade80; opacity: 0.6; text-decoration: line-through; }`,
  js: `let tasks = JSON.parse(localStorage.getItem('w-kanban') || '[{"id":1, "txt":"Modifier JSON", "st":"doing"}]');
const render = () => {
    ['todo','doing','done'].forEach(s => container.querySelector('#col-' + s).innerHTML = '');
    tasks.forEach(t => {
        const el = document.createElement('div');
        el.className = 'task-card task-' + t.st;
        el.innerText = t.txt;
        el.draggable = true;
        el.ondragstart = (e) => { e.dataTransfer.setData('tid', t.id); };
        // Double click to delete
        el.ondblclick = () => { if(confirm('Supprimer ?')) { tasks = tasks.filter(x=>x.id!==t.id); save(); } };
        container.querySelector('#col-' + t.st).appendChild(el);
    });
};
const save = () => { localStorage.setItem('w-kanban', JSON.stringify(tasks)); render(); };
window.addTask = () => { 
    const t = prompt('Tâche ?'); 
    if(t) { tasks.push({id: Date.now(), txt: t, st: 'todo'}); save(); } 
};

// Drop Logic
container.querySelectorAll('.kanban-col').forEach(col => {
    col.ondragover = e => e.preventDefault();
    col.ondrop = e => {
        e.preventDefault();
        const tid = parseInt(e.dataTransfer.getData('tid'));
        const newSt = col.getAttribute('data-status');
        const task = tasks.find(t => t.id === tid);
        if(task && task.st !== newSt) { task.st = newSt; save(); }
    };
});
render();`,
  x: 3,
  y: 2
};
