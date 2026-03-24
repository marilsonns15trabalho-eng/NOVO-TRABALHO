'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import * as dashboardService from '@/services/dashboard.service';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [lateCount, setLateCount] = useState(0);

  // Buscar boletos atrasados via service layer
  useEffect(() => {
    const loadLateCount = async () => {
      const count = await dashboardService.fetchLateBillsCount();
      setLateCount(count);
    };
    loadLateCount();

    const unsubscribe = dashboardService.subscribeToBillsChanges(loadLateCount);
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Nome e iniciais dinâmicos
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuário';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 md:h-20 bg-black border-b border-zinc-900 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-black/80">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Hamburger — visível apenas no mobile */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-orange-500 active:text-orange-400 transition-colors rounded-lg"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
        )}

        <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button className="relative p-2 text-zinc-400 hover:text-orange-500 transition-colors">
          <Bell size={20} />
          {lateCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black text-[10px] flex items-center justify-center font-bold text-white">
              {lateCount}
            </span>
          )}
        </button>

        {/* Info do usuário — escondido no mobile */}
        <div className="hidden md:flex items-center gap-4 pl-6 border-l border-zinc-800">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{displayName}</p>
            <p className="text-xs text-zinc-500 capitalize">{profile?.role || 'Usuário'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-black font-bold border-2 border-zinc-800">
            {initials}
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
