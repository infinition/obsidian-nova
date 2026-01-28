import React from 'react';
import type { WebOSItem } from '../types';

interface DockProps {
  items: WebOSItem[];
  openItemIds: Set<string>;
  themeClass: string;
  onLaunch: (item: WebOSItem) => void;
  resolveIcon: (icon?: string) => string | undefined;
}

export const Dock: React.FC<DockProps> = ({ items, openItemIds, themeClass, onLaunch, resolveIcon }) => {
  return (
    <div className="webos-dock">
      <div className={`backdrop-blur-xl border border-white/20 px-4 py-3 rounded-3xl flex items-end gap-3 shadow-2xl overflow-x-auto no-scrollbar ${themeClass}`}>
        {items.map((item) => {
          const icon = resolveIcon(item.icon);
          return (
            <div key={item.id} className="relative group" onClick={() => onLaunch(item)}>
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shadow-lg flex items-center justify-center text-2xl cursor-pointer transition hover:scale-110 active:scale-95"
                style={{ backgroundColor: item.bgColor || '#334155' }}
              >
                {icon ? (
                  <img
                    src={icon}
                    alt={item.title}
                    className={item.fullSize ? 'w-full h-full object-cover' : 'w-2/3 h-2/3 object-contain'}
                  />
                ) : (
                  item.icon || 'APP'
                )}
              </div>
              {openItemIds.has(item.id) && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

