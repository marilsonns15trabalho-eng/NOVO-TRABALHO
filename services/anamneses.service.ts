// Camada de serviço para Anamneses
import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { findStudentIdByLinkedAuthUserId, resolveStudentIdForWrite } from '@/lib/student-access';
import type { Anamnese, AnamneseFormData } from '@/types/anamnese';
import type { AlunoListItem } from '@/types/common';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';

function mapAnamneseRow(item: any): Anamnese {
  const student = item.student ?? item.students;

  return {
    ...item,
    students: student
      ? {
          ...student,
          nome: student.nome ?? student.name,
        }
      : undefined,
  };
}

/** Busca todas as anamneses com join do aluno */
export async function fetchAnamneses(linkedAuthUserId?: string): Promise<Anamnese[]> {
  let query = supabase
    .from(TABLES.ANAMNESES)
    .select(`*, student:students(id, linked_auth_user_id, nome:name)`)
    .order('data', { ascending: false });

  if (linkedAuthUserId) query = query.eq('student.linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.warn('Erro ao buscar anamneses com join, tentando sem join:', error.message);
    let fallbackQuery = supabase
      .from(TABLES.ANAMNESES)
      .select('*')
      .order('data', { ascending: false });

    if (linkedAuthUserId) {
      const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
      if (!studentId) return [];
      fallbackQuery = fallbackQuery.eq('student_id', studentId);
    }

    const { data: dataNoJoin, error: errorNoJoin } = await fallbackQuery;

    if (errorNoJoin) {
      console.error('Erro ao buscar anamneses (sem join):', errorNoJoin.message);
      return [];
    }
    return (dataNoJoin || []).map(mapAnamneseRow);
  }

  return (data || []).map(mapAnamneseRow);
}

/** Busca lista de alunos para o select de anamnese */
export async function fetchAlunosParaAnamnese(linkedAuthUserId?: string): Promise<AlunoListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('*')
    .order('name', { ascending: true });

  if (linkedAuthUserId) query = query.eq('linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.warn('Erro ao buscar alunos por "name", tentando "nome":', error.message);
    let fallbackQuery = supabase
      .from(TABLES.STUDENTS)
      .select('*')
      .order('nome', { ascending: true });

    if (linkedAuthUserId) fallbackQuery = fallbackQuery.eq('linked_auth_user_id', linkedAuthUserId);

    const { data: dataNome, error: errorNome } = await fallbackQuery;

    if (errorNome) throw errorNome;
    return (dataNome || []).map((s: any) => ({ id: s.id, nome: s.nome || s.name }));
  }

  return (data || []).map((s: any) => ({ id: s.id, nome: s.nome || s.name }));
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
    .insert([{ ...data, student_id: studentId }]);

  if (error) throw error;
}
