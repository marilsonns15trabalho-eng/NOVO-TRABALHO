'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';
import type { UserRole } from '@/contexts/AuthContext';

interface AccessGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
  forbiddenMessage?: string;
}

export default function AccessGuard({
  allowedRoles,
  children,
  redirectTo,
  forbiddenMessage = 'Verificando permissões...',
}: AccessGuardProps) {
  const { user, role, isReady } = useAuth();
  const router = useRouter();

  const isAllowed = !!role && allowedRoles.includes(role);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (role && !allowedRoles.includes(role)) {
      router.replace(redirectTo ?? getDefaultRouteForRole(role));
    }
  }, [allowedRoles, isReady, redirectTo, role, router, user]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!user || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        {forbiddenMessage}
      </div>
    );
  }

  return <>{children}</>;
}
