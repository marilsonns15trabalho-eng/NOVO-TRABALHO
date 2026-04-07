import type { Exercicio } from '@/types/treino';

export interface ParsedTrainingWorkoutDraft {
  nome: string;
  split_label?: string | null;
  exercicios: Exercicio[];
}

export interface ParsedTrainingRoutineDraft {
  routineName: string;
  suggestedWeeklyFrequency: number;
  workouts: ParsedTrainingWorkoutDraft[];
  extractedTextPreview: string;
  parserWarnings: string[];
}

function stripPdfFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '');
}

function sanitizeRoutineName(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deriveRoutineNameFromPdfFile(fileName: string) {
  const normalized = sanitizeRoutineName(stripPdfFileExtension(fileName));
  if (!normalized) {
    return 'Rotina importada por PDF';
  }

  return normalized
    .split(' ')
    .map((token) => (token ? token[0].toUpperCase() + token.slice(1) : token))
    .join(' ');
}

function normalizePdfLine(value: string) {
  return value
    .replace(/\\n|\\r|\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—•*]+/, '')
    .trim();
}

function collectPrintableRuns(source: string, minLength = 4) {
  const runs: string[] = [];
  let buffer = '';

  const flush = () => {
    const normalized = normalizePdfLine(buffer);
    if (normalized.length >= minLength && /[A-Za-zÀ-ÿ0-9]/.test(normalized)) {
      runs.push(normalized);
    }
    buffer = '';
  };

  for (const char of source) {
    const code = char.charCodeAt(0);
    const printable =
      char === '\n' ||
      char === '\r' ||
      char === '\t' ||
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255);

    if (printable) {
      buffer += char;
      continue;
    }

    flush();
  }

  flush();
  return runs;
}

function extractLiteralTokens(rawText: string) {
  const tokens: string[] = [];
  const regex = /\(([^()]{2,240})\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText))) {
    const normalized = normalizePdfLine(
      match[1]
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\'),
    );

    if (normalized.length >= 3 && /[A-Za-zÀ-ÿ0-9]/.test(normalized)) {
      tokens.push(normalized);
    }
  }

  return tokens;
}

async function extractPdfTextPreview(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const latinText = new TextDecoder('latin1').decode(bytes);
  const utfText = new TextDecoder('utf-8').decode(bytes);

  const mergedLines = [
    ...extractLiteralTokens(latinText),
    ...extractLiteralTokens(utfText),
    ...collectPrintableRuns(latinText),
    ...collectPrintableRuns(utfText),
  ];

  const uniqueLines = Array.from(new Set(mergedLines))
    .filter((line) => line.length >= 3 && line.length <= 180)
    .filter((line) => !/^(obj|endobj|stream|endstream|xref|trailer)$/i.test(line));

  return uniqueLines.slice(0, 120);
}

function detectWeeklyFrequency(lines: string[]) {
  const text = lines.join('\n').toLowerCase();
  const explicitMatch = text.match(/\b([1-7])\s*x\s*(?:na|\/)?\s*semana\b/);
  if (explicitMatch) {
    const parsed = Number(explicitMatch[1]);
    if (parsed >= 1 && parsed <= 7) {
      return parsed;
    }
  }

  const treinoHeaderMatches = lines.filter((line) =>
    /^(treino|dia|rotina)\s*[a-z0-9]/i.test(line),
  );
  if (treinoHeaderMatches.length >= 2 && treinoHeaderMatches.length <= 7) {
    return treinoHeaderMatches.length;
  }

  return 3;
}

function asSplitLabel(index: number) {
  const code = 'A'.charCodeAt(0) + index;
  if (code > 'Z'.charCodeAt(0)) {
    return null;
  }

  return String.fromCharCode(code);
}

function parseExerciseLine(line: string): Exercicio | null {
  const normalized = line
    .replace(/^\d+\s*[-.)]\s*/, '')
    .replace(/^[-•*]+\s*/, '')
    .trim();

  if (!normalized || normalized.length < 3) {
    return null;
  }

  if (/^(obs|observacao|observações|protocolo|duracao|duração|frequencia|frequência)\b/i.test(normalized)) {
    return null;
  }

  const setsRepsMatch = normalized.match(/(\d{1,2})\s*[xX×]\s*([0-9]{1,3}(?:\s*[-a]\s*[0-9]{1,3})?)/);
  const seriesMatch = normalized.match(/(\d{1,2})\s*(?:series|séries|serie|série)\b/i);
  const repsMatch = normalized.match(/([0-9]{1,3}(?:\s*[-a]\s*[0-9]{1,3})?)\s*(?:reps|rep|repeticoes|repetições)\b/i);
  const descansoMatch = normalized.match(/(\d{1,3}\s*(?:s|sec|min))/i);

  return {
    nome: normalized,
    series: setsRepsMatch ? Number(setsRepsMatch[1]) : seriesMatch ? Number(seriesMatch[1]) : 3,
    repeticoes: setsRepsMatch ? setsRepsMatch[2].replace(/\s+/g, '') : repsMatch ? repsMatch[1].replace(/\s+/g, '') : '10-12',
    descanso: descansoMatch ? descansoMatch[1].replace(/\s+/g, '') : '60s',
    carga: '',
    observacoes: '',
    grupo_muscular: '',
  };
}

function parseWorkoutsFromLines(lines: string[], weeklyFrequency: number) {
  const workouts: ParsedTrainingWorkoutDraft[] = [];
  let current: ParsedTrainingWorkoutDraft | null = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }

    if (current.exercicios.length === 0) {
      current = null;
      return;
    }

    workouts.push(current);
    current = null;
  };

  const headerRegex = /^(treino|dia|rotina)\s*([a-z0-9]+)/i;

  lines.forEach((line) => {
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      pushCurrent();
      current = {
        nome: `Treino ${headerMatch[2].toUpperCase()}`,
        split_label: headerMatch[2].length === 1 ? headerMatch[2].toUpperCase() : null,
        exercicios: [],
      };
      return;
    }

    const parsedExercise = parseExerciseLine(line);
    if (!parsedExercise) {
      return;
    }

    if (!current) {
      const index = workouts.length;
      current = {
        nome: `Treino ${asSplitLabel(index) || index + 1}`,
        split_label: asSplitLabel(index),
        exercicios: [],
      };
    }

    current.exercicios.push(parsedExercise);
  });

  pushCurrent();

  if (workouts.length > 0) {
    return workouts.slice(0, Math.max(weeklyFrequency, workouts.length));
  }

  const fallbackExercises = lines.map(parseExerciseLine).filter(Boolean) as Exercicio[];
  if (fallbackExercises.length === 0) {
    return Array.from({ length: weeklyFrequency }).map((_, index) => ({
      nome: `Treino ${asSplitLabel(index) || index + 1}`,
      split_label: asSplitLabel(index),
      exercicios: [],
    }));
  }

  const chunkSize = Math.max(1, Math.ceil(fallbackExercises.length / weeklyFrequency));
  const generated = Array.from({ length: weeklyFrequency }).map((_, index) => ({
    nome: `Treino ${asSplitLabel(index) || index + 1}`,
    split_label: asSplitLabel(index),
    exercicios: fallbackExercises.slice(index * chunkSize, (index + 1) * chunkSize),
  }));

  return generated.filter((workout) => workout.exercicios.length > 0);
}

export async function buildTrainingRoutineDraftFromPdf(file: File): Promise<ParsedTrainingRoutineDraft> {
  const lines = await extractPdfTextPreview(file);
  const suggestedWeeklyFrequency = detectWeeklyFrequency(lines);
  const workouts = parseWorkoutsFromLines(lines, suggestedWeeklyFrequency);
  const parserWarnings: string[] = [];

  if (lines.length === 0) {
    parserWarnings.push(
      'Nao foi possivel extrair texto legivel do PDF. A rotina foi preparada em modo assistido.',
    );
  }

  if (workouts.length === 0) {
    parserWarnings.push(
      'Nao encontramos exercicios no PDF. A rotina sera criada com treinos-base para voce editar.',
    );
  }

  return {
    routineName: deriveRoutineNameFromPdfFile(file.name),
    suggestedWeeklyFrequency,
    workouts,
    extractedTextPreview: lines.slice(0, 60).join('\n'),
    parserWarnings,
  };
}
