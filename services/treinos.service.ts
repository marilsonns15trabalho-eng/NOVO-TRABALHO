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
    console.warn('Erro ao buscar treinos com join, tentando sem join:', error.message);
    let fallbackQuery = supabase
      .from(TABLES.TREINOS)
      .select('*')
      .order('created_at', { ascending: false });

    if (linkedAuthUserId) {
      const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
      if (!studentId) return [];
      fallbackQuery = fallbackQuery.eq('student_id', studentId);
    }

    const { data: dataNoJoin, error: errorNoJoin } = await fallbackQuery;

    if (errorNoJoin) {
      console.error('Erro ao buscar treinos:', errorNoJoin.message);
      return [];
    }
    return (dataNoJoin || []).map(mapTreinoRow);
  }

  return (data || []).map(mapTreinoRow);
}

/** Busca lista de alunos para o select */
export async function fetchAlunosParaTreino(linkedAuthUserId?: string): Promise<StudentListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('*')
    .order('name', { ascending: true });

  if (linkedAuthUserId) query = query.eq('linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.warn('Erro ao buscar alunos por "name", tentando "nome":', error.message);
    const { data: dataNome, error: errorNome } = await supabase
      .from(TABLES.STUDENTS)
      .select('*')
      .order('nome', { ascending: true });

    if (errorNome) {
      console.error('Erro fatal ao buscar lista de alunos:', errorNome);
      return [];
    }
    return (dataNome || []).map(mapStudentToListItem);
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
