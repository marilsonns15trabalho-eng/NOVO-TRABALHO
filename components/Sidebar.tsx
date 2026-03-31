'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { getMenuItemsForRole } from '@/lib/navigation';
import type { UserRole } from '@/hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

function getRoleAccent(userRole: UserRole) {
  if (userRole === 'admin') {
    return {
      pill: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
      icon: 'from-orange-400 to-orange-600',
      glow: 'shadow-[0_24px_80px_-52px_rgba(249,115,22,0.45)]',
    };
  }

  if (userRole === 'professor') {
    return {
      pill: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
      icon: 'from-sky-400 to-blue-600',
      glow: 'shadow-[0_24px_80px_-52px_rgba(56,189,248,0.38)]',
    };
  }

  return {
    pill: 'border-zinc-700 bg-zinc-800/80 text-zinc-300',
    icon: 'from-zinc-300 to-zinc-500',
    glow: 'shadow-[0_24px_80px_-52px_rgba(113,113,122,0.3)]',
  };
}

export default function Sidebar({ activeTab, setActiveTab, userRole }: SidebarProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const menuItems = getMenuItemsForRole(userRole);

  const accent = useMemo(() => getRoleAccent(userRole), [userRole]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuario';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleOpenAvatar = () => {
    router.push('/dashboard/avatar');
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[290px] flex-col border-r border-zinc-800/80 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(5,5,6,0.98))] backdrop-blur-xl">
      <div className="border-b border-zinc-800/80 px-5 py-6">
        <div className={`rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-5 ${accent.glow}`}>
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={handleOpenAvatar}
              aria-label="Abrir configuracoes da foto de perfil"
            >
              <ProfileAvatar
                displayName={displayName}
                className="h-14 w-14 rounded-[22px] border border-zinc-800"
                textClassName="text-3xl"
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold tracking-tight text-white">LIONESS</h1>
                <Sparkles size={14} className="text-orange-400" />
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-zinc-500">Painel</p>

              <div className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] ${accent.pill}`}>
                {userRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ${
                isActive
                  ? 'border border-white/8 bg-white/[0.06] text-white shadow-[0_24px_70px_-48px_rgba(255,255,255,0.14)]'
                  : 'border border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/70 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-y-2 left-2 w-1 rounded-full bg-orange-500"
                />
              )}

              <div className="flex items-center gap-3 pl-2">
                <div
                  className={`rounded-xl p-2 transition-all ${
                    isActive
                      ? 'bg-orange-500 text-black'
                      : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-orange-400'
                  }`}
                >
                  <Icon size={18} />
                </div>

                <div>
                  <p className="font-semibold">{item.label}</p>
                </div>
              </div>

              <ChevronRight
                size={16}
                className={`transition-all ${
                  isActive
                    ? 'translate-x-0 text-white'
                    : 'translate-x-1 text-zinc-700 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                }`}
              />
            </button>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800/80 p-4">
        {user && (
          <div className="rounded-[26px] border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAvatar}
                aria-label="Abrir configuracoes da foto de perfil"
              >
                <ProfileAvatar
                  displayName={displayName}
                  className="h-12 w-12 rounded-2xl border border-zinc-800"
                  textClassName="text-sm"
                />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
