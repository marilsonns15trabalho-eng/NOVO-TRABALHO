import { formatDatePtBr } from '@/lib/date';

export type WorkoutShareFormat = 'story' | 'post' | 'status';
export type WorkoutShareIntensity = 'leve' | 'moderada' | 'alta';

export interface WorkoutShareExercise {
  name: string;
  completed?: boolean;
  sets?: number | null;
  reps?: string | null;
}

export interface WorkoutShareCardData {
  studentName?: string | null;
  treinoName: string;
  splitLabel?: string | null;
  completedOn: string;
  durationMinutes?: number | null;
  exercises: WorkoutShareExercise[];
  exercisesCompleted: number;
  intensity: WorkoutShareIntensity;
  caloriesEstimate?: number | null;
}

type WorkoutShareFormatMeta = {
  label: string;
  width: number;
  height: number;
  aspectClassName: string;
  exportSuffix: string;
};

const WORKOUT_SHARE_FORMATS: Record<WorkoutShareFormat, WorkoutShareFormatMeta> = {
  story: {
    label: 'Story',
    width: 1080,
    height: 1920,
    aspectClassName: 'aspect-[9/16]',
    exportSuffix: 'story',
  },
  post: {
    label: 'Post',
    width: 1080,
    height: 1350,
    aspectClassName: 'aspect-[4/5]',
    exportSuffix: 'post',
  },
  status: {
    label: 'Status',
    width: 1080,
    height: 1920,
    aspectClassName: 'aspect-[9/16]',
    exportSuffix: 'status',
  },
};

const INTENSITY_MET: Record<WorkoutShareIntensity, number> = {
  leve: 4.2,
  moderada: 5.8,
  alta: 7.2,
};

const INTENSITY_CALORIE_SCALE: Record<WorkoutShareIntensity, number> = {
  leve: 0.94,
  moderada: 1,
  alta: 1.08,
};

const EXERCISE_CALORIE_PROFILES: Array<{
  keywords: string[];
  met: number;
}> = [
  {
    keywords: [
      'agachamento',
      'squat',
      'leg press',
      'afundo',
      'avanco',
      'bulgar',
      'passada',
      'stiff',
      'terra',
      'sumo',
      'thruster',
      'levantamento',
    ],
    met: 7.4,
  },
  {
    keywords: [
      'remada',
      'puxada',
      'serrote',
      'barra fixa',
      'pulldown',
      'puxador',
      'row',
    ],
    met: 6.5,
  },
  {
    keywords: [
      'supino',
      'desenvolvimento',
      'ombro',
      'elevacao',
      'push press',
      'flexao',
      'crucifixo',
      'peito',
    ],
    met: 6.1,
  },
  {
    keywords: [
      'rosca',
      'triceps',
      'extensora',
      'flexora',
      'abducao',
      'coice',
      'aducao',
      'panturrilha',
      'gluteo',
      'quadril',
      'hip thrust',
    ],
    met: 5.1,
  },
  {
    keywords: [
      'abs',
      'abdominal',
      'canivete',
      'prancha',
      'core',
      'pernas elevadas',
    ],
    met: 4.3,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeExerciseName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
) {
  roundRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string | CanvasGradient,
  lineWidth = 1,
) {
  roundRect(context, x, y, width, height, radius);
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  context.stroke();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.length > 0) {
    let trimmed = lines[maxLines - 1];
    while (trimmed.length > 0 && context.measureText(`${trimmed}...`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[maxLines - 1] = `${trimmed}...`;
  }

  return lines;
}

async function loadImageSource(file: File) {
  if (typeof window === 'undefined') {
    return null;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Nao foi possivel carregar a imagem.'));
      element.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function sanitizeFileName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function parseRepetitionScore(reps?: string | null) {
  if (!reps) {
    return 12;
  }

  const values = Array.from(reps.matchAll(/\d+(?:[.,]\d+)?/g))
    .map((match) => Number.parseFloat(match[0].replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!values.length) {
    return 12;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return clamp(total, 6, 40);
}

function getExerciseMet(exercise: WorkoutShareExercise) {
  const normalizedName = normalizeExerciseName(exercise.name);
  const matchedProfile = EXERCISE_CALORIE_PROFILES.find((profile) =>
    profile.keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  let met = matchedProfile?.met ?? 5.6;

  if (normalizedName.includes('+')) {
    met += 0.6;
  }

  if (normalizedName.includes('full body')) {
    met += 0.4;
  }

  return clamp(met, 4.1, 8.2);
}

function getExerciseWorkload(exercise: WorkoutShareExercise) {
  const sets = clamp(exercise.sets ?? 4, 1, 8);
  const repsScore = parseRepetitionScore(exercise.reps);
  const comboFactor = exercise.name.includes('+') ? 1.14 : 1;
  const completionFactor = exercise.completed === false ? 0.4 : 1;

  return sets * (repsScore / 12) * comboFactor * completionFactor;
}

function drawPowerGauge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: WorkoutShareIntensity,
  darkOnOrange = false,
) {
  const gaugeBlocks = 12;
  const gaugeActive = intensity === 'alta' ? 12 : intensity === 'moderada' ? 8 : 5;

  for (let index = 0; index < gaugeBlocks; index += 1) {
    fillRoundedRect(
      context,
      x + index * 36,
      y,
      20,
      10,
      5,
      index < gaugeActive
        ? darkOnOrange
          ? '#090909'
          : '#ff7a1a'
        : 'rgba(255,255,255,0.12)',
    );
  }
}

export function getWorkoutShareFormatMeta(format: WorkoutShareFormat) {
  return WORKOUT_SHARE_FORMATS[format];
}

export function inferWorkoutShareIntensity(params: {
  durationMinutes?: number | null;
  exercisesTotal?: number | null;
}): WorkoutShareIntensity {
  const duration = params.durationMinutes || 0;
  const exercisesTotal = params.exercisesTotal || 0;

  if (duration >= 55 || exercisesTotal >= 7) {
    return 'alta';
  }

  if (duration >= 35 || exercisesTotal >= 5) {
    return 'moderada';
  }

  return 'leve';
}

export function estimateWorkoutCalories(params: {
  weightKg?: number | null;
  durationMinutes?: number | null;
  intensity: WorkoutShareIntensity;
  exercises?: WorkoutShareExercise[] | null;
}) {
  const weightKg = params.weightKg || 0;
  const durationMinutes = params.durationMinutes || 0;

  if (weightKg <= 0 || durationMinutes <= 0) {
    return null;
  }

  let met = INTENSITY_MET[params.intensity];

  if (params.exercises?.length) {
    const weighted = params.exercises.reduce(
      (accumulator, exercise) => {
        const workload = getExerciseWorkload(exercise);
        return {
          totalLoad: accumulator.totalLoad + workload,
          totalMet: accumulator.totalMet + getExerciseMet(exercise) * workload,
        };
      },
      { totalLoad: 0, totalMet: 0 },
    );

    if (weighted.totalLoad > 0) {
      met = weighted.totalMet / weighted.totalLoad;
    }
  }

  met = clamp(met * INTENSITY_CALORIE_SCALE[params.intensity], 4, 8.9);
  const calories = (met * 3.5 * weightKg * durationMinutes) / 200;
  return Math.round(calories);
}

export function buildWorkoutShareMessage(data: WorkoutShareCardData) {
  const introName = data.studentName ? `${data.studentName} finalizou` : 'Treino finalizado';
  const durationSnippet = data.durationMinutes ? ` em ${data.durationMinutes} min` : '';
  const caloriesSnippet = data.caloriesEstimate
    ? ` com ${data.caloriesEstimate} kcal no treino`
    : '';

  return `${introName} ${data.treinoName}${durationSnippet}${caloriesSnippet} no app Lioness Personal Estudio.`;
}

export async function renderWorkoutShareImage(params: {
  format: WorkoutShareFormat;
  data: WorkoutShareCardData;
  photoFile?: File | null;
}) {
  if (typeof window === 'undefined') {
    throw new Error('A geracao da imagem esta disponivel apenas no navegador.');
  }

  const { width, height, exportSuffix } = getWorkoutShareFormatMeta(params.format);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Nao foi possivel preparar a arte para compartilhamento.');
  }

  const margin = params.format === 'post' ? 68 : 72;
  const isPostFormat = params.format === 'post';
  const contentWidth = width - margin * 2;
  const heroHeight = params.photoFile
    ? Math.round(height * (params.format === 'post' ? 0.4 : 0.44))
    : Math.round(height * (params.format === 'post' ? 0.26 : 0.3));
  const statCardsY = heroHeight + 42;
  const cardsGap = 24;
  const statCardHeight = params.format === 'post' ? 168 : 176;
  const intensityCardHeight = params.format === 'post' ? 172 : 188;
  const smallCardWidth = Math.floor((contentWidth - cardsGap) / 2);
  const intensityCardY = statCardsY + statCardHeight + 22;
  const summaryCardY = intensityCardY + intensityCardHeight + 30;
  const footerY = height - 84;
  const summaryCardHeight = footerY - summaryCardY;
  const visibleExercises = params.data.exercises.slice(0, isPostFormat ? 2 : 3);
  const remainingExercises = Math.max(params.data.exercises.length - visibleExercises.length, 0);
  const summaryHeaderOffset = isPostFormat ? 110 : 124;
  const exerciseRowStride = isPostFormat ? 72 : 96;
  const exerciseCardHeight = isPostFormat ? 58 : 74;
  const photo = params.photoFile ? await loadImageSource(params.photoFile) : null;

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#050505';
  context.fillRect(0, 0, width, height);

  const backgroundGradient = context.createLinearGradient(0, 0, width, height);
  backgroundGradient.addColorStop(0, '#141414');
  backgroundGradient.addColorStop(0.42, '#050505');
  backgroundGradient.addColorStop(1, '#0f0a06');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, width, height);

  const glowGradient = context.createRadialGradient(
    width * 0.16,
    height * 0.08,
    20,
    width * 0.16,
    height * 0.08,
    width * 0.56,
  );
  glowGradient.addColorStop(0, 'rgba(255, 138, 56, 0.38)');
  glowGradient.addColorStop(0.45, 'rgba(255, 106, 0, 0.14)');
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = glowGradient;
  context.fillRect(0, 0, width, height);

  if (photo) {
    const scale = Math.max(width / photo.width, heroHeight / photo.height);
    const renderedWidth = photo.width * scale;
    const renderedHeight = photo.height * scale;
    const imageX = (width - renderedWidth) / 2;
    const imageY = (heroHeight - renderedHeight) / 2;
    context.drawImage(photo, imageX, imageY, renderedWidth, renderedHeight);

    const photoOverlay = context.createLinearGradient(0, 0, 0, heroHeight + 220);
    photoOverlay.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    photoOverlay.addColorStop(0.38, 'rgba(0, 0, 0, 0.42)');
    photoOverlay.addColorStop(0.68, 'rgba(0, 0, 0, 0.78)');
    photoOverlay.addColorStop(1, 'rgba(5, 5, 5, 0.98)');
    context.fillStyle = photoOverlay;
    context.fillRect(0, 0, width, heroHeight + 220);
  } else {
    const heroGradient = context.createLinearGradient(0, 0, width, heroHeight);
    heroGradient.addColorStop(0, '#090909');
    heroGradient.addColorStop(0.5, '#120b07');
    heroGradient.addColorStop(1, '#050505');
    context.fillStyle = heroGradient;
    context.fillRect(0, 0, width, heroHeight);

    const rightGlow = context.createRadialGradient(
      width * 0.84,
      heroHeight * 0.18,
      20,
      width * 0.84,
      heroHeight * 0.18,
      width * 0.34,
    );
    rightGlow.addColorStop(0, 'rgba(255, 139, 64, 0.34)');
    rightGlow.addColorStop(0.52, 'rgba(255, 122, 26, 0.12)');
    rightGlow.addColorStop(1, 'rgba(255, 122, 26, 0)');
    context.fillStyle = rightGlow;
    context.fillRect(0, 0, width, heroHeight);

    context.save();
    context.globalAlpha = 0.08;
    context.fillStyle = '#ffd7b7';
    context.font = `${params.format === 'post' ? 94 : 112}px 'Arial Black', sans-serif`;
    context.textAlign = 'right';
    context.fillText('LIONESS FIT', width - margin, heroHeight * 0.34);
    context.restore();
  }

  const brandBadgeWidth = 300;
  const brandGradient = context.createLinearGradient(margin, 56, margin + brandBadgeWidth, 140);
  brandGradient.addColorStop(0, 'rgba(255, 122, 26, 0.16)');
  brandGradient.addColorStop(0.55, 'rgba(255, 122, 26, 0.08)');
  brandGradient.addColorStop(1, 'rgba(255, 214, 177, 0.08)');
  fillRoundedRect(context, margin, 56, brandBadgeWidth, 84, 26, brandGradient);
  context.strokeStyle = 'rgba(255, 122, 26, 0.18)';
  context.lineWidth = 2;
  roundRect(context, margin, 56, brandBadgeWidth, 84, 26);
  context.stroke();
  const brandTextGradient = context.createLinearGradient(margin, 56, margin + brandBadgeWidth, 56);
  brandTextGradient.addColorStop(0, '#ffe0c3');
  brandTextGradient.addColorStop(0.5, '#ff9a57');
  brandTextGradient.addColorStop(1, '#ffd7b7');
  context.fillStyle = brandTextGradient;
  context.font = "800 30px 'Space Grotesk', 'Arial Black', sans-serif";
  context.textAlign = 'left';
  context.fillText('LIONESS FIT', margin + 24, 109);

  fillRoundedRect(context, width - margin - 228, 64, 228, 84, 22, 'rgba(0,0,0,0.56)');
  context.fillStyle = '#ffffff';
  context.font = "700 24px 'Arial', sans-serif";
  context.fillText(formatDatePtBr(params.data.completedOn), width - margin - 196, 118);

  const headlineY = photo ? heroHeight - (params.format === 'post' ? 172 : 224) : heroHeight - 172;
  const headlineLineGap = params.format === 'post' ? 90 : 106;
  const finalizadoY = headlineY + headlineLineGap;
  context.shadowColor = 'rgba(0, 0, 0, 0.42)';
  context.shadowBlur = 32;
  context.shadowOffsetY = 8;
  context.fillStyle = '#ffffff';
  context.font = `${params.format === 'post' ? 92 : 106}px 'Space Grotesk', 'Arial Black', sans-serif`;
  context.fillText('TREINO', margin, headlineY);
  const finalizadoGradient = context.createLinearGradient(
    margin,
    finalizadoY - 48,
    margin + 520,
    finalizadoY + 24,
  );
  finalizadoGradient.addColorStop(0, '#ffb37f');
  finalizadoGradient.addColorStop(0.42, '#ff7a1a');
  finalizadoGradient.addColorStop(1, '#ffd7b7');
  context.fillStyle = finalizadoGradient;
  context.fillText('FINALIZADO', margin, finalizadoY);
  context.shadowColor = 'transparent';
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  const accentBarGradient = context.createLinearGradient(margin, finalizadoY + 26, margin + 180, finalizadoY + 26);
  accentBarGradient.addColorStop(0, '#ff8a3d');
  accentBarGradient.addColorStop(0.7, '#ff7a1a');
  accentBarGradient.addColorStop(1, '#ffd7b7');
  fillRoundedRect(
    context,
    margin,
    finalizadoY + (params.format === 'post' ? 22 : 26),
    164,
    12,
    6,
    accentBarGradient,
  );

  const cardBackground = 'rgba(10, 10, 10, 0.82)';
  fillRoundedRect(context, margin, statCardsY, smallCardWidth, statCardHeight, 32, cardBackground);
  strokeRoundedRect(context, margin, statCardsY, smallCardWidth, statCardHeight, 32, 'rgba(255,255,255,0.06)', 2);
  fillRoundedRect(
    context,
    margin + smallCardWidth + cardsGap,
    statCardsY,
    smallCardWidth,
    statCardHeight,
    32,
    cardBackground,
  );
  strokeRoundedRect(
    context,
    margin + smallCardWidth + cardsGap,
    statCardsY,
    smallCardWidth,
    statCardHeight,
    32,
    'rgba(255,255,255,0.06)',
    2,
  );

  const orangeGradient = context.createLinearGradient(
    margin,
    intensityCardY,
    margin + contentWidth,
    intensityCardY + intensityCardHeight,
  );
  orangeGradient.addColorStop(0, '#ff8a3d');
  orangeGradient.addColorStop(0.55, '#ff7a1a');
  orangeGradient.addColorStop(1, '#ffc48e');
  fillRoundedRect(
    context,
    margin,
    intensityCardY,
    contentWidth,
    intensityCardHeight,
    34,
    params.data.intensity === 'alta' ? orangeGradient : cardBackground,
  );
  strokeRoundedRect(
    context,
    margin,
    intensityCardY,
    contentWidth,
    intensityCardHeight,
    34,
    params.data.intensity === 'alta' ? 'rgba(255, 228, 201, 0.34)' : 'rgba(255,255,255,0.06)',
    2,
  );

  context.fillStyle = '#8f8f8f';
  context.font = "700 18px 'Arial', sans-serif";
  context.fillText('KCAL DO TREINO', margin + 28, statCardsY + 40);
  context.fillText('DURACAO', margin + smallCardWidth + cardsGap + 28, statCardsY + 40);

  context.fillStyle = '#ffffff';
  context.font = "700 72px 'Space Grotesk', 'Arial Black', sans-serif";
  context.fillText(
    params.data.caloriesEstimate ? String(params.data.caloriesEstimate) : '--',
    margin + 28,
    statCardsY + 112,
  );
  context.fillText(
    params.data.durationMinutes ? String(params.data.durationMinutes) : '--',
    margin + smallCardWidth + cardsGap + 28,
    statCardsY + 112,
  );

  context.fillStyle = '#ffb37f';
  context.font = "700 24px 'Arial', sans-serif";
  context.fillText('kcal', margin + 28, statCardsY + 146);
  context.fillText('min', margin + smallCardWidth + cardsGap + 28, statCardsY + 146);

  context.fillStyle = params.data.intensity === 'alta' ? '#090909' : '#ffffff';
  context.font = "700 18px 'Arial', sans-serif";
  context.fillText('INTENSIDADE E RITMO', margin + 32, intensityCardY + 42);
  context.font = `800 ${isPostFormat ? 48 : 54}px 'Space Grotesk', 'Arial Black', sans-serif`;
  context.fillText(params.data.intensity.toUpperCase(), margin + 32, intensityCardY + (isPostFormat ? 92 : 98));

  context.font = `700 ${isPostFormat ? 19 : 21}px 'Arial', sans-serif`;
  context.fillText(
    `${params.data.exercisesCompleted}/${Math.max(params.data.exercises.length, params.data.exercisesCompleted)} exercicios concluidos`,
    margin + 32,
    intensityCardY + (isPostFormat ? 122 : 130),
  );
  drawPowerGauge(
    context,
    margin + 32,
    intensityCardY + intensityCardHeight - (isPostFormat ? 28 : 38),
    params.data.intensity,
    params.data.intensity === 'alta',
  );

  fillRoundedRect(context, margin, summaryCardY, contentWidth, summaryCardHeight, 36, 'rgba(16, 16, 16, 0.88)');
  strokeRoundedRect(context, margin, summaryCardY, contentWidth, summaryCardHeight, 36, 'rgba(255,255,255,0.05)', 2);
  context.fillStyle = '#ffffff';
  context.font = "700 18px 'Arial', sans-serif";
  context.fillText('RESUMO DO TREINO', margin + 32, summaryCardY + 48);
  context.fillStyle = '#d9d9d9';
  context.font = `600 ${isPostFormat ? 20 : 22}px 'Arial', sans-serif`;
  const workoutNameLines = wrapText(context, params.data.treinoName, contentWidth - 220, isPostFormat ? 2 : 1);
  context.fillText(workoutNameLines[0] || params.data.treinoName, margin + 32, summaryCardY + 84);
  if (isPostFormat && workoutNameLines[1]) {
    context.fillText(workoutNameLines[1], margin + 32, summaryCardY + 110);
  }
  if (params.data.splitLabel) {
    fillRoundedRect(context, width - margin - 150, summaryCardY + 30, 118, 44, 22, 'rgba(255,122,26,0.1)');
    context.strokeStyle = 'rgba(255,122,26,0.18)';
    context.lineWidth = 1.5;
    roundRect(context, width - margin - 150, summaryCardY + 30, 118, 44, 22);
    context.stroke();
    context.fillStyle = '#ffb37f';
    context.font = "700 16px 'Arial', sans-serif";
    context.fillText(`SPLIT ${params.data.splitLabel}`, width - margin - 126, summaryCardY + 58);
  }

  visibleExercises.forEach((exercise, index) => {
    const itemY = summaryCardY + summaryHeaderOffset + index * exerciseRowStride;
    fillRoundedRect(
      context,
      margin + 28,
      itemY,
      contentWidth - 56,
      exerciseCardHeight,
      24,
      exercise.completed === false ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
    );

    fillRoundedRect(
      context,
      margin + 48,
      itemY + (isPostFormat ? 14 : 19),
      isPostFormat ? 30 : 36,
      isPostFormat ? 30 : 36,
      12,
      exercise.completed === false ? '#3a3a3a' : '#ff7a1a',
    );

    context.fillStyle = exercise.completed === false ? '#b1b1b1' : '#090909';
    context.font = `700 ${isPostFormat ? 15 : 18}px 'Arial', sans-serif`;
    context.textAlign = 'center';
    context.fillText(String(index + 1), margin + 66, itemY + (isPostFormat ? 34 : 44));
    context.textAlign = 'left';

    context.fillStyle = '#ffffff';
    context.font = `700 ${isPostFormat ? 20 : 24}px 'Arial', sans-serif`;
    const exerciseLines = wrapText(context, exercise.name.toUpperCase(), contentWidth - 220, 1);
    context.fillText(exerciseLines[0] || exercise.name, margin + 100, itemY + (isPostFormat ? 27 : 34));

    context.fillStyle = '#8f8f8f';
    context.font = `500 ${isPostFormat ? 15 : 18}px 'Arial', sans-serif`;
    const metaParts = [
      exercise.sets ? `${exercise.sets} series` : null,
      exercise.reps ? `${exercise.reps} reps` : null,
    ].filter(Boolean);
    context.fillText(
      metaParts.join(' / ') || 'Execucao concluida',
      margin + 100,
      itemY + (isPostFormat ? 46 : 58),
    );
  });

  if (remainingExercises > 0) {
    const itemY = summaryCardY + summaryHeaderOffset + visibleExercises.length * exerciseRowStride;
    fillRoundedRect(
      context,
      margin + 28,
      itemY,
      contentWidth - 56,
      isPostFormat ? 56 : 68,
      24,
      'rgba(255,122,26,0.08)',
    );
    context.fillStyle = '#ffb37f';
    context.font = `700 ${isPostFormat ? 19 : 22}px 'Arial', sans-serif`;
    context.fillText(
      `+ ${remainingExercises} exercicio(s) na sessao`,
      margin + 40,
      itemY + (isPostFormat ? 35 : 42),
    );
  }

  const footerBrandGradient = context.createLinearGradient(margin, footerY, margin + 260, footerY);
  footerBrandGradient.addColorStop(0, '#ffe0c3');
  footerBrandGradient.addColorStop(0.5, '#ff9a57');
  footerBrandGradient.addColorStop(1, '#ffd7b7');
  context.fillStyle = footerBrandGradient;
  context.font = "800 24px 'Space Grotesk', 'Arial Black', sans-serif";
  context.fillText('LIONESS FIT', margin, footerY + 18);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });

  if (!blob) {
    throw new Error('Nao foi possivel exportar a imagem do treino.');
  }

  const sanitizedName = sanitizeFileName(params.data.treinoName || 'treino-finalizado');
  return new File([blob], `${sanitizedName || 'treino-finalizado'}-${exportSuffix}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
