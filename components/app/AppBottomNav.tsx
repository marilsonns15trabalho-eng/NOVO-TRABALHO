'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppBottomNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
}

interface AppBottomNavProps {
  items: AppBottomNavItem[];
  className?: string;
}

export default function AppBottomNav({ items, className }: AppBottomNavProps) {
  return (
    <div
      data-app-bottom-nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-black/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-3 backdrop-blur-2xl md:hidden',
        className,
      )}
    >
      <div className="mx-auto grid max-w-2xl grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={cn(
                'flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center transition-all',
                item.active
                  ? 'border-orange-500/25 bg-orange-500/12 text-white'
                  : 'border-zinc-800 bg-zinc-950/70 text-zinc-500 hover:border-zinc-700 hover:text-white',
              )}
            >
              <Icon size={18} className={item.active ? 'text-orange-300' : undefined} />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
