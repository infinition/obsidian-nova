// Kanban Pro source not found; using minimal fallback.
export const html = "<div class=\"kanban-wrapper\" id=\"kanban-root\"><div class=\"kanban-board\"><div class=\"kanban-column\" data-state=\"todo\"><div class=\"kanban-column-items\" data-state=\"todo\"></div></div><div class=\"kanban-column\" data-state=\"in-progress\"><div class=\"kanban-column-items\" data-state=\"in-progress\"></div></div><div class=\"kanban-column\" data-state=\"done\"><div class=\"kanban-column-items\" data-state=\"done\"></div></div></div></div>";
export const css = ".kanban-wrapper{display:flex;flex-direction:column;height:100%;}";
export const js = "if(typeof api!=='undefined'&&api.root){api.root.innerHTML='<p>Kanban Pro source missing. Build with obsidian-obsidget-ts in sibling folder.</p>';}";
