import { NextRequest, NextResponse } from 'next/server';
import {
  ApiRouteError,
  assertAdminCaller,
  getTargetProfile,
  preventEditingProtectedSuperAdmin,
  requireAuthenticatedCaller,
} from '@/lib/server/admin-auth';
import {
  getSupabaseAdmin,
  normalizeEmail,
} from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = '123456';

type CreateStudentPayload = {
  aluno: {
    nome?: string;
    email?: string;
    telefone?: string;
    celular?: string;
    cpf?: string;
    rg?: string;
    data_nascimento?: string;
    genero?: string;
    estado_civil?: string;
    profissao?: string;
    cep?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    contato_emergencia_nome?: string;
    contato_emergencia_telefone?: string;
    contato_emergencia_parentesco?: string;
    data_matricula?: string;
    dia_vencimento?: number;
    status?: 'ativo' | 'inativo';
    observacoes?: string;
    objetivos?: string[];
    peso_desejado?: number;
    grupo?: string;
    modalidade?: string;
  };
  selectedPlanoId?: string | null;
};

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

async function deleteStudentCascade(admin: ReturnType<typeof getSupabaseAdmin>, studentId: string) {
  const deletions: Array<{ table: string; column: string }> = [
    { table: 'treino_completion_logs', column: 'student_id' },
    { table: 'treino_student_assignments', column: 'student_id' },
    { table: 'student_training_plans', column: 'student_id' },
    { table: 'treino_execution_sessions', column: 'student_id' },
    { table: 'assinaturas', column: 'student_id' },
    { table: 'anamneses', column: 'student_id' },
    { table: 'avaliacoes', column: 'student_id' },
    { table: 'treinos', column: 'student_id' },
    { table: 'bills', column: 'student_id' },
  ];

  for (const deletion of deletions) {
    const { error } = await admin
      .from(deletion.table)
      .delete()
      .eq(deletion.column, studentId);

    if (error) {
      throw error;
    }
  }

  const { error: studentDeleteError } = await admin
    .from('students')
    .delete()
    .eq('id', studentId);

  if (studentDeleteError) {
    throw studentDeleteError;
  }
}

export async function POST(request: NextRequest) {
  let createdAuthUserId: string | null = null;
  let createdStudentId: string | null = null;

  try {
    const { callerProfile, callerUserId } = await requireAuthenticatedCaller(request);
    assertAdminCaller(callerProfile);

    const body = (await request.json()) as CreateStudentPayload;
    const aluno = body?.aluno || {};

    const nome = asNullableString(aluno.nome);
    const email = asNullableString(aluno.email);
    const selectedPlanoId = asNullableString(body?.selectedPlanoId || null);

    if (!nome) {
      throw new ApiRouteError(400, 'O nome do aluno e obrigatorio.');
    }

    if (!email) {
      throw new ApiRouteError(400, 'O e-mail do aluno e obrigatorio para criar o acesso.');
    }

    const admin = getSupabaseAdmin();
    const normalizedEmail = normalizeEmail(email);

    const { data: existingStudent, error: existingStudentError } = await admin
      .from('students')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingStudentError) {
      throw existingStudentError;
    }

    if (existingStudent) {
      throw new ApiRouteError(409, 'Ja existe um aluno cadastrado com este e-mail.');
    }

    const {
      data: createdUserResult,
      error: createUserError,
    } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: nome,
        display_name: nome,
      },
    });

    if (createUserError || !createdUserResult.user) {
      const authMessage = createUserError?.message || 'Nao foi possivel criar o usuario autenticado.';
      if (/already|exists|registered|duplicate/i.test(authMessage)) {
        throw new ApiRouteError(409, 'Ja existe um usuario autenticado com este e-mail.');
      }
      throw new ApiRouteError(
        400,
        authMessage
      );
    }

    createdAuthUserId = createdUserResult.user.id;

    let selectedPlan:
      | {
          id: string;
          name: string;
          price: number;
        }
      | null = null;

    if (selectedPlanoId) {
      const { data: planData, error: planError } = await admin
        .from('plans')
        .select('id, name, price')
        .eq('id', selectedPlanoId)
        .maybeSingle();

      if (planError) {
        throw planError;
      }

      selectedPlan = planData
        ? {
            id: planData.id,
            name: planData.name,
            price: Number(planData.price),
          }
        : null;
    }

    const studentPayload = {
      linked_auth_user_id: createdAuthUserId,
      created_by_auth_user_id: callerUserId,
      name: nome,
      email: normalizedEmail,
      phone: asNullableString(aluno.telefone),
      cellphone: asNullableString(aluno.celular),
      cpf: asNullableString(aluno.cpf),
      rg: asNullableString(aluno.rg),
      birth_date: asNullableString(aluno.data_nascimento),
      gender: asNullableString(aluno.genero),
      marital_status: asNullableString(aluno.estado_civil),
      profession: asNullableString(aluno.profissao),
      zip_code: asNullableString(aluno.cep),
      address: asNullableString(aluno.endereco),
      number: asNullableString(aluno.numero),
      complement: asNullableString(aluno.complemento),
      bairro: asNullableString(aluno.bairro),
      city: asNullableString(aluno.cidade),
      state: asNullableString(aluno.estado),
      emergency_contact: asNullableString(aluno.contato_emergencia_nome),
      emergency_phone: asNullableString(aluno.contato_emergencia_telefone),
      emergency_relationship: asNullableString(aluno.contato_emergencia_parentesco),
      plan: selectedPlan?.name || asNullableString(aluno.modalidade),
      plan_name: selectedPlan?.name || null,
      plan_id: selectedPlan?.id || null,
      join_date: asNullableString(aluno.data_matricula),
      start_date: asNullableString(aluno.data_matricula),
      due_day: asNullableNumber(aluno.dia_vencimento),
      status: aluno.status === 'inativo' ? 'inativo' : 'ativo',
      notes: asNullableString(aluno.observacoes),
      objectives: asStringArray(aluno.objetivos),
      desired_weight: asNullableNumber(aluno.peso_desejado),
      group: asNullableString(aluno.grupo),
      modality: asNullableString(aluno.modalidade),
    };

    const { data: studentResult, error: studentError } = await admin
      .from('students')
      .insert([studentPayload])
      .select('id')
      .single();

    if (studentError || !studentResult) {
      throw studentError || new Error('Nao foi possivel criar o aluno.');
    }

    createdStudentId = studentResult.id;

    const { error: profileError } = await admin
      .from('user_profiles')
      .upsert({
        id: createdAuthUserId,
        role: 'aluno',
        display_name: nome,
        must_change_password: true,
        is_super_admin: false,
      });

    if (profileError) {
      throw profileError;
    }

    if (selectedPlan) {
      const { error: assinaturaError } = await admin
        .from('assinaturas')
        .insert([
          {
            student_id: studentResult.id,
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            plan_price: selectedPlan.price,
          },
        ]);

      if (assinaturaError) {
        throw assinaturaError;
      }
    }

    return NextResponse.json({
      id: studentResult.id,
      auth_user_id: createdAuthUserId,
      temporary_password: DEFAULT_PASSWORD,
      message: 'Aluno e acesso criados com sucesso.',
    });
  } catch (error) {
    if (createdStudentId) {
      try {
        await getSupabaseAdmin().from('students').delete().eq('id', createdStudentId);
      } catch {}
    }

    if (createdAuthUserId) {
      try {
        await getSupabaseAdmin().auth.admin.deleteUser(createdAuthUserId);
      } catch {}
    }

    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao criar aluno com acesso:', error);
    const diagnosticMessage =
      error instanceof Error && error.message
        ? error.message
        : 'Nao foi possivel criar o aluno com acesso.';
    return NextResponse.json(
      { error: diagnosticMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, callerProfile } = await requireAuthenticatedCaller(request);
    assertAdminCaller(callerProfile);

    const studentId = request.nextUrl.searchParams.get('id')?.trim();
    if (!studentId) {
      throw new ApiRouteError(400, 'Informe o aluno que sera excluido.');
    }

    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id, name, linked_auth_user_id')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) {
      throw studentError;
    }

    if (!student) {
      throw new ApiRouteError(404, 'Aluno nao encontrado.');
    }

    if (student.linked_auth_user_id) {
      const targetProfile = await getTargetProfile(student.linked_auth_user_id);
      preventEditingProtectedSuperAdmin(callerProfile, targetProfile);
    }

    await deleteStudentCascade(admin, studentId);

    if (student.linked_auth_user_id) {
      const { error: profileDeleteError } = await admin
        .from('user_profiles')
        .delete()
        .eq('id', student.linked_auth_user_id);

      if (profileDeleteError) {
        throw profileDeleteError;
      }

      const { error: authDeleteError } = await admin.auth.admin.deleteUser(student.linked_auth_user_id);
      if (authDeleteError) {
        throw authDeleteError;
      }
    }

    return NextResponse.json({
      message: 'Aluno excluido com sucesso.',
      deleted_student_id: studentId,
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao excluir aluno:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : 'Nao foi possivel excluir o aluno.',
      },
      { status: 500 },
    );
  }
}
