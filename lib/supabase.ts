import { createClient } from '@supabase/supabase-js';

// Usando os nomes de variáveis fornecidos pelo usuário no prompt do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://umdquhtwunluqjzhfjza.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_pb_JkJZMoOFsNCwGxUnJVA_XvpFRLKb';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Supabase credentials missing in production!');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
