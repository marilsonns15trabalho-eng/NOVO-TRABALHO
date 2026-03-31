'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, Sparkles, X } from 'lucide-react';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { useNativeApp } from '@/hooks/useNativeApp';
import { getMenuItemsForRole } from '@/lib/navigation';
import type { UserRole } from '@/hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

function getRoleAccent(userRole: UserRole) {
  if (userRole === 'admin') {
    return {
      pill: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
      icon: 'from-orange-400 to-orange-600',
    };
  }

  if (userRole === 'professor') {
    return {
      pill: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
      icon: 'from-sky-400 to-blue-600',
    };
  }

  return {
    pill: 'border-zinc-700 bg-zinc-800/80 text-zinc-300',
    icon: 'from-zinc-300 to-zinc-500',
  };
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
  const accent = useMemo(() => getRoleAccent(userRole), [userRole]);
  const nativeApp = useNativeApp();

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

  const handleOpenAvatar = () => {
    onClose();
    router.push('/dashboard/avatar');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuario';

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
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed left-0 top-0 z-[9999] flex h-full w-[310px] flex-col border-r border-zinc-800/80 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(5,5,6,0.98))] shadow-2xl ${nativeApp ? 'pb-[env(safe-area-inset-bottom)]' : ''}`}
          >
            <div className="border-b border-zinc-800/80 p-5">
              <div className="flex items-start justify-between gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${accent.icon} text-2xl font-black text-black`}
                  >
                    L
                  </div>
                    <div>
                      <div className="flex items-center gap-2">
                      <h1 className="text-base font-bold text-white">LIONESS</h1>
                      <Sparkles size={13} className="text-orange-400" />
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                      Menu rapido
                    </p>
                    <div className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] ${accent.pill}`}>
                      {userRole}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-500 transition-colors hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
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
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                      isActive
                        ? 'border-white/8 bg-white/[0.06] text-white'
                        : 'border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/70 hover:text-white'
                    }`}
                  >
                    <div
                      className={`rounded-xl p-2 ${
                        isActive
                          ? 'bg-orange-500 text-black'
                          : 'bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{item.label}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-zinc-800/80 p-4">
              {user && (
                <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
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
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 active:scale-[0.99]"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
