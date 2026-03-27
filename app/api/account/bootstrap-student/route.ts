import { NextRequest, NextResponse } from 'next/server';
import { ApiRouteError, requireAuthenticatedCaller } from '@/lib/server/admin-auth';
import { normalizeEmail } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

function buildDisplayName(params: {
  profileName?: string | null;
  metadataName?: string | null;
  email?: string | null;
}) {
  const base =
    params.profileName?.trim() ||
    params.metadataName?.trim() ||
    params.email?.split('@')[0]?.trim() ||
    'Aluno';

  return base;
}

export async function POST(request: NextRequest) {
  try {
    const { admin, accessToken, callerProfile, callerUserId } = await requireAuthenticatedCaller(request);

    if (callerProfile.role !== 'aluno') {
      return NextResponse.json({
        student_id: null,
        mode: 'skipped',
      });
    }

    const {
      data: { user },
      error: callerError,
    } = await admin.auth.getUser(accessToken);

    if (callerError || !user) {
      throw new ApiRouteError(401, 'Sessao expirada. Faca login novamente.');
    }

    const { data: currentStudent, error: currentStudentError } = await admin
      .from('students')
      .select('id')
      .eq('linked_auth_user_id', callerUserId)
      .maybeSingle();

    if (currentStudentError) {
      throw currentStudentError;
    }

    if (currentStudent?.id) {
      return NextResponse.json({
        student_id: currentStudent.id,
        mode: 'existing',
      });
    }

    const normalizedEmail = user.email ? normalizeEmail(user.email) : null;
    const displayName = buildDisplayName({
      profileName: callerProfile.display_name,
      metadataName:
        typeof user.user_metadata?.display_name === 'string'
          ? user.user_metadata.display_name
          : typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : null,
      email: normalizedEmail,
    });

    if (normalizedEmail) {
      const { data: emailStudent, error: emailStudentError } = await admin
        .from('students')
        .select('id, linked_auth_user_id, name')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (emailStudentError) {
        throw emailStudentError;
      }

      if (emailStudent?.id) {
        if (
          emailStudent.linked_auth_user_id &&
          emailStudent.linked_auth_user_id !== callerUserId
        ) {
          throw new ApiRouteError(
            409,
            'Ja existe um cadastro de aluno vinculado a outro acesso com este e-mail.'
          );
        }

        const { error: linkError } = await admin
          .from('students')
          .update({
            linked_auth_user_id: callerUserId,
            email: normalizedEmail,
            name: emailStudent.name?.trim() || displayName,
          })
          .eq('id', emailStudent.id);

        if (linkError) {
          throw linkError;
        }

        return NextResponse.json({
          student_id: emailStudent.id,
          mode: 'linked_existing',
        });
      }
    }

    const { data: createdStudent, error: createStudentError } = await admin
      .from('students')
      .insert([
        {
          linked_auth_user_id: callerUserId,
          created_by_auth_user_id: null,
          name: displayName,
          email: normalizedEmail,
          status: 'ativo',
        },
      ])
      .select('id')
      .single();

    if (createStudentError || !createdStudent?.id) {
      throw createStudentError || new Error('Nao foi possivel inicializar o cadastro do aluno.');
    }

    return NextResponse.json({
      student_id: createdStudent.id,
      mode: 'created',
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao preparar cadastro automatico do aluno:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel preparar o cadastro automatico do aluno.' },
      { status: 500 }
    );
  }
}
