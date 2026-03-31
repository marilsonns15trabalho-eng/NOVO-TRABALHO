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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
    const lastLine = lines[maxLines - 1];
    if (context.measureText(lastLine).width > maxWidth) {
      let trimmed = lastLine;
      while (trimmed.length > 0 && context.measureText(`${trimmed}...`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }
      lines[maxLines - 1] = `${trimmed}...`;
    }
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
}) {
  const weightKg = params.weightKg || 0;
  const durationMinutes = params.durationMinutes || 0;

  if (weightKg <= 0 || durationMinutes <= 0) {
    return null;
  }

  const met = INTENSITY_MET[params.intensity];
  const calories = (met * 3.5 * weightKg * durationMinutes) / 200;
  return Math.round(calories);
}

export function buildWorkoutShareMessage(data: WorkoutShareCardData) {
  const introName = data.studentName ? `${data.studentName} finalizou` : 'Treino finalizado';
  const durationSnippet = data.durationMinutes ? ` em ${data.durationMinutes} min` : '';
  const caloriesSnippet = data.caloriesEstimate
    ? ` com ${data.caloriesEstimate} kcal estimadas`
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

  const margin = params.format === 'post' ? 64 : 72;
  const contentWidth = width - margin * 2;
  const photoHeight = params.photoFile ? Math.round(height * (params.format === 'post' ? 0.36 : 0.42)) : 0;
  const photo = params.photoFile ? await loadImageSource(params.photoFile) : null;
  const headlineY = photo ? photoHeight + 110 : 170;
  const statCardsY = headlineY + (params.format === 'post' ? 260 : 320);
  const progressCardHeight = params.format === 'post' ? 168 : 188;
  const exercisesCardY = statCardsY + (params.format === 'post' ? 240 : 300);
  const footerY = height - 120;
  const cardsGap = 24;
  const smallCardWidth = Math.floor((contentWidth - cardsGap) / 2);

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#050505';
  context.fillRect(0, 0, width, height);

  const backgroundGradient = context.createLinearGradient(0, 0, width, height);
  backgroundGradient.addColorStop(0, '#1b120d');
  backgroundGradient.addColorStop(0.28, '#050505');
  backgroundGradient.addColorStop(1, '#0d0d0d');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, width, height);

  const glowGradient = context.createRadialGradient(width * 0.12, height * 0.08, 30, width * 0.12, height * 0.08, width * 0.52);
  glowGradient.addColorStop(0, 'rgba(255, 138, 56, 0.38)');
  glowGradient.addColorStop(0.4, 'rgba(255, 106, 0, 0.16)');
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = glowGradient;
  context.fillRect(0, 0, width, height);

  if (photo) {
    const scale = Math.max(width / photo.width, photoHeight / photo.height);
    const renderedWidth = photo.width * scale;
    const renderedHeight = photo.height * scale;
    const imageX = (width - renderedWidth) / 2;
    const imageY = (photoHeight - renderedHeight) / 2;
    context.drawImage(photo, imageX, imageY, renderedWidth, renderedHeight);

    const photoOverlay = context.createLinearGradient(0, 0, 0, photoHeight + 160);
    photoOverlay.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
    photoOverlay.addColorStop(0.55, 'rgba(0, 0, 0, 0.58)');
    photoOverlay.addColorStop(1, 'rgba(5, 5, 5, 0.98)');
    context.fillStyle = photoOverlay;
    context.fillRect(0, 0, width, photoHeight + 180);
  }

  fillRoundedRect(context, margin, 56, 120, 120, 28, '#ff7a1a');
  context.fillStyle = '#090909';
  context.font = "800 54px 'Space Grotesk', 'Arial', sans-serif";
  context.textAlign = 'center';
  context.fillText('L', margin + 60, 128);
  context.textAlign = 'left';
  context.fillStyle = '#ffb37f';
  context.font = "700 18px 'Arial', sans-serif";
  context.fillText('ACESSO MOBILE', margin, 212);

  context.fillStyle = '#ffffff';
  context.font = `${params.format === 'post' ? 84 : 112}px 'Space Grotesk', 'Arial Black', sans-serif`;
  context.fillText('TREINO', margin, headlineY);
  context.fillStyle = '#ff7a1a';
  context.fillText('FINALIZADO', margin, headlineY + (params.format === 'post' ? 96 : 124));

  const subtitle = params.data.studentName
    ? `${params.data.studentName} concluiu ${params.data.treinoName}`
    : `${params.data.treinoName} concluido com sucesso`;
  context.fillStyle = '#d2d2d2';
  context.font = "500 30px 'Arial', sans-serif";
  const subtitleLines = wrapText(context, subtitle, contentWidth, 2);
  subtitleLines.forEach((line, index) => {
    context.fillText(line, margin, headlineY + (params.format === 'post' ? 148 : 190) + index * 38);
  });

  context.fillStyle = '#8e8e8e';
  context.font = "600 18px 'Arial', sans-serif";
  context.fillText(formatDatePtBr(params.data.completedOn), margin, headlineY + (params.format === 'post' ? 232 : 280));

  const cardBackground = 'rgba(10, 10, 10, 0.82)';
  const orangeGradient = context.createLinearGradient(margin, statCardsY, margin + smallCardWidth, statCardsY + 180);
  orangeGradient.addColorStop(0, '#ff7a1a');
  orangeGradient.addColorStop(1, '#ff9a57');

  fillRoundedRect(context, margin, statCardsY, smallCardWidth, 168, 32, cardBackground);
  fillRoundedRect(context, margin + smallCardWidth + cardsGap, statCardsY, smallCardWidth, 168, 32, cardBackground);
  fillRoundedRect(context, margin, statCardsY + 190, contentWidth, progressCardHeight, 36, params.data.intensity === 'alta' ? orangeGradient : cardBackground);

  context.fillStyle = '#8f8f8f';
  context.font = "700 18px 'Arial', sans-serif";
  context.fillText('KCAL ESTIMADAS', margin + 28, statCardsY + 40);
  context.fillText('DURACAO', margin + smallCardWidth + cardsGap + 28, statCardsY + 40);

  context.fillStyle = '#ffffff';
  context.font = "700 72px 'Space Grotesk', 'Arial Black', sans-serif";
  context.fillText(params.data.caloriesEstimate ? String(params.data.caloriesEstimate) : '--', margin + 28, statCardsY + 112);
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
  context.fillText('INTENSIDADE E PROGRESSO', margin + 32, statCardsY + 226);
  context.font = "800 54px 'Space Grotesk', 'Arial Black', sans-serif";
  context.fillText(params.data.intensity.toUpperCase(), margin + 32, statCardsY + 292);

  context.font = "600 24px 'Arial', sans-serif";
  context.fillText(
    `${params.data.exercisesCompleted}/${Math.max(params.data.exercises.length, params.data.exercisesCompleted)} exercicios concluidos`,
    margin + 32,
    statCardsY + 332,
  );

  const powerGaugeX = margin + 32;
  const powerGaugeY = statCardsY + progressCardHeight + 140;
  const gaugeBlocks = 12;
  const gaugeActive =
    params.data.intensity === 'alta' ? 12 : params.data.intensity === 'moderada' ? 8 : 5;
  for (let index = 0; index < gaugeBlocks; index += 1) {
    fillRoundedRect(
      context,
      powerGaugeX + index * 64,
      powerGaugeY,
      42,
      16,
      8,
      index < gaugeActive
        ? params.data.intensity === 'alta'
          ? '#090909'
          : '#ff7a1a'
        : 'rgba(255,255,255,0.12)',
    );
  }

  fillRoundedRect(context, margin, exercisesCardY, contentWidth, footerY - exercisesCardY - 40, 36, 'rgba(16, 16, 16, 0.88)');
  context.fillStyle = '#ffffff';
  context.font = "700 18px 'Arial', sans-serif";
  context.fillText('RESUMO DO TREINO', margin + 32, exercisesCardY + 48);
  context.fillStyle = '#8f8f8f';
  context.font = "500 20px 'Arial', sans-serif";
  const splitOrDateLabel = params.data.splitLabel
    ? `Split ${params.data.splitLabel}`
    : `Concluido em ${formatDatePtBr(params.data.completedOn)}`;
  context.fillText(splitOrDateLabel, margin + 32, exercisesCardY + 84);

  const exercises = params.data.exercises.slice(0, params.format === 'post' ? 4 : 5);
  exercises.forEach((exercise, index) => {
    const itemY = exercisesCardY + 132 + index * 92;
    fillRoundedRect(
      context,
      margin + 28,
      itemY,
      contentWidth - 56,
      72,
      24,
      exercise.completed === false ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
    );

    fillRoundedRect(
      context,
      margin + 48,
      itemY + 18,
      36,
      36,
      12,
      exercise.completed === false ? '#3a3a3a' : '#ff7a1a',
    );

    context.fillStyle = exercise.completed === false ? '#b1b1b1' : '#090909';
    context.font = "700 18px 'Arial', sans-serif";
    context.textAlign = 'center';
    context.fillText(String(index + 1), margin + 66, itemY + 43);
    context.textAlign = 'left';

    context.fillStyle = '#ffffff';
    context.font = "700 24px 'Arial', sans-serif";
    const exerciseLines = wrapText(context, exercise.name.toUpperCase(), contentWidth - 220, 1);
    context.fillText(exerciseLines[0] || exercise.name, margin + 108, itemY + 34);

    context.fillStyle = '#8f8f8f';
    context.font = "500 18px 'Arial', sans-serif";
    const metaParts = [
      exercise.sets ? `${exercise.sets} series` : null,
      exercise.reps ? `${exercise.reps} reps` : null,
    ].filter(Boolean);
    context.fillText(metaParts.join(' • ') || 'Execucao concluida', margin + 108, itemY + 58);
  });

  context.fillStyle = '#7e7e7e';
  context.font = "600 18px 'Arial', sans-serif";
  context.fillText('Compartilhe no WhatsApp, Instagram ou salve para postar depois.', margin, footerY);
  context.fillStyle = '#ff7a1a';
  context.font = "700 20px 'Arial', sans-serif";
  context.fillText('LIONESS PERSONAL ESTUDIO', margin, footerY + 34);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1);
  });

  if (!blob) {
    throw new Error('Nao foi possivel exportar a imagem do treino.');
  }

  const sanitizedName = sanitizeFileName(params.data.treinoName || 'treino-finalizado');
  return new File([blob], `${sanitizedName || 'treino-finalizado'}-${exportSuffix}.png`, {
    type: 'image/png',
    lastModified: Date.now(),
  });
}
