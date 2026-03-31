import { createClient } from '@supabase/supabase-js';
import type { Session, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'lioness-auth',
  },
});

export interface SafeUserProfile {
  id: string;
  role: string;
  display_name: string | null;
  created_at: string | null;
  is_super_admin?: boolean | null;
  must_change_password?: boolean | null;
  secret_question?: string | null;
  password_recovery_enabled?: boolean | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

type SafeSupabaseResponse<T> = {
  data: T;
  error: { message?: string } | null;
};

let refreshSessionPromise: Promise<Session | null> | null = null;
const PROFILE_RPC_NAME = 'get_my_profile';

/** Segundos antes do fim da validade do access token em que ja forcamos refresh (rede + relogio). */
const SESSION_REFRESH_LEEWAY_SEC = 120;
const MAX_CONSECUTIVE_REFRESH_FAILURES = 2;

let consecutiveRefreshFailures = 0;

function isSessionStale(session: { expires_at?: number } | null): boolean {
  if (!session?.expires_at) return false;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at <= now + SESSION_REFRESH_LEEWAY_SEC;
}

async function clearLocalSessionState() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    console.warn('Falha ao limpar sessao local do Supabase:', error);
  }

  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('lioness-auth');
  } catch {}
}

/**
 * Renova o access token se estiver expirado ou perto de expirar.
 * Navegadores reduzem timers em abas em segundo plano; o refresh automatico pode nao rodar a tempo.
 */
export async function refreshSessionIfStale(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !isSessionStale(session)) return;

  await refreshSessionWithLock();
}

async function refreshSessionWithLock(): Promise<Session | null> {
  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        consecutiveRefreshFailures += 1;
        console.error('Erro ao renovar sessao:', error);

        if (consecutiveRefreshFailures >= MAX_CONSECUTIVE_REFRESH_FAILURES) {
          await clearLocalSessionState();
        }

        return null;
      }

      if (!session) {
        consecutiveRefreshFailures += 1;
        console.warn('Sessao renovada nao encontrada');

        if (consecutiveRefreshFailures >= MAX_CONSECUTIVE_REFRESH_FAILURES) {
          await clearLocalSessionState();
        }

        return null;
      }

      consecutiveRefreshFailures = 0;
      return session;
    })().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return refreshSessionPromise;
}

export async function getSafeSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Erro ao obter sessao:', error);
      return null;
    }

    if (!session) {
      console.warn('Sessao nao encontrada');
      return null;
    }

    if (!isSessionStale(session)) {
      return session;
    }

    return await refreshSessionWithLock();
  } catch (error) {
    console.error('Erro inesperado ao obter sessao:', error);
    return null;
  }
}

export async function safeSupabaseQuery<T>(
  query: PromiseLike<SafeSupabaseResponse<T>>
): Promise<T> {
  const session = await getSafeSession();

  if (!session) {
    throw new Error('SEM SESSAO -> BLOQUEADO');
  }

  const { data, error } = await query;

  if (error) {
    console.error('ERRO SUPABASE:', error);
    throw error;
  }

  return data;
}

export async function getUserProfileSafe(): Promise<SafeUserProfile | null> {
  const session = await getSafeSession();

  if (!session) return null;

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(PROFILE_RPC_NAME);

    if (!rpcError) {
      const profile = Array.isArray(rpcData) ? (rpcData[0] ?? null) : rpcData;
      if (!profile) return null;
      return profile as SafeUserProfile;
    }

    // Compatibilidade com ambientes ainda sem a RPC aplicada.
    if (rpcError.code !== 'PGRST202' && rpcError.code !== '42883') {
      console.error('ERRO SUPABASE:', rpcError);
      throw rpcError;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, role, display_name, created_at, is_super_admin, must_change_password, secret_question, password_recovery_enabled, avatar_path, avatar_updated_at')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('ERRO SUPABASE:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar profile:', error);
    throw error;
  }
}

const activeFetches = new Set<string>();

export async function preventMultipleFetch<T>(
  fn: () => Promise<T>,
  key = 'global'
): Promise<T | undefined> {
  if (activeFetches.has(key)) {
    console.warn('Bloqueado fetch duplicado');
    return undefined;
  }

  try {
    activeFetches.add(key);
    return await fn();
  } finally {
    activeFetches.delete(key);
  }
}

export function assertUser<T extends { id?: string | null }>(
  user: T | null | undefined
): asserts user is T & { id: string } {
  if (!user?.id) {
    throw new Error('USER INVALIDO');
  }
}

export function debugSession() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  supabase.auth.getSession().then((res) => {
    console.debug('SESSION DEBUG:', {
      hasSession: Boolean(res.data.session),
      userId: res.data.session?.user?.id ?? null,
      expiresAt: res.data.session?.expires_at ?? null,
    });
  });
}

/**
 * Usuario autenticado com JWT valido para o PostgREST (renova se o token estiver velho).
 */
export async function getAuthenticatedUser(): Promise<User> {
  const session = await getSafeSession();

  if (!session?.user) {
    throw new Error('Sessao expirada. Faca login novamente.');
  }

  assertUser(session.user);
  return session.user;
}
