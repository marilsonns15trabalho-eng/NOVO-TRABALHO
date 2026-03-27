import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return cachedAdminClient;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findAuthUserByEmail(email: string) {
  const admin = getSupabaseAdmin();
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await admin
    .schema('auth')
    .from('users')
    .select('id, email')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as { id: string; email: string | null } | null;
}
