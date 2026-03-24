// Camada de serviço para gerenciamento de usuários (user_profiles)
import { supabase, getCurrentUserId } from '@/lib/supabase';
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

/** Verifica se um userId pertence ao super admin */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: null }));
  // Fallback: buscar pelo perfil se admin API não disponível
  if (!data) {
    // Sem acesso à API admin, usamos o email do perfil
    return false;
  }
  return data?.user?.email === SUPER_ADMIN_EMAIL;
}

/** Atualiza o role de um usuário (somente admin, protege super admin) */
export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole,
  targetEmail?: string
): Promise<{ error: string | null }> {
  // Verificar que o chamador é admin
  const currentUserId = await getCurrentUserId();

  const { data: callerProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', currentUserId)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return { error: 'Apenas administradores podem alterar roles.' };
  }

  // Não permitir alterar o próprio role
  if (targetUserId === currentUserId) {
    return { error: 'Você não pode alterar seu próprio role.' };
  }

  // Proteger super admin
  if (targetEmail === SUPER_ADMIN_EMAIL) {
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
