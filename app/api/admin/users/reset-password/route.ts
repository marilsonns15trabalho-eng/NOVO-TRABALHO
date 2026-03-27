import { NextRequest, NextResponse } from 'next/server';
import {
  ApiRouteError,
  assertAdminCaller,
  getTargetProfile,
  preventEditingProtectedSuperAdmin,
  requireAuthenticatedCaller,
} from '@/lib/server/admin-auth';

export const runtime = 'nodejs';

const DEFAULT_PASSWORD = '123456';

export async function POST(request: NextRequest) {
  try {
    const { admin, callerProfile } = await requireAuthenticatedCaller(request);
    assertAdminCaller(callerProfile);

    const body = (await request.json()) as { userId?: string; newPassword?: string };
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const newPassword =
      typeof body?.newPassword === 'string' && body.newPassword.trim()
        ? body.newPassword.trim()
        : DEFAULT_PASSWORD;

    if (!userId) {
      throw new ApiRouteError(400, 'Usuario alvo nao informado.');
    }

    if (newPassword.length < 6) {
      throw new ApiRouteError(400, 'A nova senha deve ter pelo menos 6 caracteres.');
    }

    const targetProfile = await getTargetProfile(userId);
    preventEditingProtectedSuperAdmin(callerProfile, targetProfile);

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateAuthError) {
      throw new ApiRouteError(400, updateAuthError.message);
    }

    const { error: profileError } = await admin
      .from('user_profiles')
      .update({
        must_change_password: true,
      })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({
      message: 'Senha resetada com sucesso.',
      temporary_password: newPassword,
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao resetar senha:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel resetar a senha.' },
      { status: 500 }
    );
  }
}
