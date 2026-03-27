import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { calcularBiometria } from '@/lib/biometrics';
import { normalizeStudentRelation } from '@/lib/mappers';
import { findStudentIdByLinkedAuthUserId, resolveStudentIdForWrite } from '@/lib/student-access';
import type { Avaliacao, AvaliacaoFormData, AvaliacaoAlunoItem } from '@/types/avaliacao';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';

/** Numérico opcional para o banco (preserva 0; evita "" e undefined virarem bug) */
function n(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function logSupabaseError(context: string, error: unknown) {
  const e = error as { message?: string; code?: string; details?: string; hint?: string };
  console.error(context, {
    message: e?.message,
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
    raw: String(error),
  });
}

/**
 * Mapeia uma row do banco para o formato flat da UI.
 * Fonte primária: colunas flat. Fallback: JSONB.
 */
function mapAvaliacaoRow(item: any): Avaliacao {
  const student = normalizeStudentRelation(item.student ?? item.students);

  return {
    ...item,
    students: student,
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
    massa_gorda:
      item.massa_gorda ??
      (item.peso && item.massa_magra
        ? parseFloat((item.peso - item.massa_magra).toFixed(2))
        : undefined),
  };
}

/** Busca todas as avaliações com join do aluno */
export async function fetchAvaliacoes(linkedAuthUserId?: string): Promise<Avaliacao[]> {
  let query = supabase
    .from(TABLES.AVALIACOES)
    .select(`*, student:students(id, linked_auth_user_id, name, gender, birth_date)`)
    .order('data', { ascending: false });

  if (linkedAuthUserId) query = query.eq('student.linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar avaliações:', error.message);
    return [];
  }

  return (data || []).map(mapAvaliacaoRow);
}

/** Busca lista de alunos para o seletor de avaliação */
export async function fetchAlunosParaAvaliacao(linkedAuthUserId?: string): Promise<AvaliacaoAlunoItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('id, name, gender, birth_date, linked_auth_user_id')
    .order('name', { ascending: true });

  if (linkedAuthUserId) query = query.eq('linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar alunos:', error.message);
    return [];
  }

  return (data || []).map((row: any) => {
    const student = normalizeStudentRelation(row);

    return {
      id: student?.id || row.id,
      nome: student?.nome || '',
      sexo: student?.sexo,
      data_nascimento: student?.data_nascimento,
      gender: student?.gender ?? null,
      birth_date: student?.birth_date ?? null,
    };
  });
}

/** Busca histórico de avaliações de um aluno */
export async function fetchHistoricoAluno(studentId: string, linkedAuthUserId?: string): Promise<Avaliacao[]> {
  if (linkedAuthUserId) {
    const allowedStudentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
    if (!allowedStudentId || allowedStudentId !== studentId) return [];
  }

  const { data, error } = await supabase
    .from(TABLES.AVALIACOES)
    .select(`*, student:students(id, linked_auth_user_id, name, gender, birth_date)`)
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
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const dadosCalculados = calcularBiometria(avaliacaoData as Record<string, unknown>);
  const data = { ...avaliacaoData, ...dadosCalculados };
  const studentId = await resolveStudentIdForWrite(
    typeof data.student_id === 'string' ? data.student_id : undefined,
    user.id
  );

  const rawData = data.data != null && String(data.data).trim() !== '' ? String(data.data).trim() : '';
  const dataAvaliacao = rawData.includes('T') ? rawData.split('T')[0] : rawData;
  if (!dataAvaliacao) {
    throw new Error('Informe a data da avaliação.');
  }

  const rowId =
    editingId ??
    (typeof (avaliacaoData as AvaliacaoFormData).id === 'string'
      ? (avaliacaoData as AvaliacaoFormData).id
      : undefined);

  // Payload unificado: colunas flat como fonte primária (valores biométricos sempre recalculados)
  const payload: Record<string, any> = {
    student_id: studentId,
    data: dataAvaliacao,
    peso: n(data.peso) ?? 0,
    altura: n(data.altura) ?? 0,
    imc: n(data.imc) ?? 0,
    // Campo unificado: salva em ambos para compatibilidade
    percentual_gordura: n(data.percentual_gordura) ?? 0,
    gordura_corporal: n(data.percentual_gordura) ?? 0,
    massa_magra: n(data.massa_magra) ?? 0,
    massa_gorda: n(data.massa_gorda) ?? 0,
    soma_dobras: n(data.soma_dobras) ?? 0,
    protocolo: data.protocolo || 'faulkner',
    observacoes: data.observacoes || null,
    // Colunas flat de perímetros
    ombro: n(data.ombro),
    torax: n(data.torax),
    cintura: n(data.cintura),
    abdome: n(data.abdome),
    quadril: n(data.quadril),
    braco_direito: n(data.braco_direito),
    braco_esquerdo: n(data.braco_esquerdo),
    coxa_direita: n(data.coxa_direita),
    coxa_esquerda: n(data.coxa_esquerda),
    panturrilha_direita: n(data.panturrilha_direita),
    panturrilha_esquerda: n(data.panturrilha_esquerda),
    // Colunas flat de dobras
    tricipital: n(data.tricipital),
    subescapular: n(data.subescapular),
    supra_iliaca: n(data.supra_iliaca),
    abdominal: n(data.abdominal),
    // JSONB como backup (gerado dos mesmos dados)
    medidas: {
      ombro: n(data.ombro),
      torax: n(data.torax),
      cintura: n(data.cintura),
      abdome: n(data.abdome),
      quadril: n(data.quadril),
      braco_direito: n(data.braco_direito),
      braco_esquerdo: n(data.braco_esquerdo),
      coxa_direita: n(data.coxa_direita),
      coxa_esquerda: n(data.coxa_esquerda),
      panturrilha_direita: n(data.panturrilha_direita),
      panturrilha_esquerda: n(data.panturrilha_esquerda),
    },
    dobras: {
      tricipital: n(data.tricipital),
      subescapular: n(data.subescapular),
      supra_iliaca: n(data.supra_iliaca),
      abdominal: n(data.abdominal),
      soma_dobras: n(data.soma_dobras),
    },
  };

  if (rowId) {
    const { error } = await supabase
      .from(TABLES.AVALIACOES)
      .update(payload)
      .eq('id', rowId);
    if (error) {
      logSupabaseError('Erro ao atualizar avaliação:', error);
      throw new Error(error.message || 'Não foi possível atualizar a avaliação.');
    }
  } else {
    const { error } = await supabase
      .from(TABLES.AVALIACOES)
      .insert([payload]);
    if (error) {
      logSupabaseError('Erro ao inserir avaliação:', error);
      throw new Error(error.message || 'Não foi possível salvar a avaliação.');
    }
  }
}
