import { useAuth } from '@/hooks/useAuth';

/**
 * Hook auxiliar para padronizar regras de UI por role.
 * Observação: segurança de verdade deve ser feita no RLS do Supabase.
 */
export function useUserRole() {
  const { profile, loading } = useAuth();

  const role = profile?.role || 'aluno';
  return {
    loading,
    role,
    isAdmin: role === 'admin',
    isProfessor: role === 'professor',
    isAluno: role === 'aluno',
    isReadOnly: role === 'professor',
  };
}

