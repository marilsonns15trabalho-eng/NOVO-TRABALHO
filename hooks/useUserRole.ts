import { useAuth } from '@/hooks/useAuth';

export function useUserRole() {
  const {
    role,
    loading,
    loadingSession,
    loadingProfile,
    isReady,
    isAdmin,
    isProfessor,
    isAluno,
  } = useAuth();

  return {
    role,
    loading,
    loadingSession,
    loadingProfile,
    isReady,
    isAdmin,
    isProfessor,
    isAluno,
    isReadOnly: isAluno,
  };
}
