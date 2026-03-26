'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { getMenuItemsForRole } from '@/lib/navigation';
import type { UserRole } from '@/hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

export default function Sidebar({ activeTab, setActiveTab, userRole }: SidebarProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const menuItems = getMenuItemsForRole(userRole);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="sticky top-0 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-2xl font-bold text-black">
            L
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">LIONESS</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">Prime</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={20}
                  className={isActive ? 'text-black' : 'text-zinc-500 group-hover:text-orange-500'}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive ? (
                <motion.div layoutId="active-indicator" className="h-1.5 w-1.5 rounded-full bg-black" />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-zinc-800 p-4">
        {user && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="truncate text-sm font-bold text-white">
              {profile?.display_name || user.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            <div className="mt-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  userRole === 'admin'
                    ? 'bg-orange-500/10 text-orange-500'
                    : userRole === 'professor'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {userRole}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );
}
