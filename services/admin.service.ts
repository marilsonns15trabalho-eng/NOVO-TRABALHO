import { authorizedApiJson } from '@/lib/api-client';

export async function resetStudentPassword(userId: string) {
  if (!userId) {
    throw new Error('Aluno sem vinculo de autenticacao.');
  }

  return authorizedApiJson<{
    message: string;
    temporary_password: string;
  }>('/api/admin/users/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      newPassword: '123456',
    }),
  });
}
