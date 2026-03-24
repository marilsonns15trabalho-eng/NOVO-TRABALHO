// Camada de serviço para Alunos — Centraliza todas as chamadas Supabase
import { supabase, getCurrentUserId } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapStudentRowToAluno, mapAlunoToStudentRow } from '@/lib/mappers';
import type { Aluno } from '@/types/aluno';
import type { PlanoListItem } from '@/types/common';

/** Busca todos os alunos ordenados por nome */
export async function fetchAlunos(): Promise<Aluno[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }

  return (data || []).map(mapStudentRowToAluno);
}

/** Busca planos ativos para o select de planos */
export async function fetchPlanosAtivos(): Promise<PlanoListItem[]> {
  const { data } = await supabase
    .from(TABLES.PLANS)
    .select('id, name, price')
    .eq('active', true);

  return data || [];
}

/** Cria um novo aluno e opcionalmente sua assinatura */
export async function createAluno(
  alunoData: Partial<Aluno>,
  planos: PlanoListItem[],
  selectedPlanoId: string
): Promise<{ id: string } | null> {
  const dbAluno = mapAlunoToStudentRow(alunoData, planos, selectedPlanoId);

  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .insert([dbAluno])
    .select('id')
    .single();

  if (error) throw error;

  const studentId = data?.id;

  // Criar assinatura se plano foi selecionado
  if (selectedPlanoId && studentId) {
    const plano = planos.find((p) => p.id === selectedPlanoId);
    if (plano) {
      const userId = await getCurrentUserId();
      await supabase.from(TABLES.ASSINATURAS).insert([{
        student_id: studentId,
        plan_id: plano.id,
        plan_name: plano.name,
        plan_price: plano.price,
        user_id: userId,
      }]);
    }
  }

  return data;
}

/** Campos que alunos NÃO podem modificar */
const RESTRICTED_FIELDS_FOR_ALUNO = [
  'plan', 'plan_name', 'plan_id',
  'due_day', 'status', 'amount_paid',
  'join_date', 'start_date',
  'group', 'modality',
];

/** Atualiza um aluno existente, com proteção por role */
export async function updateAluno(
  alunoId: string,
  alunoData: Partial<Aluno>,
  planos: PlanoListItem[],
  selectedPlanoId: string,
  userRole: string = 'admin'
): Promise<void> {
  const dbAluno = mapAlunoToStudentRow(alunoData, planos, selectedPlanoId);

  // Segurança: se for aluno, remover campos administrativos do payload
  if (userRole === 'aluno') {
    for (const field of RESTRICTED_FIELDS_FOR_ALUNO) {
      delete dbAluno[field];
    }

    // Verificar que o aluno só edita seu próprio registro
    const userId = await getCurrentUserId();
    const { data: student } = await supabase
      .from(TABLES.STUDENTS)
      .select('user_id')
      .eq('id', alunoId)
      .single();

    if (student && student.user_id !== userId) {
      throw new Error('Você não tem permissão para editar este registro.');
    }
  }

  const { error } = await supabase
    .from(TABLES.STUDENTS)
    .update(dbAluno)
    .eq('id', alunoId);

  if (error) throw error;
}

/** Exclui um aluno e todos os registros vinculados (cascade manual) */
export async function deleteAluno(alunoId: string): Promise<void> {
  // Excluir registros dependentes para evitar erro de FK
  await supabase.from(TABLES.ASSINATURAS).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.ANAMNESES).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.AVALIACOES).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.TREINOS).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.BILLS).delete().eq('student_id', alunoId);

  // Excluir o aluno
  const { error } = await supabase
    .from(TABLES.STUDENTS)
    .delete()
    .eq('id', alunoId);

  if (error) throw error;
}

/** Alterna o status (ativo/inativo) de um aluno */
export async function toggleAlunoStatus(
  alunoId: string,
  currentStatus: string
): Promise<void> {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

  const { error } = await supabase
    .from(TABLES.STUDENTS)
    .update({ status: newStatus })
    .eq('id', alunoId);

  if (error) throw error;
}

/** Inscreve-se em mudanças realtime na tabela students */
export function subscribeToAlunosChanges(callback: () => void) {
  const channel = supabase
    .channel('alunos_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: TABLES.STUDENTS,
    }, () => {
      callback();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
