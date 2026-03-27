import { NextRequest, NextResponse } from 'next/server';
import {
  ApiRouteError,
  requireAuthenticatedCaller,
} from '@/lib/server/admin-auth';
import { hashSecretAnswer } from '@/lib/server/secret-recovery';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { admin, callerUserId } = await requireAuthenticatedCaller(request);
    const body = (await request.json()) as {
      newPassword?: string;
      secretQuestion?: string;
      secretAnswer?: string;
    };

    const newPassword =
      typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';
    const secretQuestion =
      typeof body?.secretQuestion === 'string' ? body.secretQuestion.trim() : '';
    const secretAnswer =
      typeof body?.secretAnswer === 'string' ? body.secretAnswer.trim() : '';

    if (!newPassword && !secretQuestion && !secretAnswer) {
      throw new ApiRouteError(400, 'Nenhuma alteracao de seguranca foi informada.');
    }

    if (newPassword && newPassword.length < 6) {
      throw new ApiRouteError(400, 'A nova senha deve ter pelo menos 6 caracteres.');
    }

    if ((secretQuestion && !secretAnswer) || (!secretQuestion && secretAnswer)) {
      throw new ApiRouteError(
        400,
        'Informe a pergunta secreta e a resposta secreta juntas.'
      );
    }

    if (newPassword) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(callerUserId, {
        password: newPassword,
      });

      if (passwordError) {
        throw new ApiRouteError(400, passwordError.message);
      }
    }

    const profileUpdates: Record<string, unknown> = {};

    if (newPassword) {
      profileUpdates.must_change_password = false;
      profileUpdates.last_password_change_at = new Date().toISOString();
    }

    if (secretQuestion && secretAnswer) {
      profileUpdates.secret_question = secretQuestion;
      profileUpdates.secret_answer_hash = hashSecretAnswer(secretAnswer);
      profileUpdates.password_recovery_enabled = true;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await admin
        .from('user_profiles')
        .update(profileUpdates)
        .eq('id', callerUserId);

      if (profileError) {
        throw profileError;
      }
    }

    return NextResponse.json({
      message: 'Seguranca da conta atualizada com sucesso.',
      must_change_password: false,
      password_recovery_enabled: Boolean(
        profileUpdates.password_recovery_enabled
      ),
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao atualizar seguranca da conta:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel atualizar a seguranca da conta.' },
      { status: 500 }
    );
  }
}
