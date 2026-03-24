// Camada de serviço para Avaliações Físicas
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import type { Avaliacao, AvaliacaoFormData, AvaliacaoAlunoItem } from '@/types/avaliacao';

/**
 * Mapeia uma row do banco para o formato flat da UI.
 * Fonte primária: colunas flat. Fallback: JSONB.
 */
function mapAvaliacaoRow(item: any): Avaliacao {
  return {
    ...item,
    // Perímetros: flat primeiro, JSONB como fallback
    ombro: item.ombro ?? item.medidas?.ombro,
    torax: item.torax ?? item.medidas?.torax,
    cintura: item.cintura ?? item.medidas?.cintura,
    abdome: item.abdome ?? item.medidas?.abdome,
    quadril: item.quadril ?? item.medidas?.quadril,
    braco_direito: item.braco_direito ?? item.medidas?.braco_direito,
    braco_esquerdo: item.braco_esquerdo ?? item.medidas?.braco_esquerdo,
    coxa_direita: item.coxa_direita ?? item.medidas?.coxa_direita,
    coxa_esquerda: item.coxa_esquerda ?? item.medidas?.coxa_esquerda,
    panturrilha_direita: item.panturrilha_direita ?? item.medidas?.panturrilha_direita,
    panturrilha_esquerda: item.panturrilha_esquerda ?? item.medidas?.panturrilha_esquerda,
    // Dobras: flat primeiro, JSONB como fallback
    tricipital: item.tricipital ?? item.dobras?.tricipital,
    subescapular: item.subescapular ?? item.dobras?.subescapular,
    supra_iliaca: item.supra_iliaca ?? item.dobras?.supra_iliaca,
    abdominal: item.abdominal ?? item.dobras?.abdominal,
    soma_dobras: item.soma_dobras ?? item.dobras?.soma_dobras,
    // Campo unificado: gordura_corporal (DB) = percentual_gordura (UI)
    percentual_gordura: item.percentual_gordura ?? item.gordura_corporal,
    // massa_gorda: usar valor salvo, ou calcular
    massa_gorda: item.massa_gorda ?? (item.peso && item.massa_magra
      ? parseFloat((item.peso - item.massa_magra).toFixed(2))
      : undefined),
  };
}

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

  return (data || []).map(mapAvaliacaoRow);
}

/** Busca lista de alunos para o seletor de avaliação */
export async function fetchAlunosParaAvaliacao(): Promise<AvaliacaoAlunoItem[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar alunos:', error.message);
    return [];
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    nome: a.name || '',
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

  return (data || []).map(mapAvaliacaoRow);
}

/** Cria ou atualiza uma avaliação física */
export async function salvarAvaliacao(
  avaliacaoData: AvaliacaoFormData,
  editingId?: string
): Promise<void> {
  // Obter user_id autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Payload unificado: colunas FLAT como fonte primária
  const payload: Record<string, any> = {
    student_id: avaliacaoData.student_id,
    data: avaliacaoData.data,
    peso: avaliacaoData.peso,
    altura: avaliacaoData.altura,
    imc: avaliacaoData.imc,
    // Campo unificado: salva em AMBOS para compatibilidade
    percentual_gordura: avaliacaoData.percentual_gordura,
    gordura_corporal: avaliacaoData.percentual_gordura,
    massa_magra: avaliacaoData.massa_magra,
    massa_gorda: avaliacaoData.massa_gorda,
    soma_dobras: avaliacaoData.soma_dobras,
    protocolo: avaliacaoData.protocolo || 'faulkner',
    observacoes: avaliacaoData.observacoes || null,
    user_id: user.id,
    // Colunas flat de perímetros
    ombro: avaliacaoData.ombro || null,
    torax: avaliacaoData.torax || null,
    cintura: avaliacaoData.cintura || null,
    abdome: avaliacaoData.abdome || null,
    quadril: avaliacaoData.quadril || null,
    braco_direito: avaliacaoData.braco_direito || null,
    braco_esquerdo: avaliacaoData.braco_esquerdo || null,
    coxa_direita: avaliacaoData.coxa_direita || null,
    coxa_esquerda: avaliacaoData.coxa_esquerda || null,
    panturrilha_direita: avaliacaoData.panturrilha_direita || null,
    panturrilha_esquerda: avaliacaoData.panturrilha_esquerda || null,
    // Colunas flat de dobras
    tricipital: avaliacaoData.tricipital || null,
    subescapular: avaliacaoData.subescapular || null,
    supra_iliaca: avaliacaoData.supra_iliaca || null,
    abdominal: avaliacaoData.abdominal || null,
    // JSONB como backup (gerado dos mesmos dados)
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
    if (error) {
      console.error('Erro ao atualizar avaliação:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from(TABLES.AVALIACOES)
      .insert([payload]);
    if (error) {
      console.error('Erro ao inserir avaliação:', error);
      throw error;
    }
  }
}

