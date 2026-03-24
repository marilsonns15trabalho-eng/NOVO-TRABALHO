// Camada de serviço para Avaliações Físicas
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapStudentToAlunoListItem } from '@/lib/mappers';
import type { Avaliacao, AvaliacaoFormData, AvaliacaoAlunoItem } from '@/types/avaliacao';

/** Busca todas as avaliações com join do aluno */
export async function fetchAvaliacoes(): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from(TABLES.AVALIACOES)
    .select(`*, students(nome: name)`)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao buscar avaliações:', error.message);
    return [];
  }

  // Mapear dados JSONB de volta para o formato flat da UI
  return (data || []).map((item: any) => {
    const peso = item.peso || 0;
    const massa_magra = item.massa_magra || 0;
    const massa_gorda = parseFloat((peso - massa_magra).toFixed(2));

    return {
      ...item,
      ...item.medidas,
      ...item.dobras,
      percentual_gordura: item.gordura_corporal,
      soma_dobras: item.dobras?.soma_dobras,
      massa_gorda,
    };
  });
}

/** Busca lista de alunos para o seletor de avaliação */
export async function fetchAlunosParaAvaliacao(): Promise<AvaliacaoAlunoItem[]> {
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
    return (dataNome || []).map((a) => ({
      id: a.id,
      nome: a.nome || a.name,
      sexo: a.sexo,
      data_nascimento: a.data_nascimento,
    }));
  }

  return (data || []).map((a) => ({
    id: a.id,
    nome: a.name || a.nome,
    sexo: a.sexo,
    data_nascimento: a.data_nascimento,
  }));
}

/** Busca histórico de avaliações de um aluno */
export async function fetchHistoricoAluno(studentId: string): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from(TABLES.AVALIACOES)
    .select('*')
    .eq('student_id', studentId)
    .order('data', { ascending: true });

  if (error) throw error;

  return (data || []).map((item: any) => {
    const peso = item.peso || 0;
    const massa_magra = item.massa_magra || 0;
    const massa_gorda = parseFloat((peso - massa_magra).toFixed(2));

    return {
      ...item,
      ...item.medidas,
      ...item.dobras,
      percentual_gordura: item.gordura_corporal,
      soma_dobras: item.dobras?.soma_dobras,
      massa_gorda,
    };
  });
}

/** Cria ou atualiza uma avaliação física */
export async function salvarAvaliacao(
  avaliacaoData: AvaliacaoFormData,
  editingId?: string
): Promise<void> {
  const payload = {
    student_id: avaliacaoData.student_id,
    data: avaliacaoData.data,
    peso: avaliacaoData.peso,
    altura: avaliacaoData.altura,
    imc: avaliacaoData.imc,
    gordura_corporal: avaliacaoData.percentual_gordura,
    massa_magra: avaliacaoData.massa_magra,
    medidas: {
      ombro: avaliacaoData.ombro,
      torax: avaliacaoData.torax,
      cintura: avaliacaoData.cintura,
      abdome: avaliacaoData.abdome,
      quadril: avaliacaoData.quadril,
      braco_direito: avaliacaoData.braco_direito,
      braco_esquerdo: avaliacaoData.braco_esquerdo,
      coxa_direita: avaliacaoData.coxa_direita,
      coxa_esquerda: avaliacaoData.coxa_esquerda,
      panturrilha_direita: avaliacaoData.panturrilha_direita,
      panturrilha_esquerda: avaliacaoData.panturrilha_esquerda,
    },
    dobras: {
      tricipital: avaliacaoData.tricipital,
      subescapular: avaliacaoData.subescapular,
      supra_iliaca: avaliacaoData.supra_iliaca,
      abdominal: avaliacaoData.abdominal,
      soma_dobras: avaliacaoData.soma_dobras,
    },
  };

  if (editingId) {
    const { error } = await supabase
      .from(TABLES.AVALIACOES)
      .update(payload)
      .eq('id', editingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from(TABLES.AVALIACOES)
      .insert([payload]);
    if (error) throw error;
  }
}
