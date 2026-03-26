// Camada de serviço para gerenciamento de usuários (user_profiles)
import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import type { UserRole } from '@/contexts/AuthContext';

export interface UserProfileRow {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  email?: string;
}

/** Busca todos os perfis de usuário com email (somente admin) */
export async function fetchAllProfiles(): Promise<UserProfileRow[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar perfis:', error.message);
    return [];
  }

  return (data || []) as UserProfileRow[];
}

/** Atualiza o role de um usuário (somente admin, protege super admin) */
export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  targetEmail?: string
): Promise<{ error: string | null }> {
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    return { error: 'Usuário não autenticado' };
  }

  const { data: callerProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: 'Apenas administradores podem alterar roles.' };
  }

  // Não permitir alterar o próprio role
  if (targetUserId === user.id) {
    return { error: 'Você não pode alterar seu próprio role.' };
  }

  // Proteger super admin (sem auth.admin: email vindo do caller ou da tabela students)
  let emailToCheck = targetEmail;
  if (!emailToCheck) {
    const { data: studentRow } = await supabase
      .from('students')
      .select('email')
      .eq('linked_auth_user_id', targetUserId)
      .maybeSingle();
    emailToCheck = studentRow?.email ?? undefined;
  }
  if (emailToCheck === SUPER_ADMIN_EMAIL) {
    return { error: 'Super admin não pode ser alterado.' };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)
    .select();

  if (error) {
    console.error('Erro ao atualizar role:', error);
    return { error: error.message };
  }

  console.log('Role atualizado com sucesso:', data);
  return { error: null };
}
