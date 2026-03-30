import type { ExerciseLibraryItem } from '@/types/exercise-library';

type WgerExercise = Record<string, any>;

const WGER_API_BASE_DEFAULT = 'https://wger.de/api/v2';

const SEARCH_TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\brosca\b/gi, 'curl'],
  [/\bagachamento\b/gi, 'squat'],
  [/\bsupino\b/gi, 'bench press'],
  [/\bremada\b/gi, 'row'],
  [/\bpuxada\b/gi, 'pulldown'],
  [/\bombro\b/gi, 'shoulder'],
  [/\bpeito\b/gi, 'chest'],
  [/\bbiceps\b/gi, 'biceps'],
  [/\btriceps\b/gi, 'triceps'],
  [/\bgluteo(s)?\b/gi, 'glute'],
  [/\bposterior(es)?\b/gi, 'hamstring'],
  [/\bquadriceps\b/gi, 'quadriceps'],
  [/\bpanturrilha(s)?\b/gi, 'calf'],
  [/\babdomen\b/gi, 'abs'],
  [/\babdominal\b/gi, 'abs'],
  [/\bprancha\b/gi, 'plank'],
  [/\bafundo\b/gi, 'lunge'],
  [/\bterra\b/gi, 'deadlift'],
  [/\bbarra fixa\b/gi, 'pull up'],
  [/\bflexao\b/gi, 'push up'],
  [/\bmaquina\b/gi, 'machine'],
  [/\bpolia\b/gi, 'cable'],
  [/\bhalter(es)?\b/gi, 'dumbbell'],
  [/\bbarra\b/gi, 'barbell'],
];

const EXACT_EXERCISE_NAME_MAP = new Map<string, string>([
  ['seated hip adduction', 'Aducao de quadril na maquina'],
  ['barbell lunges standing', 'Afundo com barra'],
  ['barbell lunges walking', 'Afundo caminhando com barra'],
  ['barbell squat', 'Agachamento com barra'],
  ['front squat', 'Agachamento frontal'],
  ['sumo squat', 'Agachamento sumo'],
  ['romanian deadlift', 'Levantamento terra romeno'],
  ['deadlift', 'Levantamento terra'],
  ['lat pulldown', 'Puxada frontal'],
  ['seated cable row', 'Remada sentada na polia'],
  ['cable rear delt fly', 'Crucifixo invertido na polia'],
  ['push up', 'Flexao de bracos'],
  ['plank', 'Prancha'],
  ['lateral raise', 'Elevacao lateral'],
  ['shoulder press', 'Desenvolvimento de ombros'],
  ['bench press', 'Supino reto'],
  ['incline bench press', 'Supino inclinado'],
  ['dumbbell curl', 'Rosca com halteres'],
  ['barbell curl', 'Rosca com barra'],
  ['leg extension', 'Cadeira extensora'],
  ['leg curl', 'Mesa flexora'],
  ['hip thrust', 'Hip thrust'],
]);

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bbarbell\b/gi, 'barra'],
  [/\bdumbbell\b/gi, 'halter'],
  [/\bcable\b/gi, 'polia'],
  [/\bmachine\b/gi, 'maquina'],
  [/\bbodyweight\b/gi, 'peso corporal'],
  [/\bcurl\b/gi, 'rosca'],
  [/\bsquat\b/gi, 'agachamento'],
  [/\blunge\b/gi, 'afundo'],
  [/\brow\b/gi, 'remada'],
  [/\bpress\b/gi, 'press'],
  [/\bpulldown\b/gi, 'puxada'],
  [/\bdeadlift\b/gi, 'levantamento terra'],
  [/\bfly\b/gi, 'crucifixo'],
  [/\braise\b/gi, 'elevacao'],
  [/\bextension\b/gi, 'extensao'],
  [/\bpushdown\b/gi, 'polia'],
  [/\bplank\b/gi, 'prancha'],
  [/\bcrunch\b/gi, 'abdominal'],
  [/\bbench\b/gi, 'supino'],
  [/\bpull up\b/gi, 'barra fixa'],
  [/\bpush up\b/gi, 'flexao'],
  [/\bwalking\b/gi, 'caminhando'],
  [/\bstanding\b/gi, 'em pe'],
  [/\bseated\b/gi, 'sentado'],
  [/\brear delt\b/gi, 'posterior de ombro'],
];

function normalizeLooseText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function buildFriendlyExerciseName(rawName: string) {
  const normalized = normalizeLooseText(rawName);
  const exact = EXACT_EXERCISE_NAME_MAP.get(normalized);
  if (exact) {
    return exact;
  }

  let translated = rawName;
  for (const [pattern, replacement] of WORD_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement);
  }

  translated = translated.replace(/\s+/g, ' ').trim();
  return translated === rawName ? toTitleCase(rawName) : toTitleCase(translated);
}

export function buildExerciseSearchCandidates(query: string) {
  const raw = query.trim();
  if (!raw) {
    return [];
  }

  let translated = raw;
  for (const [pattern, replacement] of SEARCH_TERM_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement);
  }

  return Array.from(new Set([translated.replace(/\s+/g, ' ').trim(), raw].filter(Boolean)));
}

export function getWgerApiBase() {
  return process.env.WGER_API_BASE?.trim() || WGER_API_BASE_DEFAULT;
}

export function getWgerSearchLanguage() {
  return 2;
}

export function mapWgerExerciseLibraryItem(raw: WgerExercise): ExerciseLibraryItem {
  const englishTranslation =
    Array.isArray(raw.translations)
      ? raw.translations.find((item: Record<string, any>) => item.language === 2 && typeof item.name === 'string')
      : null;

  const originalName =
    (englishTranslation?.name as string | undefined) ||
    (Array.isArray(raw.translations) ? raw.translations.find((item: Record<string, any>) => typeof item.name === 'string')?.name : null) ||
    'Exercicio';

  const description = stripHtml(
    String(englishTranslation?.description || raw.description || ''),
  );

  const instructions = description
    ? description
        .split(/(?<=[.!?])\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const primaryMuscle = Array.isArray(raw.muscles) && raw.muscles[0]
    ? String(raw.muscles[0].name_en || raw.muscles[0].name || '')
    : null;

  const category = raw.category?.name ? String(raw.category.name) : null;
  const firstVideo = Array.isArray(raw.videos) && raw.videos[0]?.video ? String(raw.videos[0].video) : null;
  const imageUrls = Array.isArray(raw.images)
    ? raw.images
        .map((item: Record<string, any>) => String(item.image || '').trim())
        .filter(Boolean)
    : [];
  const mainImage =
    (Array.isArray(raw.images)
      ? raw.images.find((item: Record<string, any>) => item.is_main && item.image)?.image
      : null) || imageUrls[0] || null;
  const licenseName = raw.license?.short_name || raw.license?.full_name || null;
  const licenseUrl = raw.license?.url || null;
  const licenseAuthor =
    raw.license_author ||
    englishTranslation?.license_author ||
    (Array.isArray(raw.images)
      ? raw.images.find((item: Record<string, any>) => typeof item.license_author === 'string')
          ?.license_author
      : null) ||
    null;

  return {
    id: String(raw.id ?? raw.uuid ?? originalName),
    display_name: buildFriendlyExerciseName(originalName),
    original_name: originalName,
    primary_muscle: primaryMuscle,
    primary_muscle_label: primaryMuscle ? buildFriendlyExerciseName(primaryMuscle) : null,
    category,
    category_label: category ? buildFriendlyExerciseName(category) : null,
    difficulty: null,
    instructions,
    has_official_video: Boolean(firstVideo),
    stream_path: firstVideo,
    preview_image_url: mainImage ? String(mainImage) : null,
    gallery_image_urls: imageUrls,
    license_name: licenseName ? String(licenseName) : null,
    license_url: licenseUrl ? String(licenseUrl) : null,
    license_author: licenseAuthor ? String(licenseAuthor) : null,
  };
}

function buildSearchableText(raw: WgerExercise) {
  const parts = [
    ...(Array.isArray(raw.translations)
      ? raw.translations.flatMap((item: Record<string, any>) => [
          typeof item.name === 'string' ? item.name : '',
          typeof item.description === 'string' ? stripHtml(item.description) : '',
        ])
      : []),
    ...(Array.isArray(raw.muscles)
      ? raw.muscles.flatMap((item: Record<string, any>) => [item.name_en || '', item.name || ''])
      : []),
    ...(Array.isArray(raw.equipment)
      ? raw.equipment.map((item: Record<string, any>) => item.name || '')
      : []),
    raw.category?.name || '',
  ];

  return normalizeLooseText(parts.join(' '));
}

export function filterWgerExercises(exercises: WgerExercise[], query: string) {
  const searchCandidates = buildExerciseSearchCandidates(query).map(normalizeLooseText);

  if (searchCandidates.length === 0) {
    return exercises.slice(0, 24);
  }

  const ranked = exercises
    .map((exercise) => {
      const haystack = buildSearchableText(exercise);
      const score = searchCandidates.reduce((acc, candidate) => {
        if (!candidate) {
          return acc;
        }

        if (haystack.includes(candidate)) {
          return acc + 2;
        }

        const tokens = candidate.split(' ');
        const partialHits = tokens.filter((token) => token.length > 2 && haystack.includes(token)).length;
        return acc + partialHits;
      }, 0);

      return { exercise, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, 24).map((item) => item.exercise);
}
