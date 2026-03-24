'use client';

import React from 'react';
import { 
  Users, 
  DollarSign, 
  ClipboardList, 
  Dumbbell, 
  Utensils, 
  Activity, 
  BarChart3, 
  Settings,
  Home,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/hooks/useAuth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
}

// Definição de acesso por role
const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ['home', 'alunos', 'financeiro', 'planos', 'treinos', 'anamnese', 'avaliacao', 'relatorios', 'configuracoes'],
  professor: ['home', 'alunos', 'treinos', 'avaliacao', 'anamnese', 'relatorios'],
  aluno: ['home', 'treinos', 'avaliacao'],
};

const allMenuItems = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'alunos', label: 'Alunos', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'planos', label: 'Planos', icon: ClipboardList },
  { id: 'treinos', label: 'Treinos', icon: Dumbbell },
  { id: 'anamnese', label: 'Anamnese', icon: Utensils },
  { id: 'avaliacao', label: 'Avaliação Física', icon: Activity },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, userRole = 'admin' }: SidebarProps) {
  const { user, profile, signOut } = useAuth();

  // Filtrar menu items com base no role
  const allowedIds = ROLE_ACCESS[userRole] || ROLE_ACCESS.aluno;
  const menuItems = allMenuItems.filter(item => allowedIds.includes(item.id));

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-black font-bold text-2xl">
            🦁
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">LIONESS</h1>
            <p className="text-orange-500 text-xs font-semibold tracking-widest uppercase">Prime</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={isActive ? 'text-black' : 'text-zinc-500 group-hover:text-orange-500'} />
                <span className="font-medium">{item.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="w-1.5 h-1.5 rounded-full bg-black"
                />
              )}
              {!isActive && (
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-3">
        {/* Info do usuário */}
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

        {/* Botão Sair */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-red-500/10 hover:text-red-500 border border-zinc-800 hover:border-red-500/20 text-zinc-500 font-bold rounded-xl transition-all text-sm"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );
}
