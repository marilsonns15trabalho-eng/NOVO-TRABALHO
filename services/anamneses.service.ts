// Camada de serviço para Anamneses
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import type { Anamnese, AnamneseFormData } from '@/types/anamnese';
import type { AlunoListItem } from '@/types/common';

/** Busca todas as anamneses com join do aluno */
export async function fetchAnamneses(): Promise<Anamnese[]> {
  const { data, error } = await supabase
    .from(TABLES.ANAMNESES)
    .select(`*, students:students(id, nome:name)`)
    .order('data', { ascending: false });

  if (error) {
    console.warn('Erro ao buscar anamneses com join, tentando sem join:', error.message);
    const { data: dataNoJoin, error: errorNoJoin } = await supabase
      .from(TABLES.ANAMNESES)
      .select('*')
      .order('data', { ascending: false });

    if (errorNoJoin) {
      console.error('Erro ao buscar anamneses (sem join):', errorNoJoin.message);
      return [];
    }
    return dataNoJoin || [];
  }

  return (data || []).map((a: any) => ({ ...a, students: a.students }));
}

/** Busca lista de alunos para o select de anamnese */
export async function fetchAlunosParaAnamnese(): Promise<AlunoListItem[]> {
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

    if (errorNome) throw errorNome;
    return (dataNome || []).map((s: any) => ({ id: s.id, nome: s.nome || s.name }));
  }

  return (data || []).map((s: any) => ({ id: s.id, nome: s.nome || s.name }));
}

/** Cria uma nova anamnese */
export async function createAnamnese(data: AnamneseFormData): Promise<void> {
  const { error } = await supabase
    .from(TABLES.ANAMNESES)
    .insert([data]);

  if (error) throw error;
}
