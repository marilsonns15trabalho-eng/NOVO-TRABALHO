import { NextRequest, NextResponse } from 'next/server';
import { ApiRouteError } from '@/lib/server/admin-auth';
import { hashSecretAnswer } from '@/lib/server/secret-recovery';
import { findAuthUserByEmail, getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      secretAnswer?: string;
      newPassword?: string;
    };

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const secretAnswer =
      typeof body?.secretAnswer === 'string' ? body.secretAnswer.trim() : '';
    const newPassword =
      typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';

    if (!email || !secretAnswer || !newPassword) {
      throw new ApiRouteError(400, 'Preencha e-mail, resposta secreta e nova senha.');
    }

    if (newPassword.length < 6) {
      throw new ApiRouteError(400, 'A nova senha deve ter pelo menos 6 caracteres.');
    }

    const authUser = await findAuthUserByEmail(email);
    if (!authUser) {
      throw new ApiRouteError(404, 'Nao foi possivel validar a recuperacao de senha.');
    }

    const admin = getSupabaseAdmin();
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('secret_answer_hash, password_recovery_enabled')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.password_recovery_enabled || !profile.secret_answer_hash) {
      throw new ApiRouteError(404, 'Nao foi possivel validar a recuperacao de senha.');
    }

    if (profile.secret_answer_hash !== hashSecretAnswer(secretAnswer)) {
      throw new ApiRouteError(403, 'Resposta secreta invalida.');
    }

    const { error: passwordError } = await admin.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    });

    if (passwordError) {
      throw new ApiRouteError(400, passwordError.message);
    }

    const { error: updateProfileError } = await admin
      .from('user_profiles')
      .update({
        must_change_password: false,
        last_password_change_at: new Date().toISOString(),
      })
      .eq('id', authUser.id);

    if (updateProfileError) {
      throw updateProfileError;
    }

    return NextResponse.json({
      message: 'Senha atualizada com sucesso.',
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao recuperar senha:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel concluir a recuperacao de senha.' },
      { status: 500 }
    );
  }
}
