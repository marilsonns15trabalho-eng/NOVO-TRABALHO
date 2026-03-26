import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import type { UserRole } from '@/contexts/AuthContext';

async function getRoleForUserId(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.role) return null;

  const role = data.role;
  if (role === 'admin' || role === 'professor' || role === 'aluno') {
    return role;
  }

  return null;
}

export async function assertAdmin(): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);
}

export async function assertAdminForUserId(userId: string): Promise<void> {
  const role = await getRoleForUserId(userId);

  if (!role) {
    throw new Error('Perfil de acesso nao encontrado.');
  }

  if (role !== 'admin') {
    throw new Error('Ação restrita a administradores');
  }
}

export async function assertCanManageStudentData(): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);
}

export async function assertCanManageStudentDataForUserId(userId: string): Promise<void> {
  const role = await getRoleForUserId(userId);

  if (!role) {
    throw new Error('Perfil de acesso nao encontrado.');
  }

  if (role === 'aluno') {
    throw new Error('Ação não permitida para aluno');
  }
}
