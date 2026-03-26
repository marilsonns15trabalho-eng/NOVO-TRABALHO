'use client';

import AccessGuard from '@/components/AccessGuard';
import AlunoDashboard from '@/modules/aluno/AlunoDashboard';

export default function AlunoPage() {
  return (
    <AccessGuard allowedRoles={['aluno']}>
      <AlunoDashboard />
    </AccessGuard>
  );
}
