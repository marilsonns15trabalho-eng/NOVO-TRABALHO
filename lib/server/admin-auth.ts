import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export class ApiRouteError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface CallerProfile {
  id: string;
  role: 'admin' | 'professor' | 'aluno';
  display_name: string | null;
  is_super_admin: boolean;
  must_change_password: boolean;
}

export async function requireAuthenticatedCaller(request: NextRequest): Promise<{
  admin: ReturnType<typeof getSupabaseAdmin>;
  accessToken: string;
  callerUserId: string;
  callerProfile: CallerProfile;
}> {
  const authorization = request.headers.get('authorization') || '';

  if (!authorization.startsWith('Bearer ')) {
    throw new ApiRouteError(401, 'Sessao ausente ou invalida.');
  }

  const accessToken = authorization.slice('Bearer '.length).trim();
  if (!accessToken) {
    throw new ApiRouteError(401, 'Sessao ausente ou invalida.');
  }

  const admin = getSupabaseAdmin();
  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(accessToken);

  if (authError || !user) {
    throw new ApiRouteError(401, 'Sessao expirada. Faca login novamente.');
  }

  const { data: callerProfile, error: profileError } = await admin
    .from('user_profiles')
    .select('id, role, display_name, is_super_admin, must_change_password')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    throw new ApiRouteError(403, 'Perfil de acesso nao encontrado.');
  }

  return {
    admin,
    accessToken,
    callerUserId: user.id,
    callerProfile: {
      id: callerProfile.id,
      role: callerProfile.role,
      display_name: callerProfile.display_name,
      is_super_admin: Boolean(callerProfile.is_super_admin),
      must_change_password: Boolean(callerProfile.must_change_password),
    },
  };
}

export function assertAdminCaller(profile: CallerProfile) {
  if (profile.role !== 'admin' && !profile.is_super_admin) {
    throw new ApiRouteError(403, 'Acao restrita a administradores.');
  }
}

export async function getTargetProfile(userId: string): Promise<CallerProfile | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_profiles')
    .select('id, role, display_name, is_super_admin, must_change_password')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    role: data.role,
    display_name: data.display_name,
    is_super_admin: Boolean(data.is_super_admin),
    must_change_password: Boolean(data.must_change_password),
  };
}

export function preventEditingProtectedSuperAdmin(
  callerProfile: CallerProfile,
  targetProfile: CallerProfile | null
) {
  if (!targetProfile?.is_super_admin) {
    return;
  }

  if (callerProfile.id !== targetProfile.id) {
    throw new ApiRouteError(403, 'O super usuario so pode ser alterado por ele mesmo.');
  }
}
