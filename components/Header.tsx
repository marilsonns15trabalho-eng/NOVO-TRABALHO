'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as dashboardService from '@/services/dashboard.service';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const [lateCount, setLateCount] = useState(0);
  const [loadingLateCount, setLoadingLateCount] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setLateCount(0);
      return;
    }

    const loadLateCount = async () => {
      try {
        setLoadingLateCount(true);
        const count = await dashboardService.fetchLateBillsCount();
        setLateCount(count);
      } finally {
        setLoadingLateCount(false);
      }
    };

    void loadLateCount();

    const unsubscribe = dashboardService.subscribeToBillsChanges(loadLateCount);
    return unsubscribe;
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuario';
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [displayName]
  );

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-900 bg-black/80 px-4 backdrop-blur-md md:h-20 md:px-8">
      <div className="flex items-center gap-3 md:gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:text-orange-500 active:text-orange-400 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
        )}

        <h2 className="truncate text-lg font-bold tracking-tight text-white md:text-2xl">{title}</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {isAdmin && (
          <button className="relative p-2 text-zinc-400 transition-colors hover:text-orange-500">
            {loadingLateCount ? <Loader2 className="animate-spin" size={20} /> : <Bell size={20} />}
            {lateCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-black bg-red-500 text-[10px] font-bold text-white">
                {lateCount}
              </span>
            )}
          </button>
        )}

        <div className="hidden items-center gap-4 border-l border-zinc-800 pl-6 md:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{displayName}</p>
            <p className="text-xs capitalize text-zinc-500">{role || 'Sem perfil'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-800 bg-gradient-to-br from-orange-400 to-orange-600 font-bold text-black">
            {initials}
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-zinc-500 transition-colors hover:text-red-500"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
