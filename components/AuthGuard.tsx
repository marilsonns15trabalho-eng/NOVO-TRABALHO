'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getActiveIdFromPath, ROLE_ACCESS, type UserRole } from '@/lib/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const activeId = getActiveIdFromPath(pathname);
  const role = profile?.role || 'aluno';
  const allowedIds = (ROLE_ACCESS[role as UserRole] || ROLE_ACCESS.aluno) as string[];
  const isAllowed = allowedIds.includes(activeId);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (!isAllowed) {
      router.replace('/dashboard');
    }
  }, [isAllowed, loading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
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
