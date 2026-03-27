'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileMenu from '@/components/MobileMenu';
import AccountSecurityForm from '@/components/account/AccountSecurityForm';
import { useAuth } from '@/hooks/useAuth';
import { getActiveIdFromPath, getDefaultRouteForRole, ROLE_ACCESS } from '@/lib/navigation';

const TITLES: Record<string, string> = {
  home: 'Painel de Controle',
  alunos: 'Gestao de Alunos',
  financeiro: 'Gestao Financeira',
  planos: 'Gestao de Planos',
  treinos: 'Gestao de Treinos',
  anamnese: 'Anamnese Nutricional',
  avaliacao: 'Avaliacao Fisica',
  relatorios: 'Relatorios e Estatisticas',
  configuracoes: 'Configuracoes do Sistema',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, profile, isReady, authError, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeId = useMemo(() => getActiveIdFromPath(pathname), [pathname]);
  const title = TITLES[activeId] || 'Painel de Controle';

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (!role) return;

    if (role === 'aluno') {
      router.replace('/aluno');
      return;
    }

    if (!ROLE_ACCESS[role].includes(activeId)) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [activeId, isReady, role, router, user]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!user || !role || role === 'aluno') {
    if (user && !role) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <h2 className="mb-3 text-2xl font-bold">Perfil de acesso indisponivel</h2>
            <p className="mb-6 text-sm text-zinc-400">
              {authError || 'Nao foi possivel validar o perfil desta sessao. Entre novamente para continuar.'}
            </p>
            <button
              onClick={async () => {
                await signOut();
                router.replace('/auth');
              }}
              className="rounded-2xl bg-orange-500 px-6 py-3 font-bold text-black transition-all hover:bg-orange-600"
            >
              Entrar novamente
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Redirecionando...
      </div>
    );
  }

  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
      return;
    }

    router.push(`/dashboard/${id}`);
  };

  return (
    <div className="flex min-h-screen bg-black font-sans text-white selection:bg-orange-500 selection:text-black">
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

      {Boolean(profile?.must_change_password) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6 py-10 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <AccountSecurityForm required compact />
          </div>
        </div>
      )}
    </div>
  );
}
