'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getActiveIdFromPath, getDefaultRouteForRole, ROLE_ACCESS } from '@/lib/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, role, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const activeId = getActiveIdFromPath(pathname);
  const allowedIds = role ? ROLE_ACCESS[role] : [];
  const isAllowed = !!role && allowedIds.includes(activeId);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (role && !isAllowed) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isAllowed, isReady, role, router, user]);

  if (!isReady) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-white">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Redirecionando para autenticação...
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Verificando permissões...
      </div>
    );
  }

  return <>{children}</>;
}
