import { createHash } from 'crypto';

function normalizeSecretText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hashSecretAnswer(answer: string): string {
  const pepper = process.env.SECRET_ANSWER_PEPPER || 'lioness-secret-answer';
  const normalized = normalizeSecretText(answer);

  return createHash('sha256')
    .update(`${pepper}:${normalized}`)
    .digest('hex');
}
