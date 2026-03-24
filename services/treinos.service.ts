// Camada de serviço para Treinos
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapStudentToListItem } from '@/lib/mappers';
import type { Treino, TreinoFormData } from '@/types/treino';
import type { StudentListItem } from '@/types/common';

/** Busca todos os treinos com nome do aluno (join) */
export async function fetchTreinos(): Promise<Treino[]> {
  const { data, error } = await supabase
    .from(TABLES.TREINOS)
    .select(`*, students(name)`)
    .order('created_at', { ascending: false });

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
export async function fetchAlunosParaTreino(): Promise<StudentListItem[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('*')
    .order('name', { ascending: true });

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from(TABLES.TREINOS)
    .insert([{
      ...treinoData,
      user_id: user.id,
    }]);

  if (error) throw error;
}
