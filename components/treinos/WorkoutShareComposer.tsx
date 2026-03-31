'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Clock3,
  Download,
  Flame,
  ImagePlus,
  Instagram,
  Loader2,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { formatDatePtBr } from '@/lib/date';
import { optimizeAssessmentPhotoFile } from '@/lib/assessmentPhotos';
import { downloadFile, saveFileToDevice, shareFile } from '@/lib/external-links';
import { captureWorkoutSharePhotoFile } from '@/lib/native-app';
import {
  buildWorkoutShareMessage,
  estimateWorkoutCalories,
  getWorkoutShareFormatMeta,
  inferWorkoutShareIntensity,
  renderWorkoutShareImage,
  type WorkoutShareCardData,
  type WorkoutShareExercise,
  type WorkoutShareFormat,
  type WorkoutShareIntensity,
} from '@/lib/workout-share';
import { useNativeApp } from '@/hooks/useNativeApp';

type WorkoutShareAction = 'whatsapp' | 'instagram' | 'save';
type WorkoutShareFeedback =
  | { tone: 'success'; message: string }
  | { tone: 'error'; message: string }
  | null;

interface WorkoutShareComposerProps {
  open: boolean;
  onClose: () => void;
  studentName?: string | null;
  completedOn: string;
  treino: {
    nome: string;
    split_label?: string | null;
    duracao_minutos?: number | null;
    exercicios?: Array<{
      nome: string;
      series?: number;
      repeticoes?: string;
    }> | null;
  } | null;
  completedExercises?: number | null;
  weightKg?: number | null;
}

const FORMAT_OPTIONS: Array<{ key: WorkoutShareFormat; label: string; helper: string }> = [
  { key: 'story', label: 'Story', helper: 'Vertical, forte e pronto para WhatsApp e Instagram.' },
  { key: 'post', label: 'Post', helper: 'Mais compacto para feed e publicacao.' },
  { key: 'status', label: 'Status', helper: 'Mesmo enquadramento vertical para compartilhar rapido.' },
];

const INTENSITY_OPTIONS: Array<{ key: WorkoutShareIntensity; label: string; helper: string }> = [
  { key: 'leve', label: 'Leve', helper: 'Sessao mais tecnica e controlada.' },
  { key: 'moderada', label: 'Moderada', helper: 'Ritmo consistente ao longo do treino.' },
  { key: 'alta', label: 'Alta', helper: 'Treino forte, denso e de maior gasto.' },
];

function WorkoutSharePreview(props: {
  format: WorkoutShareFormat;
  previewUrl: string | null;
  data: WorkoutShareCardData;
}) {
  const formatMeta = getWorkoutShareFormatMeta(props.format);
  const visibleExercises = props.data.exercises.slice(0, props.format === 'post' ? 4 : 3);
  const remainingExercises = Math.max(props.data.exercises.length - visibleExercises.length, 0);
  const gaugeBlocks = props.data.intensity === 'alta' ? 12 : props.data.intensity === 'moderada' ? 8 : 5;
  const summaryTitle = props.data.treinoName;

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div
        className={`relative w-full overflow-hidden rounded-[30px] border border-zinc-800 bg-black shadow-[0_36px_120px_-68px_rgba(0,0,0,0.96)] ${formatMeta.aspectClassName}`}
      >
        {props.previewUrl ? (
          <img
            src={props.previewUrl}
            alt="Foto do treino"
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 top-6 h-48 w-48 rounded-full bg-orange-500/18 blur-3xl sm:h-64 sm:w-64" />
            <div className="absolute left-4 top-12 h-28 w-28 rounded-full bg-amber-100/8 blur-3xl sm:h-36 sm:w-36" />
            <div className="absolute inset-x-0 bottom-16 h-28 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent blur-2xl" />
            <div className="absolute right-5 top-12 text-[2rem] font-black uppercase tracking-[0.34em] text-orange-200/8 sm:text-[2.8rem]">
              Lioness Fit
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.28),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,210,170,0.12),_transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.72)_42%,rgba(0,0,0,0.98))]" />

        <div className="relative flex h-full flex-col p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-[20px] border border-orange-500/15 bg-black/50 px-4 py-3 backdrop-blur-md">
              <p className="bg-gradient-to-r from-orange-200 via-orange-400 to-amber-200 bg-clip-text text-[11px] font-black uppercase tracking-[0.32em] text-transparent sm:text-[12px]">
                Lioness Fit
              </p>
            </div>

            <div className="rounded-[18px] border border-white/8 bg-black/55 px-4 py-2.5 text-right backdrop-blur-sm">
              <p className="text-xs font-semibold text-white sm:text-sm">{formatDatePtBr(props.data.completedOn)}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-5xl font-black uppercase leading-none tracking-[-0.08em] text-white sm:text-6xl">
              Treino
            </p>
            <div className="mt-3 h-1.5 w-24 rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-200" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-black/72 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                Kcal do treino
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-orange-400">
                {props.data.caloriesEstimate ?? '--'}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">kcal</p>
            </div>

            <div className="rounded-[22px] bg-black/72 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                Duracao
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
                {props.data.durationMinutes ?? '--'}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">min</p>
            </div>
          </div>

          <div className="mt-3 rounded-[24px] bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-4 text-black shadow-[0_24px_60px_-34px_rgba(255,122,26,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]">Intensidade e ritmo</p>
                <p className="mt-1 text-2xl font-black uppercase tracking-[-0.04em]">
                  {props.data.intensity}
                </p>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.22em]">
                {props.data.exercisesCompleted}/
                {Math.max(props.data.exercisesCompleted, props.data.exercises.length)} exercicios
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`gauge-${index}`}
                  className={`h-2 flex-1 rounded-full ${
                    index < gaugeBlocks ? 'bg-black/85' : 'bg-black/15'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-white/6 bg-black/60 p-3 backdrop-blur-md sm:p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white">
                  Resumo do treino
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-zinc-300">
                  {summaryTitle}
                </p>
              </div>
              {props.data.splitLabel ? (
                <div className="shrink-0 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200">
                  Split {props.data.splitLabel}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
            {visibleExercises.map((exercise, index) => (
              <div
                key={`${exercise.name}-${index}`}
                className="flex items-center gap-3 rounded-[20px] bg-white/[0.04] px-3 py-3 backdrop-blur-sm"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    exercise.completed === false
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-orange-500 text-black'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold uppercase tracking-[0.02em] text-white">
                    {exercise.name}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {[
                      exercise.sets ? `${exercise.sets} series` : null,
                      exercise.reps ? `${exercise.reps} reps` : null,
                    ]
                      .filter(Boolean)
                      .join(' / ') || 'Execucao concluida'}
                  </p>
                </div>
              </div>
            ))}

            {remainingExercises > 0 ? (
              <div className="rounded-[20px] border border-orange-500/12 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-200">
                + {remainingExercises} exercicio(s) no treino completo
              </div>
            ) : null}
          </div>
          </div>

          <div className="mt-auto pt-4">
            <p className="bg-gradient-to-r from-orange-200 via-orange-400 to-amber-200 bg-clip-text text-[11px] font-black uppercase tracking-[0.34em] text-transparent">
              Lioness Fit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutShareComposer({
  open,
  onClose,
  studentName,
  completedOn,
  treino,
  completedExercises,
  weightKg,
}: WorkoutShareComposerProps) {
  const nativeApp = useNativeApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [format, setFormat] = useState<WorkoutShareFormat>('story');
  const [intensity, setIntensity] = useState<WorkoutShareIntensity>('moderada');
  const [durationMinutesInput, setDurationMinutesInput] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<WorkoutShareAction | 'camera' | null>(null);
  const [feedback, setFeedback] = useState<WorkoutShareFeedback>(null);

  useEffect(() => {
    if (!open || !treino) {
      return;
    }

    setFormat('story');
    setIntensity(
      inferWorkoutShareIntensity({
        durationMinutes: treino.duracao_minutos,
        exercisesTotal: treino.exercicios?.length ?? 0,
      }),
    );
    setDurationMinutesInput(
      treino.duracao_minutos && treino.duracao_minutos > 0
        ? String(treino.duracao_minutos)
        : '',
    );
    setFeedback(null);
  }, [open, treino]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const exercises = useMemo<WorkoutShareExercise[]>(
    () =>
      (treino?.exercicios || []).map((exercise, index) => ({
        name: exercise.nome,
        sets: exercise.series ?? null,
        reps: exercise.repeticoes ?? null,
        completed: completedExercises == null ? true : index < Math.max(0, completedExercises),
      })),
    [completedExercises, treino?.exercicios],
  );

  const editableDurationMinutes = useMemo(() => {
    const parsed = Number.parseInt(durationMinutesInput, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }, [durationMinutesInput]);

  const cardData = useMemo<WorkoutShareCardData | null>(() => {
    if (!treino) {
      return null;
    }

    const caloriesEstimate = estimateWorkoutCalories({
      weightKg,
      durationMinutes: editableDurationMinutes,
      intensity,
      exercises,
    });

    return {
      studentName,
      treinoName: treino.nome,
      splitLabel: treino.split_label ?? null,
      completedOn,
      durationMinutes: editableDurationMinutes,
      exercises,
      exercisesCompleted:
        completedExercises == null
          ? exercises.length
          : Math.min(Math.max(completedExercises, 0), exercises.length || completedExercises),
      intensity,
      caloriesEstimate,
    };
  }, [
    completedExercises,
    completedOn,
    editableDurationMinutes,
    exercises,
    intensity,
    studentName,
    treino,
    weightKg,
  ]);

  const handlePhotoSelected = async (incomingFile: File | null) => {
    if (!incomingFile) {
      return;
    }

    try {
      setFeedback(null);
      const optimized = await optimizeAssessmentPhotoFile(incomingFile);
      setPhotoFile(optimized);
      setPhotoPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }

        return URL.createObjectURL(optimized);
      });
    } catch (selectionError: any) {
      setFeedback({
        tone: 'error',
        message: selectionError?.message || 'Nao foi possivel preparar a foto para o card.',
      });
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setBusyAction('camera');
      setFeedback(null);
      const captured = await captureWorkoutSharePhotoFile();
      await handlePhotoSelected(captured);
    } catch (captureError: any) {
      setFeedback({
        tone: 'error',
        message: captureError?.message || 'Nao foi possivel abrir a camera agora.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl((current) => {
      if (current?.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
    setFeedback(null);
  };

  const handleShare = async (action: WorkoutShareAction) => {
    if (!cardData) {
      return;
    }

    try {
      setBusyAction(action);
      setFeedback(null);

      const imageFile = await renderWorkoutShareImage({
        format,
        data: cardData,
        photoFile,
      });
      const message = buildWorkoutShareMessage(cardData);

      if (action === 'save') {
        if (nativeApp) {
          const saved = await saveFileToDevice({
            file: imageFile,
            folderName: 'Lioness',
            preferredName: imageFile.name,
          });

          if (saved) {
            setFeedback({
              tone: 'success',
              message: 'Imagem salva no aparelho em Arquivos > Documents > Lioness.',
            });
            return;
          }

          const shared = await shareFile({
            file: imageFile,
            title: 'Salvar imagem do treino',
            text: message,
            dialogTitle: 'Salvar ou enviar imagem',
          });

          if (shared) {
            setFeedback({
              tone: 'success',
              message: 'As opcoes do aparelho foram abertas para salvar ou enviar a arte.',
            });
          } else {
            setFeedback({
              tone: 'error',
              message: 'Nao foi possivel salvar nem abrir as opcoes do aparelho agora.',
            });
          }

          return;
        }

        await downloadFile(imageFile);
        setFeedback({
          tone: 'success',
          message: 'Imagem baixada para o seu aparelho.',
        });
        return;
      }

      const targetLabel = action === 'whatsapp' ? 'WhatsApp' : 'Instagram';
      const shared = await shareFile({
        file: imageFile,
        title: `Treino finalizado - ${cardData.treinoName}`,
        text: message,
        dialogTitle: `Compartilhar no ${targetLabel}`,
      });

      if (shared) {
        setFeedback({
          tone: 'success',
          message: `As opcoes do aparelho foram abertas para enviar no ${targetLabel}.`,
        });
        return;
      }

      if (nativeApp) {
        const saved = await saveFileToDevice({
          file: imageFile,
          folderName: 'Lioness',
          preferredName: imageFile.name,
        });

        if (saved) {
          setFeedback({
            tone: 'error',
            message: `Nao consegui abrir o ${targetLabel} agora, mas a imagem foi salva em Arquivos > Documents > Lioness para voce postar depois.`,
          });
        } else {
          setFeedback({
            tone: 'error',
            message: `Nao foi possivel abrir o compartilhamento para o ${targetLabel} agora.`,
          });
        }
      } else {
        await downloadFile(imageFile);
        setFeedback({
          tone: 'error',
          message: `O compartilhamento direto nao esta disponivel neste aparelho. A imagem foi baixada para voce postar no ${targetLabel}.`,
        });
      }
    } catch (shareError: any) {
      setFeedback({
        tone: 'error',
        message: shareError?.message || 'Nao foi possivel gerar a imagem do treino.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (!open || !treino || !cardData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/92 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-4 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-full w-full max-w-6xl items-start md:items-center">
        <div className="w-full overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/96 shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)]">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-300">
                <Sparkles size={14} />
                Compartilhar treino finalizado
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{treino.nome}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Gere uma arte pronta para Story, publicacao ou Status. No app, o envio abre pelo
                painel nativo do aparelho e voce tambem pode salvar para postar depois.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
              aria-label="Fechar compartilhamento"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto px-3 py-3 sm:px-6 sm:py-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.04fr)_360px]">
              <div className="min-w-0 space-y-4">
                <WorkoutSharePreview format={format} previewUrl={photoPreviewUrl} data={cardData} />

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                    <div className="flex items-center gap-2 text-orange-300">
                      <Flame size={16} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
                        Kcal do treino
                      </p>
                    </div>
                    <p className="mt-3 text-2xl font-black text-white">
                      {cardData.caloriesEstimate ?? '--'}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Calculadas com base no tempo, intensidade e no mix dos exercicios.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                    <div className="flex items-center gap-2 text-sky-300">
                      <Clock3 size={16} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Duracao</p>
                    </div>
                    <p className="mt-3 text-2xl font-black text-white">
                      {cardData.durationMinutes ?? '--'} min
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Tempo exibido no resumo compartilhado.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                    <div className="flex items-center gap-2 text-violet-300">
                      <Sparkles size={16} />
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Execucao</p>
                    </div>
                    <p className="mt-3 text-2xl font-black text-white">
                      {cardData.exercisesCompleted}/
                      {Math.max(cardData.exercises.length, cardData.exercisesCompleted)}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Resumo da sessao concluida.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    Formato da arte
                  </p>
                  <div className="mt-4 grid gap-2">
                    {FORMAT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFormat(option.key)}
                        className={`rounded-[20px] border px-4 py-3 text-left transition-all ${
                          format === option.key
                            ? 'border-orange-500/30 bg-orange-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <p className="text-sm font-bold">{option.label}</p>
                        <p className="mt-1 text-xs leading-5">{option.helper}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    Intensidade do card
                  </p>
                  <div className="mt-4 grid gap-2">
                    {INTENSITY_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setIntensity(option.key)}
                        className={`rounded-[20px] border px-4 py-3 text-left transition-all ${
                          intensity === option.key
                            ? 'border-orange-500/30 bg-orange-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <p className="text-sm font-bold uppercase">{option.label}</p>
                        <p className="mt-1 text-xs leading-5">{option.helper}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    Tempo real do treino
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Ajuste o tempo antes de compartilhar se quiser que a arte reflita exatamente a
                    sua sessao.
                  </p>

                  <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-zinc-800 bg-zinc-950 px-4 py-3">
                    <Clock3 size={16} className="text-sky-300" />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={durationMinutesInput}
                      onChange={(event) => setDurationMinutesInput(event.target.value)}
                      placeholder="Ex.: 52"
                      className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-zinc-600"
                    />
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                      min
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    As calorias e o resumo sao atualizados automaticamente.
                  </p>
                </section>

                <section className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    Foto opcional
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Tire uma selfie na hora ou carregue uma foto para deixar a arte mais forte.
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {nativeApp ? (
                      <button
                        type="button"
                        onClick={() => void handleCapturePhoto()}
                        disabled={busyAction === 'camera'}
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyAction === 'camera' ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Camera size={16} />
                        )}
                        {busyAction === 'camera' ? 'Abrindo camera...' : 'Tirar foto'}
                      </button>
                    ) : null}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const selected = event.target.files?.[0] ?? null;
                        void handlePhotoSelected(selected);
                        event.currentTarget.value = '';
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white"
                    >
                      <ImagePlus size={16} />
                      {photoFile ? 'Trocar foto' : 'Carregar foto'}
                    </button>
                  </div>

                  {photoFile ? (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="mt-2 inline-flex items-center gap-2 rounded-[20px] border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                    >
                      <X size={16} />
                      Remover foto
                    </button>
                  ) : null}
                </section>

                <section className="rounded-[24px] border border-zinc-800 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    Compartilhar
                  </p>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => void handleShare('whatsapp')}
                      disabled={busyAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === 'whatsapp' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MessageCircle size={16} />
                      )}
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleShare('instagram')}
                      disabled={busyAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-bold text-fuchsia-300 transition-all hover:bg-fuchsia-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === 'instagram' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Instagram size={16} />
                      )}
                      Instagram
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleShare('save')}
                      disabled={busyAction !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === 'save' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      Salvar no aparelho
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    No app, o envio abre o painel nativo do aparelho. Se o destino nao abrir, a
                    arte sera salva para voce postar depois.
                  </p>
                </section>

                {feedback ? (
                  <div
                    className={`rounded-[22px] border px-4 py-3 text-sm leading-6 ${
                      feedback.tone === 'success'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                        : 'border-rose-500/20 bg-rose-500/10 text-rose-200'
                    }`}
                  >
                    {feedback.message}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
