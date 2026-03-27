import type { SupabaseClient } from '@supabase/supabase-js';

type ProfileSecurityUpdate = {
  must_change_password?: boolean;
  last_password_change_at?: string;
  secret_question?: string;
  secret_answer_hash?: string;
  password_recovery_enabled?: boolean;
};

const SECRET_RECOVERY_COLUMNS = [
  'secret_question',
  'secret_answer_hash',
  'password_recovery_enabled',
] as const;

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as { code?: unknown };
  return typeof candidate.code === 'string' ? candidate.code : '';
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };

  return [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();
}

function findMissingColumn(error: unknown, allowedColumns: string[]): string | null {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (!message) return null;
  if (code && code !== '42703' && code !== 'PGRST204') return null;

  for (const column of allowedColumns) {
    if (message.includes(column.toLowerCase())) {
      return column;
    }
  }

  return null;
}

export function isMissingProfileSecurityColumnError(error: unknown): boolean {
  return (
    findMissingColumn(error, [
      'last_password_change_at',
      ...SECRET_RECOVERY_COLUMNS,
    ]) !== null
  );
}

export async function updateUserProfileSecurity(
  admin: SupabaseClient,
  userId: string,
  updates: ProfileSecurityUpdate
): Promise<{ warning: string | null }> {
  let pending: ProfileSecurityUpdate = { ...updates };
  let warning: string | null = null;

  while (Object.keys(pending).length > 0) {
    const { error } = await admin.from('user_profiles').update(pending).eq('id', userId);

    if (!error) {
      return { warning };
    }

    const missingColumn = findMissingColumn(error, Object.keys(pending));
    if (!missingColumn) {
      throw error;
    }

    if (SECRET_RECOVERY_COLUMNS.includes(missingColumn as (typeof SECRET_RECOVERY_COLUMNS)[number])) {
      warning =
        'A senha foi atualizada, mas a pergunta secreta ainda nao pode ser salva neste banco. Rode phase3_07_account_security_hardening.sql para liberar esse recurso.';
    }

    delete pending[missingColumn as keyof ProfileSecurityUpdate];
  }

  return { warning };
}
