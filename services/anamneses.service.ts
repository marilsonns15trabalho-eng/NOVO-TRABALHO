import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { extractDateOnly } from '@/lib/date';
import { mapStudentToAlunoListItem, normalizeStudentRelation } from '@/lib/mappers';
import { findStudentIdByLinkedAuthUserId, resolveStudentIdForWrite } from '@/lib/student-access';
import type { Anamnese, AnamneseFormData } from '@/types/anamnese';
import type { AlunoListItem } from '@/types/common';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';

function mapAnamneseRow(item: any): Anamnese {
  const student = normalizeStudentRelation(item.student ?? item.students);

  return {
    ...item,
    students: student,
  };
}

/** Busca todas as anamneses com join do aluno */
export async function fetchAnamneses(linkedAuthUserId?: string): Promise<Anamnese[]> {
  let query = supabase
    .from(TABLES.ANAMNESES)
    .select(`*, student:students(id, linked_auth_user_id, name)`)
    .order('data', { ascending: false });

  if (linkedAuthUserId) query = query.eq('student.linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar anamneses:', error.message);
    return [];
  }

  return (data || []).map(mapAnamneseRow);
}

/** Busca lista de alunos para o select de anamnese */
export async function fetchAlunosParaAnamnese(linkedAuthUserId?: string): Promise<AlunoListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('id, name, linked_auth_user_id')
    .order('name', { ascending: true });

  if (linkedAuthUserId) query = query.eq('linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapStudentToAlunoListItem);
}

/** Cria uma nova anamnese */
export async function createAnamnese(data: AnamneseFormData): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);
  const studentId = await resolveStudentIdForWrite(
    typeof data.student_id === 'string' ? data.student_id : undefined,
    user.id
  );

  const { error } = await supabase
    .from(TABLES.ANAMNESES)
    .insert([{
      ...data,
      student_id: studentId,
      data: extractDateOnly(data.data) || data.data,
    }]);

  if (error) throw error;
}
