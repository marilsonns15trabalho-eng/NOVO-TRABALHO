import { assertAdmin } from '@/lib/authz';

export async function resetStudentPassword(userId: string) {
  if (!userId) {
    throw new Error('Aluno sem vinculo de autenticacao.');
  }

  await assertAdmin();

  const response = await fetch('/functions/v1/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      new_password: '123456',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao resetar senha');
  }

  return data;
}
