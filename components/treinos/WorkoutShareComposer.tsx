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
import { downloadFile, shareFile } from '@/lib/external-links';
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
  { key: 'story', label: 'Story', helper: 'Perfeito para Instagram e WhatsApp Status.' },
  { key: 'post', label: 'Post', helper: 'Formato mais enxuto para publicacao.' },
  { key: 'status', label: 'Status', helper: 'Mesmo enquadramento vertical do story.' },
];

const INTENSITY_OPTIONS: Array<{ key: WorkoutShareIntensity; label: string; helper: string }> = [
  { key: 'leve', label: 'Leve', helper: 'Treino tecnico ou com ritmo menor.' },
  { key: 'moderada', label: 'Moderada', helper: 'Ritmo consistente e progressivo.' },
  { key: 'alta', label: 'Alta', helper: 'Sessao forte, densa e mais intensa.' },
];

function WorkoutSharePreview(props: {
  format: WorkoutShareFormat;
  previewUrl: string | null;
  data: WorkoutShareCardData;
}) {
  const formatMeta = getWorkoutShareFormatMeta(props.format);
  const visibleExercises = props.data.exercises.slice(0, props.format === 'post' ? 4 : 5);

  return (
    <div
      className={`relative w-full overflow-hidden border border-zinc-800 bg-black ${formatMeta.aspectClassName}`}
    >
      {props.previewUrl ? (
        <img
          src={props.previewUrl}
          alt="Foto do treino"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.28),_transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.82)_42%,rgba(0,0,0,0.98))]" />

      <div className="relative flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex h-11 w-11 items-center justify-center bg-orange-500 text-xl font-black text-black">
              L
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-200">
              Acesso mobile
            </p>
          </div>
          <div className="bg-black/55 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              {formatMeta.label}
            </p>
            <p className="mt-1 text-xs font-semibold text-white">
              {formatDatePtBr(props.data.completedOn)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-3xl font-black uppercase leading-none tracking-[-0.05em] text-white sm:text-4xl">
            Treino
          </p>
          <p className="text-3xl font-black uppercase leading-none tracking-[-0.05em] text-orange-400 sm:text-4xl">
            Finalizado
          </p>
          <p className="mt-3 max-w-[18rem] text-sm leading-6 text-zinc-200">
            {props.data.studentName
              ? `${props.data.studentName} concluiu ${props.data.treinoName}.`
              : `${props.data.treinoName} concluido com sucesso.`}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="bg-black/70 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Kcal estimadas
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-orange-400">
              {props.data.caloriesEstimate ?? '--'}
            </p>
          </div>
          <div className="bg-black/70 p-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Duracao
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
              {props.data.durationMinutes ?? '--'}
              <span className="ml-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                min
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 bg-orange-500 px-4 py-3 text-black">
          <p className="text-[10px] font-black uppercase tracking-[0.24em]">Intensidade</p>
          <p className="mt-1 text-2xl font-black uppercase tracking-[-0.04em]">
            {props.data.intensity}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em]">
            {props.data.exercisesCompleted}/{Math.max(props.data.exercisesCompleted, props.data.exercises.length)} exercicios concluidos
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {visibleExercises.map((exercise, index) => (
            <div key={`${exercise.name}-${index}`} className="flex items-center gap-3 bg-black/60 px-3 py-3 backdrop-blur-sm">
              <div className={`flex h-8 w-8 items-center justify-center text-xs font-black ${exercise.completed === false ? 'bg-zinc-800 text-zinc-300' : 'bg-orange-500 text-black'}`}>
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold uppercase tracking-[0.02em] text-white">
                  {exercise.name}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  {[exercise.sets ? `${exercise.sets} series` : null, exercise.reps ? `${exercise.reps} reps` : null]
                    .filter(Boolean)
                    .join(' • ') || 'Execucao concluida'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
            Lioness Personal Estudio
          </p>
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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
        completed:
          completedExercises == null
            ? true
            : index < Math.max(0, completedExercises),
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
      setError(null);
      const optimized = await optimizeAssessmentPhotoFile(incomingFile);
      setPhotoFile(optimized);
      setPhotoPreviewUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }

        return URL.createObjectURL(optimized);
      });
    } catch (selectionError: any) {
      setError(selectionError?.message || 'Nao foi possivel preparar a foto para o card.');
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setBusyAction('camera');
      setError(null);
      const captured = await captureWorkoutSharePhotoFile();
      await handlePhotoSelected(captured);
    } catch (captureError: any) {
      setError(captureError?.message || 'Nao foi possivel abrir a camera agora.');
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
  };

  const handleShare = async (action: WorkoutShareAction) => {
    if (!cardData) {
      return;
    }

    try {
      setBusyAction(action);
      setError(null);

      const imageFile = await renderWorkoutShareImage({
        format,
        data: cardData,
        photoFile,
      });

      const message = buildWorkoutShareMessage(cardData);
      if (action === 'save') {
        if (nativeApp) {
          const shared = await shareFile({
            file: imageFile,
            title: 'Salvar imagem do treino',
            text: message,
            dialogTitle: 'Salvar ou enviar imagem',
          });

          if (!shared) {
            setError('Nao foi possivel abrir as opcoes do aparelho para salvar a imagem agora.');
          }
        } else {
          await downloadFile(imageFile);
        }

        return;
      }

      const targetLabel = action === 'whatsapp' ? 'WhatsApp' : 'Instagram';
      const shared = await shareFile({
        file: imageFile,
        title: `Treino finalizado • ${cardData.treinoName}`,
        text: message,
        dialogTitle: `Compartilhar no ${targetLabel}`,
      });

      if (!shared) {
        if (nativeApp) {
          setError(`Nao foi possivel abrir o compartilhamento para o ${targetLabel} agora.`);
        } else {
          await downloadFile(imageFile);
          setError(
            `O compartilhamento direto nao esta disponivel neste aparelho. A imagem foi baixada para voce postar no ${targetLabel}.`,
          );
        }
      }
    } catch (shareError: any) {
      setError(shareError?.message || 'Nao foi possivel gerar a imagem do treino.');
    } finally {
      setBusyAction(null);
    }
  };

  if (!open || !treino || !cardData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/92 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="border border-zinc-800 bg-zinc-950/96 shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)]">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-300">
                <Sparkles size={14} />
                Compartilhar treino finalizado
              </div>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{treino.nome}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Gere uma arte pronta para Story, publicacao ou Status. A foto e opcional e o card
                sai no formato certo para postar no WhatsApp, Instagram ou salvar para depois.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
              aria-label="Fechar compartilhamento"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-6 px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
            <div className="min-w-0 space-y-4">
              <WorkoutSharePreview
                format={format}
                previewUrl={photoPreviewUrl}
                data={cardData}
              />

              <div className="grid gap-3 md:grid-cols-3">
                <div className="border border-zinc-800 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-orange-300">
                    <Flame size={16} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
                      Kcal estimadas
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">
                    {cardData.caloriesEstimate ?? '--'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Estimativa usada para compor o resumo do treino.
                  </p>
                </div>

                <div className="border border-zinc-800 bg-black/30 p-4">
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

                <div className="border border-zinc-800 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-violet-300">
                    <Sparkles size={16} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Execucao</p>
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">
                    {cardData.exercisesCompleted}/{Math.max(cardData.exercises.length, cardData.exercisesCompleted)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Resumo da sessao concluida.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <section className="border border-zinc-800 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Formato da arte
                </p>
                <div className="mt-4 grid gap-2">
                  {FORMAT_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setFormat(option.key)}
                      className={`border px-4 py-3 text-left transition-all ${
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

              <section className="border border-zinc-800 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Intensidade do card
                </p>
                <div className="mt-4 grid gap-2">
                  {INTENSITY_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setIntensity(option.key)}
                      className={`border px-4 py-3 text-left transition-all ${
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

              <section className="border border-zinc-800 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Tempo real do treino
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Se quiser, ajuste o tempo exibido antes de compartilhar.
                </p>

                <div className="mt-4 flex items-center gap-3 border border-zinc-800 bg-zinc-950 px-4 py-3">
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
                  O resumo e atualizado automaticamente conforme esse tempo.
                </p>
              </section>

              <section className="border border-zinc-800 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Foto opcional
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Use uma selfie tirada agora ou carregue uma foto para deixar o resultado com cara
                  de app grande.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {nativeApp ? (
                    <button
                      type="button"
                      onClick={() => void handleCapturePhoto()}
                      disabled={busyAction === 'camera'}
                      className="inline-flex items-center justify-center gap-2 border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === 'camera' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
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
                    className="inline-flex items-center justify-center gap-2 border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white"
                  >
                    <ImagePlus size={16} />
                    {photoFile ? 'Trocar foto' : 'Carregar foto'}
                  </button>
                </div>

                {photoFile ? (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="mt-2 inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                  >
                    <X size={16} />
                    Remover foto
                  </button>
                ) : null}
              </section>

              <section className="border border-zinc-800 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Compartilhar
                </p>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleShare('whatsapp')}
                    disabled={busyAction !== null}
                    className="inline-flex items-center justify-center gap-2 border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction === 'whatsapp' ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleShare('instagram')}
                    disabled={busyAction !== null}
                    className="inline-flex items-center justify-center gap-2 border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-bold text-fuchsia-300 transition-all hover:bg-fuchsia-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction === 'instagram' ? <Loader2 size={16} className="animate-spin" /> : <Instagram size={16} />}
                    Instagram
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleShare('save')}
                    disabled={busyAction !== null}
                    className="inline-flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAction === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Salvar / outras opcoes
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  Escolha onde deseja enviar a arte ou salve para postar depois.
                </p>
              </section>

              {error ? (
                <div className="border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-200">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
