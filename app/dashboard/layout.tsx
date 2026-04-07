'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Menu } from 'lucide-react';
import AppBottomNav from '@/components/app/AppBottomNav';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileMenu from '@/components/MobileMenu';
import AccountSecurityForm from '@/components/account/AccountSecurityForm';
import { useAuth } from '@/hooks/useAuth';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import { useNativeApp } from '@/hooks/useNativeApp';
import { getActiveIdFromPath, getDefaultRouteForRole, getMenuItemsForRole, ROLE_ACCESS } from '@/lib/navigation';

const TITLES: Record<string, string> = {
  home: 'Painel de Controle',
  alunos: 'Gestao de Alunos',
  financeiro: 'Gestao Financeira',
  planos: 'Gestao de Planos',
  treinos: 'Gestao de Treinos',
  anamnese: 'Anamnese Nutricional',
  avaliacao: 'Avaliacao Fisica',
  'protocolo-alimentar': 'Protocolos Alimentares',
  relatorios: 'Relatorios e Estatisticas',
  configuracoes: 'Configuracoes do Sistema',
  avatar: 'Foto de Perfil',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, profile, isReady, authError, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const nativeApp = useNativeApp();
  const mobileViewport = useMobileViewport();
  const appLikeShell = nativeApp || mobileViewport;

  const activeId = useMemo(() => getActiveIdFromPath(pathname), [pathname]);
  const title = TITLES[activeId] || 'Painel de Controle';

  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
      return;
    }

    router.push(`/dashboard/${id}`);
  };

  const bottomNavItems = useMemo(() => {
    if (!role) {
      return [];
    }

    const preferredIds =
      role === 'admin'
        ? ['home', 'alunos', 'treinos', 'financeiro']
        : ['home', 'alunos', 'treinos', 'avaliacao'];

    const roleItems = getMenuItemsForRole(role);
    const primaryItems = preferredIds
      .map((id) => roleItems.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return [
      ...primaryItems.map((item) => ({
        key: item.id,
        label: item.label,
        icon: item.icon,
        active: activeId === item.id,
        onClick: () => handleNavigate(item.id),
      })),
      {
        key: 'menu',
        label: 'Menu',
        icon: Menu,
        active: false,
        onClick: () => setMobileMenuOpen(true),
      },
    ];
  }, [activeId, role]);

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

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.08),_transparent_22%),linear-gradient(180deg,#09090b_0%,#000_100%)] font-sans text-white selection:bg-orange-500 selection:text-black">
      <div className="hidden lg:block">
        <Sidebar activeTab={activeId} setActiveTab={handleNavigate} userRole={role} />
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeId}
        setActiveTab={handleNavigate}
        userRole={role}
      />

      <main className={`flex flex-1 flex-col overflow-hidden ${appLikeShell ? 'pb-24 md:pb-0' : ''}`}>
        <Header title={title} onMenuToggle={() => setMobileMenuOpen(true)} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {appLikeShell && bottomNavItems.length > 0 ? <AppBottomNav items={bottomNavItems} /> : null}

      {Boolean(profile?.must_change_password) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/92 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4 md:flex md:items-center md:justify-center md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-4xl rounded-[26px] border border-zinc-800 bg-zinc-950 p-3 shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] sm:rounded-[30px] sm:p-4 md:max-h-[94vh] md:overflow-y-auto md:rounded-[34px]">
            <AccountSecurityForm required compact />
          </div>
        </div>
      )}
    </div>
  );
}
