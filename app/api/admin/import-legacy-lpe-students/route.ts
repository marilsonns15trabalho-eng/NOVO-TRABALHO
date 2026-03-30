import { NextRequest, NextResponse } from 'next/server';
import legacyStudents from '@/data/legacy-lpe-students.json';
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

type ImportBody = {
  dryRun?: boolean;
};

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

export async function POST(request: NextRequest) {
  try {
    const { admin, callerProfile } = await requireAuthenticatedCaller(request);
    assertAdminCaller(callerProfile);

    const body = ((await request.json().catch(() => ({}))) || {}) as ImportBody;
    const dryRun = Boolean(body.dryRun);
    const students = legacyStudents as LegacyStudent[];

    const [existingStudentsRes, authUsersByEmail] = await Promise.all([
      admin
        .from('students')
        .select('id, legacy_lpe_id, email, linked_auth_user_id'),
      listAuthUsersByEmail(),
    ]);

    if (existingStudentsRes.error) {
      throw existingStudentsRes.error;
    }

    const existingStudents = existingStudentsRes.data || [];
    const studentByLegacyId = new Map<number, (typeof existingStudents)[number]>();
    const studentByEmail = new Map<string, (typeof existingStudents)[number]>();

    for (const student of existingStudents) {
      if (typeof student.legacy_lpe_id === 'number') {
        studentByLegacyId.set(student.legacy_lpe_id, student);
      }
      const email = normalizeEmail(student.email || '');
      if (email) {
        studentByEmail.set(email, student);
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
      total_candidates: students.length,
      created_auth_users: 0,
      reused_auth_users: 0,
      created_students: 0,
      updated_students: 0,
      skipped_role_conflicts: [] as Array<{ email: string; role: string }>,
      imported: [] as Array<{ legacy_lpe_id: number; email: string; name: string }>,
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
          const { error: updateError } = await admin
            .from('students')
            .update(studentPayload)
            .eq('id', existingStudent.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          const { error: insertError } = await admin.from('students').insert([studentPayload]);
          if (insertError) {
            throw insertError;
          }
        }
      }

      if (existingStudent?.id) {
        result.updated_students += 1;
      } else {
        result.created_students += 1;
      }

      result.imported.push({
        legacy_lpe_id: legacyStudent.legacy_lpe_id,
        email,
        name: legacyStudent.name,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao importar alunos legado LPE:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : 'Nao foi possivel importar os alunos do legado.',
      },
      { status: 500 },
    );
  }
}
