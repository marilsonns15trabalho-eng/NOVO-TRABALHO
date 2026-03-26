'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMenuItemsForRole } from '@/lib/navigation';
import type { UserRole } from '@/hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

export default function MobileMenu({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  userRole,
}: MobileMenuProps) {
  const { user, profile, signOut } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const menuItems = getMenuItemsForRole(userRole);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.push('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 z-[9999] flex h-full w-[280px] flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-2xl font-bold text-black">
                  L
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight text-white">LIONESS</h1>
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">Prime</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white active:bg-zinc-800'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-black' : 'text-zinc-500'} />
                    <span className="text-[15px] font-medium">{item.label}</span>
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
