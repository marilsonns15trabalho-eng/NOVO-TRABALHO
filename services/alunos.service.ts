import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { authorizedApiJson } from '@/lib/api-client';
import { TABLES } from '@/lib/constants';
import { mapAlunoToStudentRow, mapStudentRowToAluno } from '@/lib/mappers';
import { assertAdminForUserId } from '@/lib/authz';
import type { PlanoListItem } from '@/types/common';
import type { Aluno } from '@/types/aluno';

export async function fetchAlunos(): Promise<Aluno[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select(`
      id,
      name,
      cpf,
      rg,
      birth_date,
      gender,
      marital_status,
      profession,
      phone,
      cellphone,
      email,
      zip_code,
      address,
      number,
      complement,
      bairro,
      city,
      state,
      emergency_contact,
      emergency_phone,
      emergency_relationship,
      plan_id,
      join_date,
      due_day,
      status,
      notes,
      objectives,
      desired_weight,
      "group",
      modality,
      created_at,
      linked_auth_user_id
    `)
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
): Promise<{ id: string; auth_user_id: string; temporary_password: string } | null> {
  if (!alunoData.nome?.trim()) {
    throw new Error('O nome do aluno e obrigatorio.');
  }

  if (!alunoData.email?.trim()) {
    throw new Error('O e-mail do aluno e obrigatorio para criar o acesso.');
  }

  const result = await authorizedApiJson<{
    id: string;
    auth_user_id: string;
    temporary_password: string;
  }>('/api/admin/students', {
    method: 'POST',
    body: JSON.stringify({
      aluno: alunoData,
      selectedPlanoId: selectedPlanoId || null,
    }),
  });

  return result;
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
  const { data: currentStudent, error: currentStudentError } = await supabase
    .from(TABLES.STUDENTS)
    .select('linked_auth_user_id, plan_id')
    .eq('id', alunoId)
    .single();

  if (currentStudentError) {
    throw currentStudentError;
  }

  if (userRole === 'aluno') {
    for (const field of RESTRICTED_FIELDS_FOR_ALUNO) {
      delete dbAluno[field];
    }

    if (currentStudent && currentStudent.linked_auth_user_id !== user.id) {
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

  const trimmedName = alunoData.nome?.trim();
  if (trimmedName && currentStudent.linked_auth_user_id) {
    const { error: profileSyncError } = await supabase
      .from(TABLES.USER_PROFILES)
      .update({ display_name: trimmedName })
      .eq('id', currentStudent.linked_auth_user_id);

    if (profileSyncError) {
      console.error('Nao foi possivel sincronizar o nome do perfil autenticado:', profileSyncError);
    }
  }

  if (userRole === 'aluno') {
    return;
  }

  const selectedPlan = planos.find((plano) => plano.id === selectedPlanoId);
  if (!selectedPlan || currentStudent.plan_id === selectedPlan.id) {
    return;
  }

  const { data: latestAssinatura, error: latestAssinaturaError } = await supabase
    .from(TABLES.ASSINATURAS)
    .select('plan_id')
    .eq('student_id', alunoId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestAssinaturaError) {
    throw latestAssinaturaError;
  }

  if (latestAssinatura?.plan_id === selectedPlan.id) {
    return;
  }

  const { error: assinaturaError } = await supabase
    .from(TABLES.ASSINATURAS)
    .insert([
      {
        student_id: alunoId,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        plan_price: selectedPlan.price,
      },
    ]);

  if (assinaturaError) {
    throw assinaturaError;
  }
}

export async function deleteAluno(alunoId: string): Promise<void> {
  await authorizedApiJson<{ message: string }>(
    `/api/admin/students?id=${encodeURIComponent(alunoId)}`,
    {
      method: 'DELETE',
    },
  );
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
