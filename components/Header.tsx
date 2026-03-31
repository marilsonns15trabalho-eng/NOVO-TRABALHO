'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, LogOut, Menu, Sparkles } from 'lucide-react';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import ProfileAvatarManager from '@/components/account/ProfileAvatarManager';
import AppDownloadButton from '@/components/app/AppDownloadButton';
import AppNotificationBell from '@/components/notifications/AppNotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { useNativeApp } from '@/hooks/useNativeApp';

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
  const { user, profile, role, signOut } = useAuth();
  const router = useRouter();
  const nativeApp = useNativeApp();
  const [avatarManagerOpen, setAvatarManagerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuario';
  const firstName = displayName.split(' ')[0];
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
    <header className={`sticky top-0 z-30 border-b border-zinc-800/80 bg-black/75 backdrop-blur-xl ${nativeApp ? 'px-4 py-3 md:px-6 md:py-4' : 'px-4 py-3 md:px-8 md:py-4'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 transition-colors hover:text-orange-400 lg:hidden"
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
              {!nativeApp ? <Sparkles size={14} className="hidden text-orange-400 sm:block" /> : null}
            </div>
            <div className={`mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500 ${nativeApp ? 'hidden sm:flex' : ''}`}>
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

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          <AppDownloadButton compact />

          <AppNotificationBell />

          <button
            type="button"
            onClick={() => setAvatarManagerOpen(true)}
            className="lg:hidden"
            aria-label="Gerenciar foto de perfil"
          >
            <ProfileAvatar
              displayName={displayName}
              className="h-10 w-10 rounded-2xl border border-zinc-800"
              textClassName="text-sm"
            />
          </button>

          <div className="hidden items-center gap-3 rounded-[24px] border border-zinc-800 bg-zinc-950/85 px-3 py-2 lg:flex">
            <div className="text-right">
              <p className="text-sm font-bold text-white">Ola, {firstName}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={() => setAvatarManagerOpen(true)}
              aria-label="Gerenciar foto de perfil"
            >
              <ProfileAvatar
                displayName={displayName}
                className="h-11 w-11 rounded-2xl border border-zinc-800"
                textClassName="text-sm"
              />
            </button>

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

      <ProfileAvatarManager
        open={avatarManagerOpen}
        onClose={() => setAvatarManagerOpen(false)}
      />
    </header>
  );
}
