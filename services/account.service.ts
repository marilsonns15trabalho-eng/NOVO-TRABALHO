import { authorizedApiJson, publicApiJson } from '@/lib/api-client';

export interface SaveAccountSecurityPayload {
  newPassword?: string;
  secretQuestion?: string;
  secretAnswer?: string;
}

export async function saveAccountSecurity(payload: SaveAccountSecurityPayload) {
  return authorizedApiJson<{
    message: string;
    must_change_password: boolean;
    password_recovery_enabled: boolean;
  }>('/api/account/security', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function requestRecoveryQuestion(email: string) {
  return publicApiJson<{ question: string }>('/api/account/recovery-question', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function recoverPasswordWithSecretQuestion(
  email: string,
  secretAnswer: string,
  newPassword: string
) {
  return publicApiJson<{ message: string }>('/api/account/recover-password', {
    method: 'POST',
    body: JSON.stringify({
      email,
      secretAnswer,
      newPassword,
    }),
  });
}
