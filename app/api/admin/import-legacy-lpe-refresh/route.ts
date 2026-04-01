import { NextRequest, NextResponse } from 'next/server';
import legacyStudents from '@/data/legacy-lpe-refresh-students.json';
import legacyAvaliacoes from '@/data/legacy-lpe-refresh-avaliacoes.json';
import {
  ApiRouteError,
  assertAdminCaller,
  requireAuthenticatedCaller,
} from '@/lib/server/admin-auth';
import { getSupabaseAdmin, normalizeEmail } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = '123456';

type LegacyStudent = {
  legacy_lpe_id: number;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  profession?: string | null;
  zip_code?: string | null;
  address?: string | null;
  city?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  notes?: string | null;
  status?: 'ativo' | 'inativo';
  group?: string | null;
  modality?: string | null;
  objectives?: string[];
  desired_weight?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type LegacyAvaliacao = {
  legacy_lpe_id: number;
  legacy_lpe_student_id: number;
  student_email?: string | null;
  student_name?: string | null;
  data: string;
  peso?: number | null;
  altura?: number | null;
  pescoco?: number | null;
  ombro?: number | null;
  torax?: number | null;
  cintura?: number | null;
  abdome?: number | null;
  quadril?: number | null;
  braco_esquerdo?: number | null;
  braco_direito?: number | null;
  coxa_esquerda?: number | null;
  coxa_direita?: number | null;
  panturrilha_esquerda?: number | null;
  panturrilha_direita?: number | null;
  tricipital?: number | null;
  subescapular?: number | null;
  supra_iliaca?: number | null;
  abdominal?: number | null;
  imc?: number | null;
  percentual_gordura?: number | null;
  massa_gorda?: number | null;
  massa_magra?: number | null;
  soma_dobras?: number | null;
  rcq?: number | null;
  protocolo?: string | null;
  observacoes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ImportBody = {
  dryRun?: boolean;
};

type ExistingStudent = {
  id: string;
  legacy_lpe_id: number | null;
  email: string | null;
  linked_auth_user_id: string | null;
};

type ExistingAvaliacao = {
  id: string;
  legacy_lpe_id: number | null;
};

function n(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProtocol(value: unknown): string {
  if (typeof value !== 'string') {
    return 'faulkner';
  }

  const cleaned = value.trim().toLowerCase();
  if (cleaned === 'navy') {
    return 'navy';
  }

  return 'faulkner';
}

async function listAuthUsersByEmail() {
  const admin = getSupabaseAdmin();
  const emailMap = new Map<string, string>();
  let page = 1;
  const perPage = 500;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const users = data.users || [];
    for (const user of users) {
      const email = normalizeEmail(user.email || '');
      if (email) {
        emailMap.set(email, user.id);
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return emailMap;
}

function buildAvaliacaoPayload(avaliacao: LegacyAvaliacao, studentId: string) {
  return {
    legacy_lpe_id: avaliacao.legacy_lpe_id,
    student_id: studentId,
    data: avaliacao.data,
    peso: n(avaliacao.peso),
    altura: n(avaliacao.altura),
    pescoco: n(avaliacao.pescoco),
    ombro: n(avaliacao.ombro),
    torax: n(avaliacao.torax),
    cintura: n(avaliacao.cintura),
    abdome: n(avaliacao.abdome),
    quadril: n(avaliacao.quadril),
    braco_direito: n(avaliacao.braco_direito),
    braco_esquerdo: n(avaliacao.braco_esquerdo),
    coxa_direita: n(avaliacao.coxa_direita),
    coxa_esquerda: n(avaliacao.coxa_esquerda),
    panturrilha_direita: n(avaliacao.panturrilha_direita),
    panturrilha_esquerda: n(avaliacao.panturrilha_esquerda),
    tricipital: n(avaliacao.tricipital),
    subescapular: n(avaliacao.subescapular),
    supra_iliaca: n(avaliacao.supra_iliaca),
    abdominal: n(avaliacao.abdominal),
    imc: n(avaliacao.imc),
    percentual_gordura: n(avaliacao.percentual_gordura),
    gordura_corporal: n(avaliacao.percentual_gordura),
    massa_gorda: n(avaliacao.massa_gorda),
    massa_magra: n(avaliacao.massa_magra),
    soma_dobras: n(avaliacao.soma_dobras),
    rcq: n(avaliacao.rcq),
    protocolo: normalizeProtocol(avaliacao.protocolo),
    observacoes: avaliacao.observacoes || null,
    medidas: {
      pescoco: n(avaliacao.pescoco),
      ombro: n(avaliacao.ombro),
      torax: n(avaliacao.torax),
      cintura: n(avaliacao.cintura),
      abdome: n(avaliacao.abdome),
      quadril: n(avaliacao.quadril),
      braco_direito: n(avaliacao.braco_direito),
      braco_esquerdo: n(avaliacao.braco_esquerdo),
      coxa_direita: n(avaliacao.coxa_direita),
      coxa_esquerda: n(avaliacao.coxa_esquerda),
      panturrilha_direita: n(avaliacao.panturrilha_direita),
      panturrilha_esquerda: n(avaliacao.panturrilha_esquerda),
      rcq: n(avaliacao.rcq),
    },
    dobras: {
      tricipital: n(avaliacao.tricipital),
      subescapular: n(avaliacao.subescapular),
      supra_iliaca: n(avaliacao.supra_iliaca),
      abdominal: n(avaliacao.abdominal),
      soma_dobras: n(avaliacao.soma_dobras),
    },
    created_at: avaliacao.created_at || null,
    updated_at: avaliacao.updated_at || avaliacao.created_at || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { admin, callerProfile } = await requireAuthenticatedCaller(request);
    assertAdminCaller(callerProfile);

    const body = ((await request.json().catch(() => ({}))) || {}) as ImportBody;
    const dryRun = Boolean(body.dryRun);
    const students = legacyStudents as LegacyStudent[];
    const avaliacoes = legacyAvaliacoes as LegacyAvaliacao[];

    const [existingStudentsRes, existingAvaliacoesRes, authUsersByEmail] = await Promise.all([
      admin.from('students').select('id, legacy_lpe_id, email, linked_auth_user_id'),
      admin.from('avaliacoes').select('id, legacy_lpe_id'),
      listAuthUsersByEmail(),
    ]);

    if (existingStudentsRes.error) {
      throw existingStudentsRes.error;
    }

    if (existingAvaliacoesRes.error) {
      throw existingAvaliacoesRes.error;
    }

    const existingStudents = (existingStudentsRes.data || []) as ExistingStudent[];
    const existingAvaliacoes = (existingAvaliacoesRes.data || []) as ExistingAvaliacao[];

    const studentByLegacyId = new Map<number, ExistingStudent>();
    const studentByEmail = new Map<string, ExistingStudent>();
    for (const student of existingStudents) {
      if (typeof student.legacy_lpe_id === 'number') {
        studentByLegacyId.set(student.legacy_lpe_id, student);
      }
      const email = normalizeEmail(student.email || '');
      if (email) {
        studentByEmail.set(email, student);
      }
    }

    const avaliacaoByLegacyId = new Map<number, ExistingAvaliacao>();
    for (const avaliacao of existingAvaliacoes) {
      if (typeof avaliacao.legacy_lpe_id === 'number') {
        avaliacaoByLegacyId.set(avaliacao.legacy_lpe_id, avaliacao);
      }
    }

    const profileIds = Array.from(new Set(Array.from(authUsersByEmail.values())));
    const profileRoleMap = new Map<string, string>();

    if (profileIds.length > 0) {
      const { data: profiles, error: profilesError } = await admin
        .from('user_profiles')
        .select('id, role')
        .in('id', profileIds);

      if (profilesError) {
        throw profilesError;
      }

      for (const profile of profiles || []) {
        profileRoleMap.set(profile.id, profile.role);
      }
    }

    const result = {
      dry_run: dryRun,
      default_password: DEFAULT_PASSWORD,
      total_student_candidates: students.length,
      total_avaliacao_candidates: avaliacoes.length,
      created_auth_users: 0,
      reused_auth_users: 0,
      created_students: 0,
      updated_students: 0,
      created_avaliacoes: 0,
      updated_avaliacoes: 0,
      skipped_role_conflicts: [] as Array<{ email: string; role: string }>,
      skipped_avaliacoes_missing_student: [] as Array<{
        legacy_lpe_id: number;
        legacy_lpe_student_id: number;
        student_email: string | null;
      }>,
      imported_students: [] as Array<{ legacy_lpe_id: number; email: string; name: string }>,
      imported_avaliacoes: [] as Array<{
        legacy_lpe_id: number;
        legacy_lpe_student_id: number;
        student_email: string | null;
        data: string;
      }>,
    };

    for (const legacyStudent of students) {
      const email = normalizeEmail(legacyStudent.email);
      if (!email) {
        continue;
      }

      const existingStudent =
        studentByLegacyId.get(legacyStudent.legacy_lpe_id) || studentByEmail.get(email) || null;

      let authUserId = existingStudent?.linked_auth_user_id || authUsersByEmail.get(email) || null;

      if (authUserId) {
        const existingRole = profileRoleMap.get(authUserId);
        if (existingRole && existingRole !== 'aluno') {
          result.skipped_role_conflicts.push({ email, role: existingRole });
          continue;
        }
        result.reused_auth_users += 1;
      } else {
        if (!dryRun) {
          const { data: createdUserResult, error: createUserError } = await admin.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: {
              name: legacyStudent.name,
              display_name: legacyStudent.name,
            },
          });

          if (createUserError || !createdUserResult.user?.id) {
            throw createUserError || new Error(`Nao foi possivel criar o auth user de ${email}.`);
          }

          authUserId = createdUserResult.user.id;
          authUsersByEmail.set(email, authUserId);
          profileRoleMap.set(authUserId, 'aluno');
        } else {
          authUserId = `dry-run-auth-${legacyStudent.legacy_lpe_id}`;
        }

        result.created_auth_users += 1;
      }

      const studentPayload = {
        legacy_lpe_id: legacyStudent.legacy_lpe_id,
        linked_auth_user_id: authUserId,
        name: legacyStudent.name,
        email,
        phone: legacyStudent.phone || null,
        cellphone: legacyStudent.phone || null,
        cpf: legacyStudent.cpf || null,
        birth_date: legacyStudent.birth_date || null,
        gender: legacyStudent.gender || null,
        profession: legacyStudent.profession || null,
        zip_code: legacyStudent.zip_code || null,
        address: legacyStudent.address || null,
        city: legacyStudent.city || null,
        emergency_contact: legacyStudent.emergency_contact || null,
        emergency_phone: legacyStudent.emergency_phone || null,
        join_date: legacyStudent.created_at?.slice(0, 10) || null,
        start_date: legacyStudent.created_at?.slice(0, 10) || null,
        status: legacyStudent.status === 'inativo' ? 'inativo' : 'ativo',
        notes: legacyStudent.notes || null,
        objectives: Array.isArray(legacyStudent.objectives) ? legacyStudent.objectives : [],
        desired_weight:
          typeof legacyStudent.desired_weight === 'number' ? legacyStudent.desired_weight : null,
        group: legacyStudent.group || null,
        modality: legacyStudent.modality || null,
        created_at: legacyStudent.created_at || null,
        updated_at: legacyStudent.updated_at || legacyStudent.created_at || null,
      };

      let resolvedStudent: ExistingStudent;

      if (!dryRun) {
        const { error: profileUpsertError } = await admin.from('user_profiles').upsert({
          id: authUserId,
          role: 'aluno',
          display_name: legacyStudent.name,
          must_change_password: true,
          is_super_admin: false,
        });

        if (profileUpsertError) {
          throw profileUpsertError;
        }

        if (existingStudent?.id) {
          const { data: updatedStudent, error: updateError } = await admin
            .from('students')
            .update(studentPayload)
            .eq('id', existingStudent.id)
            .select('id, legacy_lpe_id, email, linked_auth_user_id')
            .single();

          if (updateError || !updatedStudent) {
            throw updateError || new Error(`Nao foi possivel atualizar o aluno ${email}.`);
          }

          resolvedStudent = updatedStudent as ExistingStudent;
        } else {
          const { data: insertedStudent, error: insertError } = await admin
            .from('students')
            .insert([studentPayload])
            .select('id, legacy_lpe_id, email, linked_auth_user_id')
            .single();

          if (insertError || !insertedStudent) {
            throw insertError || new Error(`Nao foi possivel inserir o aluno ${email}.`);
          }

          resolvedStudent = insertedStudent as ExistingStudent;
        }
      } else {
        resolvedStudent = {
          id: existingStudent?.id || `dry-run-student-${legacyStudent.legacy_lpe_id}`,
          legacy_lpe_id: legacyStudent.legacy_lpe_id,
          email,
          linked_auth_user_id: authUserId,
        };
      }

      studentByLegacyId.set(legacyStudent.legacy_lpe_id, resolvedStudent);
      studentByEmail.set(email, resolvedStudent);

      if (existingStudent?.id) {
        result.updated_students += 1;
      } else {
        result.created_students += 1;
      }

      result.imported_students.push({
        legacy_lpe_id: legacyStudent.legacy_lpe_id,
        email,
        name: legacyStudent.name,
      });
    }

    for (const legacyAvaliacao of avaliacoes) {
      const mappedStudent =
        studentByLegacyId.get(legacyAvaliacao.legacy_lpe_student_id) ||
        studentByEmail.get(normalizeEmail(legacyAvaliacao.student_email || '') || '') ||
        null;

      if (!mappedStudent?.id) {
        result.skipped_avaliacoes_missing_student.push({
          legacy_lpe_id: legacyAvaliacao.legacy_lpe_id,
          legacy_lpe_student_id: legacyAvaliacao.legacy_lpe_student_id,
          student_email: legacyAvaliacao.student_email || null,
        });
        continue;
      }

      const existingAvaliacao = avaliacaoByLegacyId.get(legacyAvaliacao.legacy_lpe_id) || null;
      const avaliacaoPayload = buildAvaliacaoPayload(legacyAvaliacao, mappedStudent.id);

      if (!dryRun) {
        if (existingAvaliacao?.id) {
          const { error: updateError } = await admin
            .from('avaliacoes')
            .update(avaliacaoPayload)
            .eq('id', existingAvaliacao.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          const { error: insertError } = await admin.from('avaliacoes').insert([avaliacaoPayload]);
          if (insertError) {
            throw insertError;
          }
        }
      }

      if (existingAvaliacao?.id) {
        result.updated_avaliacoes += 1;
      } else {
        result.created_avaliacoes += 1;
      }

      result.imported_avaliacoes.push({
        legacy_lpe_id: legacyAvaliacao.legacy_lpe_id,
        legacy_lpe_student_id: legacyAvaliacao.legacy_lpe_student_id,
        student_email: legacyAvaliacao.student_email || null,
        data: legacyAvaliacao.data,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao importar legado LPE atualizado:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Nao foi possivel importar o legado atualizado.',
      },
      { status: 500 },
    );
  }
}
