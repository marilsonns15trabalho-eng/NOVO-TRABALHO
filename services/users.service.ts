import { supabase } from '@/lib/supabase';
import { authorizedApiJson } from '@/lib/api-client';
import type { UserRole } from '@/contexts/AuthContext';

export interface UserProfileRow {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  is_super_admin?: boolean | null;
}

export async function fetchAllProfiles(): Promise<UserProfileRow[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, role, display_name, created_at, is_super_admin')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar perfis:', error.message);
    return [];
  }

  return (data || []) as UserProfileRow[];
}

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<{ error: string | null }> {
  try {
    await authorizedApiJson<{ message: string }>('/api/admin/users/role', {
      method: 'POST',
      body: JSON.stringify({
        userId: targetUserId,
        newRole,
      }),
    });

    return { error: null };
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    return {
      error: error instanceof Error ? error.message : 'Erro ao atualizar role.',
    };
  }
}
