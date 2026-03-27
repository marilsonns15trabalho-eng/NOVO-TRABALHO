'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, Loader2, LogOut, Menu, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as dashboardService from '@/services/dashboard.service';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

function getRoleAccent(role: string | null) {
  if (role === 'admin') {
    return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
  }

  if (role === 'professor') {
    return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
  }

  return 'border-zinc-800 bg-zinc-900/80 text-zinc-300';
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
  const firstName = displayName.split(' ')[0];
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

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }).format(new Date()),
    []
  );

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-black/75 px-4 py-3 backdrop-blur-xl md:px-8 md:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 transition-colors hover:text-orange-400 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-bold tracking-tight text-white md:text-2xl">
                {title}
              </p>
              <Sparkles size={14} className="hidden text-orange-400 sm:block" />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={12} />
                {todayLabel}
              </span>
              <span className={`inline-flex rounded-full border px-2.5 py-1 font-bold uppercase tracking-[0.22em] ${getRoleAccent(role)}`}>
                {role || 'sem perfil'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-zinc-400 transition-colors hover:text-orange-400">
              {loadingLateCount ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
              {lateCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {lateCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden items-center gap-3 rounded-[24px] border border-zinc-800 bg-zinc-950/85 px-3 py-2 md:flex">
            <div className="text-right">
              <p className="text-sm font-bold text-white">Ola, {firstName}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black text-black">
              {initials}
            </div>

            <button
              onClick={handleSignOut}
              className="rounded-xl p-2 text-zinc-500 transition-colors hover:text-red-400"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
