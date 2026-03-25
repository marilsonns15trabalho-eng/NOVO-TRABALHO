'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileMenu from '@/components/MobileMenu';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { getActiveIdFromPath } from '@/lib/navigation';

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

function TabRedirector() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get('tab');

    if (!tab) return;

    if (tab === 'home') {
      router.replace('/dashboard');
      return;
    }

    router.replace(`/dashboard/${tab}`);
  }, [router, searchParams]);

  return null;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeId = getActiveIdFromPath(pathname);
  const role = profile?.role || 'aluno';
  const title = TITLES[activeId] || 'Painel de Controle';

  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
      return;
    }

    router.push(`/dashboard/${id}`);
  };

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-black">
      <Suspense fallback={null}>
        <TabRedirector />
      </Suspense>

      <div className="hidden md:block">
        <Sidebar activeTab={activeId} setActiveTab={handleNavigate} userRole={role} />
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeId}
        setActiveTab={handleNavigate}
        userRole={role}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuToggle={() => setMobileMenuOpen(true)} />

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
