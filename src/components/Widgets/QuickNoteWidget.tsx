import React, { useEffect, useRef, useState } from 'react';
import type { WebOSAPI } from '../../types';

const NOTE_PATH = 'WebOS-Note.md';

interface QuickNoteWidgetProps {
  api: WebOSAPI;
}

export const QuickNoteWidget: React.FC<QuickNoteWidgetProps> = ({ api }) => {
  const [value, setValue] = useState('');
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    api.readFile(NOTE_PATH).then((content) => {
      if (!active) return;
      if (content !== null) setValue(content);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api.writeFile(NOTE_PATH, value);
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [value, loaded, api]);

  return (
    <textarea
      className="w-full h-full bg-transparent resize-none p-2 outline-none text-slate-800"
      placeholder="Ecrire une note..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

