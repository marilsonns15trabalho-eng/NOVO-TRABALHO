import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
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

/** Segundos antes do fim da validade do access token em que já forçamos refresh (rede + relógio). */
const SESSION_REFRESH_LEEWAY_SEC = 120;

function isSessionStale(session: { expires_at?: number } | null): boolean {
  if (!session?.expires_at) return false;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at <= now + SESSION_REFRESH_LEEWAY_SEC;
}

/**
 * Renova o access token se estiver expirado ou perto de expirar.
 * Navegadores reduzem timers em abas em segundo plano; o refresh automático pode não rodar a tempo.
 */
export async function refreshSessionIfStale(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!isSessionStale(session)) return;
  await supabase.auth.refreshSession();
}

/**
 * Usuário autenticado com JWT válido para o PostgREST (renova se o token estiver velho).
 */
export async function getAuthenticatedUser(): Promise<User> {
  const { data: { session: s0 } } = await supabase.auth.getSession();
  if (!s0?.user) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (isSessionStale(s0)) {
    const { data: { session: s1 }, error } = await supabase.auth.refreshSession();
    if (error || !s1?.user) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return s1.user;
  }
  return s0.user;
}

