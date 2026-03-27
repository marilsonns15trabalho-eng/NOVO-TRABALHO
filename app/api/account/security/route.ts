import { NextRequest, NextResponse } from 'next/server';
import {
  ApiRouteError,
  requireAuthenticatedCaller,
} from '@/lib/server/admin-auth';
import { isAllowedSecretQuestion } from '@/lib/security-questions';
import { updateUserProfileSecurity } from '@/lib/server/profile-security';
import { hashSecretAnswer } from '@/lib/server/secret-recovery';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { admin, callerUserId } = await requireAuthenticatedCaller(request);
    const body = (await request.json()) as {
      newPassword?: string;
      passwordWasUpdated?: boolean;
      secretQuestion?: string;
      secretAnswer?: string;
    };

    const newPassword =
      typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';
    const passwordWasUpdated = body?.passwordWasUpdated === true;
    const secretQuestion =
      typeof body?.secretQuestion === 'string' ? body.secretQuestion.trim() : '';
    const secretAnswer =
      typeof body?.secretAnswer === 'string' ? body.secretAnswer.trim() : '';

    if (!newPassword && !passwordWasUpdated && !secretQuestion && !secretAnswer) {
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

    if (secretQuestion && !isAllowedSecretQuestion(secretQuestion)) {
      throw new ApiRouteError(400, 'Selecione uma pergunta secreta valida.');
    }

    if (newPassword && !passwordWasUpdated) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(callerUserId, {
        password: newPassword,
      });

      if (passwordError) {
        throw new ApiRouteError(400, passwordError.message);
      }
    }

    const profileUpdates: Record<string, unknown> = {};

    if (newPassword || passwordWasUpdated) {
      profileUpdates.must_change_password = false;
      profileUpdates.last_password_change_at = new Date().toISOString();
    }

    if (secretQuestion && secretAnswer) {
      profileUpdates.secret_question = secretQuestion;
      profileUpdates.secret_answer_hash = hashSecretAnswer(secretAnswer);
      profileUpdates.password_recovery_enabled = true;
    }

    let warning: string | null = null;
    if (Object.keys(profileUpdates).length > 0) {
      const result = await updateUserProfileSecurity(admin, callerUserId, profileUpdates);
      warning = result.warning;
    }

    return NextResponse.json({
      message: warning || 'Seguranca da conta atualizada com sucesso.',
      must_change_password: false,
      password_recovery_enabled: warning
        ? false
        : Boolean(profileUpdates.password_recovery_enabled),
      warning,
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
