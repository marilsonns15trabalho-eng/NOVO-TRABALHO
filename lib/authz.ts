import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import type { UserRole } from '@/contexts/AuthContext';

/**
 * A checagem de permissão real deve estar no RLS do Supabase.
 * Este helper é só uma barreira extra no frontend (UX + segurança adicional).
 */
async function getRoleForUserId(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.role) return 'aluno';
  return data.role as UserRole;
}

export async function assertNotProfessor(): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertNotProfessorForUserId(user.id);
}

export async function assertNotProfessorForUserId(userId: string): Promise<void> {
  const role = await getRoleForUserId(userId);
  if (role === 'professor') throw new Error('Sem permissão para editar.');
}

