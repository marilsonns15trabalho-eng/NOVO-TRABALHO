'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileMenu from '@/components/MobileMenu';
import { useAuth } from '@/hooks/useAuth';
import { getActiveIdFromPath } from '@/lib/navigation';
import { Loader2 } from 'lucide-react';

/** Mapa de título por rota */
const TITLES: Record<string, string> = {
  home: 'Painel de Controle',
  alunos: 'Gestão de Alunos',
  financeiro: 'Gestão Financeira',
  planos: 'Gestão de Planos',
  treinos: 'Gestão de Treinos',
  anamnese: 'Anamnese Nutricional',
  avaliacao: 'Avaliação Física',
  relatorios: 'Relatórios e Estatísticas',
  configuracoes: 'Configurações do Sistema',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // Compatibilidade: redirecionar ?tab=xyz para /dashboard/xyz
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== 'home') {
      router.replace(`/dashboard/${tab}`);
    } else if (tab === 'home') {
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="text-orange-500 animate-spin" size={48} />
      </div>
    );
  }

  if (!user) return null;

  const activeId = getActiveIdFromPath(pathname);
  const role = profile?.role || 'aluno';
  const title = TITLES[activeId] || 'Painel de Controle';

  // Navegação via setActiveTab → agora traduz para router.push
  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard/${id}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-black">
      {/* Sidebar — visível apenas no desktop */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeId} setActiveTab={handleNavigate} userRole={role} />
      </div>

      {/* Menu Mobile */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeId}
        setActiveTab={handleNavigate}
        userRole={role}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={title}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
