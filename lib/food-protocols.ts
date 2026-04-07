import type { FoodProtocolStudent } from '@/types/food-protocol';

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

export function normalizeFoodProtocolText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function deriveFoodProtocolTitle(fileName: string) {
  const base = stripExtension(fileName)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!base) {
    return 'Protocolo alimentar';
  }

  return base
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function sanitizeFoodProtocolFileName(fileName: string, fallbackBase = 'protocolo-alimentar') {
  const baseName = stripExtension(fileName || fallbackBase);
  const sanitized = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return `${sanitized || fallbackBase}.pdf`;
}

export function formatFoodProtocolSize(sizeBytes?: number | null) {
  if (!sizeBytes || sizeBytes <= 0) {
    return 'Tamanho indisponivel';
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}

function buildStudentMatchScore(fileName: string, student: FoodProtocolStudent) {
  const normalizedFile = normalizeFoodProtocolText(stripExtension(fileName));
  const normalizedName = normalizeFoodProtocolText(student.nome || '');
  const normalizedEmail = normalizeFoodProtocolText(student.email || '');

  if (!normalizedFile || !normalizedName) {
    return 0;
  }

  let score = 0;

  if (normalizedFile.includes(normalizedName)) {
    score += 100;
  }

  const nameTokens = normalizedName.split(' ').filter((token) => token.length >= 3);
  const matchedTokens = nameTokens.filter((token) => normalizedFile.includes(token));
  score += matchedTokens.length * 18;

  if (normalizedEmail) {
    const localPart = normalizedEmail.split(' ')[0] || normalizedEmail;
    if (localPart && normalizedFile.includes(localPart)) {
      score += 24;
    }
  }

  return score;
}

export function suggestStudentForFoodProtocolFileName(
  fileName: string,
  students: FoodProtocolStudent[],
) {
  const ranked = students
    .map((student) => ({
      student,
      score: buildStudentMatchScore(fileName, student),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    return null;
  }

  const best = ranked[0];
  const next = ranked[1];
  const confidence =
    best.score >= 100
      ? 'high'
      : next && best.score - next.score < 18
        ? 'low'
        : 'medium';

  return {
    student: best.student,
    confidence,
  } as const;
}
