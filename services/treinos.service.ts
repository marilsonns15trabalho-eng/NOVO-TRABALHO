// Camada de serviço para Treinos
import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapStudentToListItem } from '@/lib/mappers';
import type { Treino, TreinoFormData } from '@/types/treino';
import type { StudentListItem } from '@/types/common';
import { assertNotProfessorForUserId } from '@/lib/authz';

/** Busca todos os treinos com nome do aluno (join) */
export async function fetchTreinos(userId?: string): Promise<Treino[]> {
  let query = supabase
    .from(TABLES.TREINOS)
    .select(`*, students(name)`)
    .order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;

  if (error) {
    console.warn('Erro ao buscar treinos com join, tentando sem join:', error.message);
    const { data: dataNoJoin, error: errorNoJoin } = await supabase
      .from(TABLES.TREINOS)
      .select('*')
      .order('created_at', { ascending: false });

    if (errorNoJoin) {
      console.error('Erro ao buscar treinos:', errorNoJoin.message);
      return [];
    }
    return dataNoJoin || [];
  }

  return data || [];
}

/** Busca lista de alunos para o select */
export async function fetchAlunosParaTreino(userId?: string): Promise<StudentListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('*')
    .order('name', { ascending: true });

  if (userId) query = query.eq('user_id', userId);

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
  await assertNotProfessorForUserId(user.id);

  const { error } = await supabase
    .from(TABLES.TREINOS)
    .insert([{
      ...treinoData,
      user_id: user.id,
    }]);

  if (error) throw error;
}
