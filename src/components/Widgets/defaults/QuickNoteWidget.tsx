import React, { useEffect, useRef, useState } from 'react';
import type { WebOSAPI } from '../../../types';

const NOTE_PATH = 'WebOS-Note.md';

interface QuickNoteWidgetProps {
  api: WebOSAPI;
  instanceId?: string;
}

export const QuickNoteWidget: React.FC<QuickNoteWidgetProps> = ({ api, instanceId: _instanceId }) => {
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
      className="w-full h-full min-h-0 min-w-0 bg-transparent resize-none p-2 outline-none text-slate-800 box-border"
      placeholder="Write a note..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};
