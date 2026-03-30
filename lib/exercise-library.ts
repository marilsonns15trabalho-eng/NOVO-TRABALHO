import type { ExerciseLibraryItem } from '@/types/exercise-library';

type WgerExercise = Record<string, any>;
type WgerTranslation = Record<string, any>;

const WGER_API_BASE_DEFAULT = 'https://wger.de/api/v2';
const WGER_LANGUAGE_EN = 2;
const WGER_LANGUAGE_ES = 4;
const WGER_LANGUAGE_PT = 7;

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
  [/\banterior deltoid\b/gi, 'ombros'],
  [/\bposterior deltoid\b/gi, 'ombro posterior'],
  [/\brectus abdominis\b/gi, 'abdomen'],
  [/\bpectoralis major\b/gi, 'peito'],
  [/\btriceps brachii\b/gi, 'triceps'],
  [/\bgluteus maximus\b/gi, 'gluteos'],
  [/\bquadriceps femoris\b/gi, 'quadriceps'],
  [/\blatissimus dorsi\b/gi, 'dorsais'],
  [/\bgastrocnemius\b/gi, 'panturrilhas'],
  [/\btrapezius\b/gi, 'trapezio'],
  [/\bshoulders\b/gi, 'ombros'],
  [/\bshoulder\b/gi, 'ombro'],
  [/\bchest\b/gi, 'peito'],
  [/\barms\b/gi, 'bracos'],
  [/\barm\b/gi, 'braco'],
  [/\blegs\b/gi, 'pernas'],
  [/\bleg\b/gi, 'perna'],
  [/\bback\b/gi, 'costas'],
  [/\babs\b/gi, 'abdomen'],
  [/\bcore\b/gi, 'core'],
  [/\bcalves\b/gi, 'panturrilhas'],
  [/\bglutes\b/gi, 'gluteos'],
  [/\bquads\b/gi, 'quadriceps'],
  [/\blats\b/gi, 'dorsais'],
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

const EN_PT_INSTRUCTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bstart the movement by\b/gi, 'inicie o movimento'],
  [/\bbegin the movement by\b/gi, 'inicie o movimento'],
  [/\bstart by\b/gi, 'comece'],
  [/\bbegin by\b/gi, 'comece'],
  [/\breturn to the starting position\b/gi, 'retorne para a posicao inicial'],
  [/\breturn to starting position\b/gi, 'retorne para a posicao inicial'],
  [/\breturning the handles to their starting positions\b/gi, 'retornando os pegadores para a posicao inicial'],
  [/\bmaintaining good form\b/gi, 'mantendo a boa tecnica'],
  [/\bkeep your back straight\b/gi, 'mantenha as costas retas'],
  [/\bkeep your core engaged\b/gi, 'mantenha o abdomen ativado'],
  [/\bengage your core\b/gi, 'ative o abdomen'],
  [/\bkeep your arms straight\b/gi, 'mantenha os bracos estendidos'],
  [/\bkeep your elbows close to your body\b/gi, 'mantenha os cotovelos proximos do corpo'],
  [/\bunder control\b/gi, 'de forma controlada'],
  [/\bas fast as you can\b/gi, 'o mais rapido que conseguir'],
  [/\bfeet shoulder-width apart\b/gi, 'pes na largura dos ombros'],
  [/\bshoulder-width apart\b/gi, 'na largura dos ombros'],
  [/\bwith your right hand\b/gi, 'com a mao direita'],
  [/\bwith your left hand\b/gi, 'com a mao esquerda'],
  [/\bright hand\b/gi, 'mao direita'],
  [/\bleft hand\b/gi, 'mao esquerda'],
  [/\brightside\b/gi, 'lado direito'],
  [/\bleft side\b/gi, 'lado esquerdo'],
  [/\badjust the weight\b/gi, 'ajuste a carga'],
  [/\badjust the pulleys to the right height\b/gi, 'ajuste as polias para a altura correta'],
  [/\brest your weight on\b/gi, 'apoie o peso em'],
  [/\bmove by stepping with\b/gi, 'avance movendo'],
  [/\bpause at the finish of the move\b/gi, 'faça uma breve pausa ao final do movimento'],
  [/\bworks your\b/gi, 'trabalha'],
  [/\bthis is your starting position\b/gi, 'essa e a posicao inicial'],
];

const EN_PT_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpushup position\b/gi, 'posicao de flexao'],
  [/\bpush-up position\b/gi, 'posicao de flexao'],
  [/\bpushups?\b/gi, 'flexoes'],
  [/\bbarbell\b/gi, 'barra'],
  [/\bdumbbells?\b/gi, 'halteres'],
  [/\bdumbbell\b/gi, 'halter'],
  [/\bplates?\b/gi, 'anilhas'],
  [/\bhandle(s)?\b/gi, 'pegadores'],
  [/\bpulley\b/gi, 'polia'],
  [/\bpulleys\b/gi, 'polias'],
  [/\bcable(s)?\b/gi, 'polia'],
  [/\bmachine\b/gi, 'maquina'],
  [/\bbench\b/gi, 'banco'],
  [/\bballs of your feet\b/gi, 'pontas dos pes'],
  [/\bpalms\b/gi, 'palmas das maos'],
  [/\bfeet\b/gi, 'pes'],
  [/\bfoot\b/gi, 'pe'],
  [/\bhands\b/gi, 'maos'],
  [/\bhand\b/gi, 'mao'],
  [/\barms\b/gi, 'bracos'],
  [/\barm\b/gi, 'braco'],
  [/\blegs\b/gi, 'pernas'],
  [/\bleg\b/gi, 'perna'],
  [/\bhips\b/gi, 'quadril'],
  [/\bhip\b/gi, 'quadril'],
  [/\bshoulders\b/gi, 'ombros'],
  [/\bshoulder\b/gi, 'ombro'],
  [/\bchest\b/gi, 'peito'],
  [/\bback\b/gi, 'costas'],
  [/\blower back\b/gi, 'lombar'],
  [/\bcore\b/gi, 'abdomen'],
  [/\babs\b/gi, 'abdominais'],
  [/\bglutes\b/gi, 'gluteos'],
  [/\bquads\b/gi, 'quadriceps'],
  [/\bcalves\b/gi, 'panturrilhas'],
  [/\btriceps\b/gi, 'triceps'],
  [/\bbiceps\b/gi, 'biceps'],
  [/\bdeltoids?\b/gi, 'deltoides'],
  [/\btraps\b/gi, 'trapezio'],
  [/\blats\b/gi, 'dorsais'],
  [/\bgrip\b/gi, 'pegada'],
  [/\bstand\b/gi, 'fique em pe'],
  [/\bsit\b/gi, 'sente-se'],
  [/\blie\b/gi, 'deite-se'],
  [/\bgrab\b/gi, 'segure'],
  [/\bhold\b/gi, 'segure'],
  [/\braise\b/gi, 'eleve'],
  [/\blower\b/gi, 'abaixe'],
  [/\bbend\b/gi, 'flexione'],
  [/\bstraighten\b/gi, 'estenda'],
  [/\bsqueeze\b/gi, 'contraia'],
  [/\bexhale\b/gi, 'expire'],
  [/\binhale\b/gi, 'inspire'],
  [/\brepeat\b/gi, 'repita'],
  [/\bslowly\b/gi, 'lentamente'],
];

const ES_PT_INSTRUCTION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bposicion inicial\b/gi, 'posicao inicial'],
  [/\bmovimiento\b/gi, 'movimento'],
  [/\binstrucciones\b/gi, 'instrucoes'],
  [/\bmusculos trabajados\b/gi, 'musculos trabalhados'],
  [/\bintensidad y medicion\b/gi, 'intensidade e medicao'],
  [/\bde forma controlada\b/gi, 'de forma controlada'],
];

const ES_PT_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bmancuernas?\b/gi, 'halteres'],
  [/\bbarra\b/gi, 'barra'],
  [/\bpolea(s)?\b/gi, 'polia$1'],
  [/\bmaquina\b/gi, 'maquina'],
  [/\bpecho\b/gi, 'peito'],
  [/\bhombros\b/gi, 'ombros'],
  [/\bcadera(s)?\b/gi, 'quadril'],
  [/\brodillas\b/gi, 'joelhos'],
  [/\bpies\b/gi, 'pes'],
  [/\bmano(s)?\b/gi, 'mao$1'],
  [/\bbrazos\b/gi, 'bracos'],
  [/\bcodos\b/gi, 'cotovelos'],
  [/\bespalda\b/gi, 'costas'],
  [/\bespalda baja\b/gi, 'lombar'],
  [/\babdomen\b/gi, 'abdomen'],
  [/\bgluteos\b/gi, 'gluteos'],
  [/\bcuadriceps\b/gi, 'quadriceps'],
  [/\bpantorrillas\b/gi, 'panturrilhas'],
  [/\btriceps\b/gi, 'triceps'],
  [/\bbiceps\b/gi, 'biceps'],
  [/\bdeltoides\b/gi, 'deltoides'],
  [/\btrapecios\b/gi, 'trapezio'],
  [/\bdorsales\b/gi, 'dorsais'],
  [/\bagarra\b/gi, 'segure'],
  [/\bmanten\b/gi, 'mantenha'],
  [/\bcolocate\b/gi, 'posicione-se'],
  [/\bempieza\b/gi, 'comece'],
  [/\binicia\b/gi, 'inicie'],
  [/\bregresa\b/gi, 'retorne'],
  [/\beleva\b/gi, 'eleve'],
  [/\bbaja\b/gi, 'abaixe'],
  [/\bflexiona\b/gi, 'flexione'],
  [/\bextiende\b/gi, 'estenda'],
  [/\brepite\b/gi, 'repita'],
  [/\blentamente\b/gi, 'lentamente'],
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

function cleanupTranslatedText(value: string) {
  return value
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/^\-+\s*/, '')
    .replace(/\bInstructions:\s*/gi, '')
    .replace(/\bInstruction:\s*/gi, '')
    .replace(/\bInstrucciones:\s*/gi, '')
    .trim();
}

function translateSentenceWithReplacements(
  sentence: string,
  replacements: Array<[RegExp, string]>,
  wordReplacements: Array<[RegExp, string]>,
) {
  let translated = sentence;
  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of wordReplacements) {
    translated = translated.replace(pattern, replacement);
  }
  translated = cleanupTranslatedText(translated);
  if (!translated) {
    return translated;
  }
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

function translateInstructionToPortuguese(sentence: string, sourceLanguage: number | null) {
  const cleaned = cleanupTranslatedText(sentence);
  if (!cleaned) {
    return '';
  }

  if (sourceLanguage === WGER_LANGUAGE_PT) {
    return cleaned;
  }

  if (sourceLanguage === WGER_LANGUAGE_ES) {
    return translateSentenceWithReplacements(
      cleaned,
      ES_PT_INSTRUCTION_REPLACEMENTS,
      ES_PT_WORD_REPLACEMENTS,
    );
  }

  return translateSentenceWithReplacements(
    cleaned,
    EN_PT_INSTRUCTION_REPLACEMENTS,
    EN_PT_WORD_REPLACEMENTS,
  );
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
  const translations = Array.isArray(raw.translations) ? raw.translations : [];
  const portugueseTranslation =
    translations.find((item: WgerTranslation) => item.language === WGER_LANGUAGE_PT && typeof item.name === 'string') ||
    null;
  const spanishTranslation =
    translations.find((item: WgerTranslation) => item.language === WGER_LANGUAGE_ES && typeof item.name === 'string') ||
    null;
  const englishTranslation =
    translations.find((item: WgerTranslation) => item.language === WGER_LANGUAGE_EN && typeof item.name === 'string') ||
    null;
  const fallbackTranslation =
    translations.find((item: WgerTranslation) => typeof item.name === 'string') || null;

  const translationForDescription =
    portugueseTranslation || spanishTranslation || englishTranslation || fallbackTranslation;

  const originalName =
    (englishTranslation?.name as string | undefined) ||
    (fallbackTranslation?.name as string | undefined) ||
    'Exercicio';

  const displayNameSource =
    (portugueseTranslation?.name as string | undefined) ||
    (englishTranslation?.name as string | undefined) ||
    (fallbackTranslation?.name as string | undefined) ||
    'Exercicio';

  const description = stripHtml(
    String(translationForDescription?.description || raw.description || ''),
  );

  const instructions = description
    ? description
        .split(/(?<=[.!?])\s+/)
        .map((item) => translateInstructionToPortuguese(item, translationForDescription?.language ?? null))
        .filter(Boolean)
        .slice(0, 5)
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
    display_name:
      portugueseTranslation?.name && typeof portugueseTranslation.name === 'string'
        ? cleanupTranslatedText(String(portugueseTranslation.name))
        : buildFriendlyExerciseName(displayNameSource),
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
