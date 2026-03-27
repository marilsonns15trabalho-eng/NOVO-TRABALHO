export const SECRET_QUESTIONS = [
  'Qual e o nome do seu primeiro animal de estimacao?',
  'Qual e o primeiro nome da sua mae?',
  'Em que cidade voce nasceu?',
  'Qual era o seu apelido na infancia?',
  'Qual foi a sua primeira escola?',
] as const;

export type SecretQuestion = (typeof SECRET_QUESTIONS)[number];

export function isAllowedSecretQuestion(value: string): value is SecretQuestion {
  return SECRET_QUESTIONS.includes(value as SecretQuestion);
}
