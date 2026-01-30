import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WebOSAPI } from '../../../types';

interface TodoItem {
  text: string;
  done: boolean;
}

const TODO_PATH = 'WebOS-Todo.md';

const parseTodos = (content: string): TodoItem[] => {
  return content
    .split(/\r?\n/)
    .map((line) => line.match(/^\- \[( |x|X)\] (.+)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      done: match[1].toLowerCase() === 'x',
      text: match[2].trim()
    }));
};

const serializeTodos = (items: TodoItem[]) =>
  items.map((item) => `- [${item.done ? 'x' : ' '}] ${item.text}`).join('\n');

interface TodoWidgetProps {
  api: WebOSAPI;
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({ api }) => {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    api.readFile(TODO_PATH).then((content) => {
      if (!active) return;
      if (content) setItems(parseTodos(content));
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [api]);

  const content = useMemo(() => serializeTodos(items), [items]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api.writeFile(TODO_PATH, content);
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [content, loaded, api]);

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { text: trimmed, done: false }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full p-2 text-slate-800">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="flex-1 border rounded px-1 text-sm outline-none focus:border-blue-500"
          placeholder="Tache..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem();
          }}
        />
        <button
          className="bg-blue-500 text-white rounded w-6 flex items-center justify-center"
          onClick={addItem}
        >
          +
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto text-sm space-y-1 custom-scroll">
        {items.map((item, index) => (
          <li key={`${item.text}-${index}`} className="flex items-center gap-2">
            <button
              className={`w-4 h-4 border rounded ${item.done ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}
              onClick={() =>
                setItems((prev) =>
                  prev.map((todo, idx) => (idx === index ? { ...todo, done: !todo.done } : todo))
                )
              }
            />
            <span className={item.done ? 'line-through opacity-50' : ''}>{item.text}</span>
            <button
              className="ml-auto text-red-500 font-bold px-1 hover:bg-red-100 rounded"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
