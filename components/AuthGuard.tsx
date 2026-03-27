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
  const { user, role, isReady, authError } = useAuth();
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Redirecionando para autenticacao...
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        {user && !role ? authError || 'Perfil de acesso indisponivel.' : 'Verificando permissoes...'}
      </div>
    );
  }

  return <>{children}</>;
}
