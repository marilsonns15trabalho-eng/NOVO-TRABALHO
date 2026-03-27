import { NextRequest, NextResponse } from 'next/server';
import {
  ApiRouteError,
  assertAdminCaller,
  getTargetProfile,
  preventEditingProtectedSuperAdmin,
  requireAuthenticatedCaller,
} from '@/lib/server/admin-auth';

export const runtime = 'nodejs';

type ManagedRole = 'admin' | 'professor' | 'aluno';

function isValidRole(value: unknown): value is ManagedRole {
  return value === 'admin' || value === 'professor' || value === 'aluno';
}

export async function POST(request: NextRequest) {
  try {
    const { admin, callerProfile, callerUserId } = await requireAuthenticatedCaller(request);
    assertAdminCaller(callerProfile);

    const body = (await request.json()) as { userId?: string; newRole?: ManagedRole };
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';

    if (!userId) {
      throw new ApiRouteError(400, 'Usuario alvo nao informado.');
    }

    if (!isValidRole(body?.newRole)) {
      throw new ApiRouteError(400, 'Role invalida.');
    }

    if (userId === callerUserId) {
      throw new ApiRouteError(403, 'Voce nao pode alterar seu proprio nivel de acesso.');
    }

    const targetProfile = await getTargetProfile(userId);

    if (!targetProfile) {
      throw new ApiRouteError(404, 'Perfil alvo nao encontrado.');
    }

    preventEditingProtectedSuperAdmin(callerProfile, targetProfile);

    if (!callerProfile.is_super_admin) {
      if (targetProfile.role === 'admin' || body.newRole === 'admin') {
        throw new ApiRouteError(
          403,
          'Somente o super usuario pode promover ou alterar administradores.'
        );
      }
    }

    const { error } = await admin
      .from('user_profiles')
      .update({ role: body.newRole })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Role atualizada com sucesso.' });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao atualizar role:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel atualizar a role.' },
      { status: 500 }
    );
  }
}
