'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, DollarSign, ClipboardList, Dumbbell, Utensils,
  Activity, BarChart3, Settings, Home, LogOut, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/hooks/useAuth';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ['home', 'alunos', 'financeiro', 'planos', 'treinos', 'anamnese', 'avaliacao', 'relatorios', 'configuracoes'],
  professor: ['home', 'alunos', 'treinos', 'avaliacao', 'anamnese'],
  aluno: ['home', 'treinos', 'avaliacao'],
};

const allMenuItems = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'alunos', label: 'Alunos', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'planos', label: 'Planos', icon: ClipboardList },
  { id: 'treinos', label: 'Treinos', icon: Dumbbell },
  { id: 'anamnese', label: 'Anamnese', icon: Utensils },
  { id: 'avaliacao', label: 'Avaliação', icon: Activity },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export default function MobileMenu({ isOpen, onClose, activeTab, setActiveTab, userRole }: MobileMenuProps) {
  const { user, profile, signOut } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const allowedIds = ROLE_ACCESS[userRole] || ROLE_ACCESS.aluno;
  const menuItems = allMenuItems.filter(item => allowedIds.includes(item.id));

  // Fechar ao clicar no overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
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
          {/* Overlay escuro */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Menu lateral */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 w-[280px] h-full bg-zinc-950 border-r border-zinc-800 z-[9999] flex flex-col shadow-2xl"
          >
            {/* Header do menu */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-black font-bold text-2xl">
                  🦁
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg leading-tight">LIONESS</h1>
                  <p className="text-orange-500 text-xs font-semibold tracking-widest uppercase">Prime</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items do menu */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white active:bg-zinc-800'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-black' : 'text-zinc-500'} />
                    <span className="font-medium text-[15px]">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Info do usuário + Sair */}
            <div className="p-4 border-t border-zinc-800 space-y-3">
              {user && (
                <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                  <p className="text-white text-sm font-bold truncate">
                    {profile?.display_name || user.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                  <div className="mt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      userRole === 'admin' ? 'bg-orange-500/10 text-orange-500' :
                      userRole === 'professor' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {userRole}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-red-500/10 hover:text-red-500 border border-zinc-800 hover:border-red-500/20 text-zinc-500 font-bold rounded-xl transition-all text-sm active:scale-95"
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
