import { getAuthenticatedUser, supabase } from '@/lib/supabase';

export async function findStudentIdByLinkedAuthUserId(linkedAuthUserId?: string): Promise<string | null> {
  const userId = typeof linkedAuthUserId === 'string' ? linkedAuthUserId.trim() : '';
  if (!userId) return null;

  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('linked_auth_user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export async function resolveStudentIdForWrite(
  explicitStudentId: string | null | undefined,
  authUserId?: string
): Promise<string> {
  const userId = authUserId ?? (await getAuthenticatedUser()).id;
  const providedStudentId =
    typeof explicitStudentId === 'string'
      ? explicitStudentId.trim()
      : String(explicitStudentId ?? '').trim();
  const linkedStudentId = await findStudentIdByLinkedAuthUserId(userId);

  if (linkedStudentId) {
    if (providedStudentId && providedStudentId !== linkedStudentId) {
      throw new Error('Selecione apenas o student vinculado ao usuario autenticado.');
    }
    return linkedStudentId;
  }

  if (!providedStudentId) {
    throw new Error('Selecione um aluno na lista.');
  }

  return providedStudentId;
}
