import { createClient } from '@supabase/supabase-js';
import { MOCK_USER_ID } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retorna o ID do usuário autenticado ou fallback para MOCK_USER_ID.
 * Usar em todos os services no lugar de MOCK_USER_ID direto.
 */
export async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || MOCK_USER_ID;
}
