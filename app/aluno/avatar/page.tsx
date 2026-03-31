'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AccessGuard from '@/components/AccessGuard';
import ProfileAvatarManager from '@/components/account/ProfileAvatarManager';

export default function AlunoAvatarPage() {
  const router = useRouter();

  return (
    <AccessGuard allowedRoles={['aluno']}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.08),_transparent_22%),linear-gradient(180deg,#09090b_0%,#000_100%)] text-white">
        <ProfileAvatarManager standalone onClose={() => router.push('/aluno')} />
      </div>
    </AccessGuard>
  );
}
