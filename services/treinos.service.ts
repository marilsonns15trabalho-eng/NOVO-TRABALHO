// Camada de serviço para Treinos
import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapStudentToListItem } from '@/lib/mappers';
import { findStudentIdByLinkedAuthUserId, resolveStudentIdForWrite } from '@/lib/student-access';
import type { Treino, TreinoFormData } from '@/types/treino';
import type { StudentListItem } from '@/types/common';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';

function mapTreinoRow(item: any): Treino {
  return {
    ...item,
    students: item.student ?? item.students,
  };
}

/** Busca todos os treinos com nome do aluno (join) */
export async function fetchTreinos(linkedAuthUserId?: string): Promise<Treino[]> {
  let query = supabase
    .from(TABLES.TREINOS)
    .select(`*, student:students(id, linked_auth_user_id, name)`)
    .order('created_at', { ascending: false });

  if (linkedAuthUserId) query = query.eq('student.linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar treinos:', error.message);
    return [];
  }

  return (data || []).map(mapTreinoRow);
}

/** Busca lista de alunos para o select */
export async function fetchAlunosParaTreino(linkedAuthUserId?: string): Promise<StudentListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('id, name, linked_auth_user_id')
    .order('name', { ascending: true });

  if (linkedAuthUserId) query = query.eq('linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar lista de alunos para treino:', error.message);
    return [];
  }

  return (data || []).map(mapStudentToListItem);
}

/** Cria um novo treino */
export async function createTreino(treinoData: TreinoFormData): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);
  const studentId = await resolveStudentIdForWrite(
    typeof treinoData.student_id === 'string' ? treinoData.student_id : undefined,
    user.id
  );

  const { error } = await supabase
    .from(TABLES.TREINOS)
    .insert([{
      ...treinoData,
      student_id: studentId,
    }]);

  if (error) throw error;
}
