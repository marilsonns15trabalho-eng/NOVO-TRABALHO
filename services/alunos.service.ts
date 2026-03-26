import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapAlunoToStudentRow, mapStudentRowToAluno } from '@/lib/mappers';
import { assertAdminForUserId } from '@/lib/authz';
import type { PlanoListItem } from '@/types/common';
import type { Aluno } from '@/types/aluno';

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

export async function fetchPlanosAtivos(): Promise<PlanoListItem[]> {
  const { data } = await supabase
    .from(TABLES.PLANS)
    .select('id, name, price')
    .eq('active', true);

  return data || [];
}

export async function createAluno(
  alunoData: Partial<Aluno>,
  planos: PlanoListItem[],
  selectedPlanoId: string
): Promise<{ id: string } | null> {
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);

  const dbAluno = mapAlunoToStudentRow(alunoData, planos, selectedPlanoId);

  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .insert([dbAluno])
    .select('id')
    .single();

  if (error) throw error;

  const studentId = data?.id;
  if (selectedPlanoId && studentId) {
    const plano = planos.find((item) => item.id === selectedPlanoId);
    if (plano) {
      await supabase.from(TABLES.ASSINATURAS).insert([
        {
          student_id: studentId,
          plan_id: plano.id,
          plan_name: plano.name,
          plan_price: plano.price,
        },
      ]);
    }
  }

  return data;
}

const RESTRICTED_FIELDS_FOR_ALUNO = [
  'plan',
  'plan_name',
  'plan_id',
  'due_day',
  'status',
  'amount_paid',
  'join_date',
  'start_date',
  'group',
  'modality',
];

export async function updateAluno(
  alunoId: string,
  alunoData: Partial<Aluno>,
  planos: PlanoListItem[],
  selectedPlanoId: string,
  userRole: string = 'admin'
): Promise<void> {
  const user = await getAuthenticatedUser();

  const dbAluno = mapAlunoToStudentRow(alunoData, planos, selectedPlanoId);

  if (userRole === 'aluno') {
    for (const field of RESTRICTED_FIELDS_FOR_ALUNO) {
      delete dbAluno[field];
    }

    const { data: student } = await supabase
      .from(TABLES.STUDENTS)
      .select('linked_auth_user_id')
      .eq('id', alunoId)
      .single();

    if (student && student.linked_auth_user_id !== user.id) {
      throw new Error('Voce nao tem permissao para editar este registro.');
    }
  } else {
    await assertAdminForUserId(user.id);
  }

  const { error } = await supabase
    .from(TABLES.STUDENTS)
    .update(dbAluno)
    .eq('id', alunoId);

  if (error) throw error;
}

export async function deleteAluno(alunoId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);

  await supabase.from(TABLES.ASSINATURAS).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.ANAMNESES).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.AVALIACOES).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.TREINOS).delete().eq('student_id', alunoId);
  await supabase.from(TABLES.BILLS).delete().eq('student_id', alunoId);

  const { error } = await supabase
    .from(TABLES.STUDENTS)
    .delete()
    .eq('id', alunoId);

  if (error) throw error;
}

export async function toggleAlunoStatus(alunoId: string, currentStatus: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);

  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

  const { error } = await supabase
    .from(TABLES.STUDENTS)
    .update({ status: newStatus })
    .eq('id', alunoId);

  if (error) throw error;
}

export function subscribeToAlunosChanges(callback: () => void) {
  const channel = supabase
    .channel('alunos_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.STUDENTS,
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
