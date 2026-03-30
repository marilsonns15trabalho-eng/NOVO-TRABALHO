'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Dumbbell,
  FileText,
  Loader2,
  LogOut,
  PlayCircle,
  Save,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AssessmentPhotoGallery from '@/components/avaliacao/AssessmentPhotoGallery';
import ExerciseOfficialPreviewModal from '@/components/treinos/ExerciseOfficialPreviewModal';
import { formatDatePtBr } from '@/lib/date';
import { exportAvaliacaoEvolutionPdf } from '@/lib/pdf/exportAvaliacaoEvolutionPdf';
import { exportAvaliacaoPdf } from '@/lib/pdf/exportAvaliacaoPdf';
import { supabase } from '@/lib/supabase';
import AccountSecurityForm from '@/components/account/AccountSecurityForm';
import { formatTrainingDay, isTreinoRecentlyUpdated, pickTodayWorkout } from '@/lib/training';
import { ensureStudentWorkspace } from '@/services/account.service';
import * as avaliacoesService from '@/services/avaliacoes.service';
import * as exerciseLibraryService from '@/services/exerciseLibrary.service';
import * as treinosService from '@/services/treinos.service';
import type { Avaliacao } from '@/types/avaliacao';
import type { ExerciseLibraryItem } from '@/types/exercise-library';
import type {
  StudentMonthlyTrainingProgress,
  TrainingPlan,
  Treino,
  TreinoExecutionSession,
} from '@/types/treino';

interface StudentPlan {
  plan_name?: string;
  plan_price?: number;
}

type StudentSectionKey = 'inicio' | 'treinos' | 'avaliacoes' | 'conta';

interface OverviewCardProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentClassName: string;
}

function OverviewCard({
  eyebrow,
  title,
  description,
  icon,
  accentClassName,
}: OverviewCardProps) {
  return (
    <div data-lioness-stat className="relative overflow-hidden rounded-[22px] border border-zinc-800 bg-zinc-950/85 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)] md:rounded-[28px] md:p-5">
      <div className={`absolute inset-x-0 top-0 h-px ${accentClassName}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="max-w-[75%]">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
            {eyebrow}
          </p>
          <h3 data-lioness-stat-value className="mt-3 text-[1.85rem] font-bold leading-none text-white md:text-[2rem]">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-500 md:mt-4">{description}</p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-white/90">
          {icon}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div data-lioness-empty className="rounded-[22px] border border-dashed border-zinc-800 bg-black/25 px-5 py-6 md:rounded-[26px] md:px-6 md:py-7">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 text-zinc-300">
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface SnapshotCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentClassName: string;
}

function SnapshotCard({ label, value, icon, accentClassName }: SnapshotCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
      <div className={`absolute inset-x-0 top-0 h-px ${accentClassName}`} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-black/20 p-3 text-white/90">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatAvaliacaoMetric(
  value: number | null | undefined,
  suffix = '',
  digits = 1,
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${suffix}`;
}

function formatAvaliacaoDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
  suffix = '',
  digits = 1,
) {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined ||
    Number.isNaN(current) ||
    Number.isNaN(previous)
  ) {
    return '-';
  }

  const diff = current - previous;
  const sign = diff > 0 ? '+' : '';

  return `${sign}${diff.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}${suffix}`;
}

interface StudentNavItemProps {
  label: string;
  helper: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function StudentNavItem({
  label,
  helper,
  icon,
  active,
  onClick,
}: StudentNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
        active
          ? 'border-orange-500/30 bg-orange-500/10 text-white'
          : 'border-zinc-800 bg-black/20 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className={`mt-1 text-xs leading-5 ${active ? 'text-orange-100/80' : 'text-zinc-500'}`}>
            {helper}
          </p>
        </div>

        <div className={`rounded-2xl p-3 ${active ? 'bg-orange-500/15 text-orange-300' : 'bg-zinc-900 text-zinc-400'}`}>
          {icon}
        </div>
      </div>
    </button>
  );
}

export default function AlunoDashboard() {
  const { user, profile, signOut, isReady } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<TrainingPlan | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<StudentMonthlyTrainingProgress | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [activeSection, setActiveSection] = useState<StudentSectionKey>('inicio');
  const [completingTreinoId, setCompletingTreinoId] = useState<string | null>(null);
  const [executionSession, setExecutionSession] = useState<TreinoExecutionSession | null>(null);
  const [executionTreino, setExecutionTreino] = useState<Treino | null>(null);
  const [executionSaving, setExecutionSaving] = useState(false);
  const [selectedExercisePreview, setSelectedExercisePreview] = useState<ExerciseLibraryItem | null>(null);
  const [exercisePreviewLoadingKey, setExercisePreviewLoadingKey] = useState<string | null>(null);
  const [exercisePreviewError, setExercisePreviewError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!isReady || !user) return;

      try {
        setLoading(true);

        const loadStudentRow = async () => {
          const { data } = await supabase
            .from('students')
            .select('id, plan_id, plan_name')
            .eq('linked_auth_user_id', user.id)
            .maybeSingle();

          return data ?? null;
        };

        let studentRow = await loadStudentRow();

        if (!studentRow) {
          await ensureStudentWorkspace().catch((error) => {
            console.warn('Nao foi possivel preparar automaticamente o cadastro do aluno:', error);
          });
          studentRow = await loadStudentRow();
        }

        const resolvedStudentId = studentRow?.id ?? null;
        setStudentId(resolvedStudentId);

        const [treinosData, avaliacoesData, workoutPlanData, trainingProgressData] = await Promise.all([
          treinosService.fetchTreinos(user.id),
          avaliacoesService.fetchAvaliacoes(user.id, true),
          treinosService.fetchActiveTrainingPlanForStudent(user.id),
          treinosService.fetchStudentMonthlyProgress(user.id),
        ]);

        setTreinos(treinosData);
        setAvaliacoes(avaliacoesData);
        setWorkoutPlan(workoutPlanData);
        setTrainingProgress(trainingProgressData);

        if (!resolvedStudentId) {
          setPlan(null);
          setWorkoutPlan(null);
          setTrainingProgress(null);
          return;
        }

        let currentPlan: StudentPlan | null = studentRow?.plan_name
          ? {
              plan_name: studentRow.plan_name,
            }
          : null;

        if (studentRow?.plan_id) {
          const { data: planRow } = await supabase
            .from('plans')
            .select('name, price')
            .eq('id', studentRow.plan_id)
            .maybeSingle();

          if (planRow) {
            currentPlan = {
              plan_name: planRow.name || studentRow.plan_name || undefined,
              plan_price: Number(planRow.price),
            };
          }
        }

        if (!currentPlan) {
          const { data: assinaturaRows } = await supabase
            .from('assinaturas')
            .select('plan_name, plan_price')
            .eq('student_id', resolvedStudentId)
            .order('created_at', { ascending: false })
            .limit(1);

          currentPlan = ((assinaturaRows || [])[0] as StudentPlan | undefined) || null;
        }

        setPlan(currentPlan);
      } catch (error) {
        console.error('Erro ao carregar area do aluno:', error);
        setPlan(null);
        setWorkoutPlan(null);
        setTrainingProgress(null);
        setTreinos([]);
        setAvaliacoes([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isReady, user]);

  const latestAvaliacao = useMemo(() => avaliacoes[0] ?? null, [avaliacoes]);
  const latestEvolutionBase = useMemo(() => avaliacoes[1] ?? null, [avaliacoes]);
  const latestEvaluationSummary = useMemo(() => {
    if (!latestAvaliacao || !latestEvolutionBase) {
      return null;
    }

    return {
      periodLabel: `${formatDatePtBr(latestEvolutionBase.data)} -> ${formatDatePtBr(latestAvaliacao.data)}`,
      peso: formatAvaliacaoDelta(latestAvaliacao.peso, latestEvolutionBase.peso, ' kg'),
      gordura: formatAvaliacaoDelta(
        latestAvaliacao.percentual_gordura,
        latestEvolutionBase.percentual_gordura,
        '%',
      ),
      massaMagra: formatAvaliacaoDelta(
        latestAvaliacao.massa_magra,
        latestEvolutionBase.massa_magra,
        ' kg',
      ),
      cintura: formatAvaliacaoDelta(latestAvaliacao.cintura, latestEvolutionBase.cintura, ' cm'),
    };
  }, [latestAvaliacao, latestEvolutionBase]);
  const mustChangePassword = Boolean(profile?.must_change_password);
  const firstName = useMemo(() => {
    const baseName = profile?.display_name || user?.email?.split('@')[0] || 'Aluno';
    return baseName.split(' ')[0];
  }, [profile?.display_name, user?.email]);

  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const todayWorkout = useMemo(() => pickTodayWorkout(treinos), [treinos]);
  const todayWorkoutRecentlyUpdated = useMemo(
    () => (todayWorkout ? isTreinoRecentlyUpdated(todayWorkout) : false),
    [todayWorkout],
  );
  const heroTitle = mustChangePassword
    ? 'Seu primeiro acesso esta quase pronto'
    : `${salutation}, ${firstName}`;

  const heroDescription = mustChangePassword
    ? 'Atualize sua senha e escolha uma pergunta secreta para liberar o uso completo do painel com seguranca.'
    : todayWorkout?.current_execution?.status === 'in_progress'
      ? 'Seu treino de hoje ja esta em andamento. Continue a execucao quando voltar ao treino e acompanhe seu progresso do mes.'
      : todayWorkoutRecentlyUpdated
        ? 'Seu treino de hoje recebeu atualizacao recente. Revise as orientacoes antes de iniciar a execucao.'
        : todayWorkout
          ? 'Seu treino de hoje ja esta separado. Abra a execucao quando estiver pronta e acompanhe seu mes pela navegacao abaixo.'
          : 'Use a navegacao abaixo para acompanhar progresso, treinos, avaliacoes e seguranca da conta.';

  const statusItems = [
    {
      label: 'Conta',
      value: mustChangePassword ? 'Aguardando seguranca' : 'Protegida',
    },
    {
      label: 'Cadastro',
      value: studentId ? 'Ativo' : 'Inicializando',
    },
    {
      label: 'Plano',
      value: plan?.plan_name || 'Sem plano',
    },
    {
      label: 'Treino',
      value: workoutPlan?.name || 'Sem plano de treino',
    },
  ];

  const heroSnapshots = [
    {
      label: 'Dias treinados',
      value: String(trainingProgress?.trained_days ?? 0),
      icon: <CheckCircle2 size={18} className="text-emerald-400" />,
      accentClassName: 'bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent',
    },
    {
      label: 'Faltas no mes',
      value: String(trainingProgress?.missed_days ?? 0),
      icon: <XCircle size={18} className="text-rose-400" />,
      accentClassName: 'bg-gradient-to-r from-rose-500/90 via-rose-400/70 to-transparent',
    },
    {
      label: 'Treinos concluidos',
      value: String(trainingProgress?.completed_workouts_count ?? 0),
      icon: <Dumbbell size={18} className="text-sky-400" />,
      accentClassName: 'bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent',
    },
    {
      label: 'Sequencia',
      value: `${trainingProgress?.current_streak ?? 0} dia(s)`,
      icon: <Sparkles size={18} className="text-orange-400" />,
      accentClassName: 'bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent',
    },
  ];
  const sectionItems: Array<{
    key: StudentSectionKey;
    label: string;
    helper: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'inicio',
      label: 'Inicio',
      helper: 'Resumo do mes, plano e treino do dia',
      icon: <ClipboardList size={16} />,
    },
    {
      key: 'treinos',
      label: 'Treinos',
      helper: `${treinos.length} disponiveis`,
      icon: <Dumbbell size={16} />,
    },
    {
      key: 'avaliacoes',
      label: 'Avaliacoes',
      helper: `${avaliacoes.length} registros`,
      icon: <Activity size={16} />,
    },
    {
      key: 'conta',
      label: 'Conta',
      helper: mustChangePassword ? 'Seguranca pendente' : 'Senha e recuperacao',
      icon: <ShieldCheck size={16} />,
    },
  ];

  const refreshStudentTrainingState = async () => {
    if (!user) {
      return;
    }

    const [treinosData, progressData] = await Promise.all([
      treinosService.fetchTreinos(user.id),
      treinosService.fetchStudentMonthlyProgress(user.id),
    ]);

    setTreinos(treinosData);
    setTrainingProgress(progressData);
  };

  const getTreinoStatusLabel = (treino: Treino) => {
    if (treino.completed_today) {
      return 'Concluido';
    }

    if (treino.current_execution?.status === 'in_progress') {
      return 'Em andamento';
    }

    return 'Pendente';
  };

  const openExecutionForTreino = async (treino: Treino) => {
    try {
      const session = await treinosService.startTreinoExecution({ treinoId: treino.id });
      setExecutionTreino(treino);
      setExecutionSession(session);
      setExercisePreviewError(null);
    } catch (error) {
      console.error('Erro ao iniciar execucao do treino:', error);
    }
  };

  const closeExercisePreviewModal = () => {
    setSelectedExercisePreview(null);
  };

  const openExercisePreviewByName = async (
    exerciseName: string,
    loadingKey: string,
    preferredReference?: string | null,
  ) => {
    const normalizedName = exerciseName.trim();
    if (!normalizedName) {
      setExercisePreviewError('Este exercicio nao possui nome suficiente para buscar a demonstracao.');
      return;
    }

    try {
      setExercisePreviewLoadingKey(loadingKey);
      setExercisePreviewError(null);
      const bestMatch = await exerciseLibraryService.resolveOfficialExercisePreview(
        normalizedName,
        preferredReference,
      );

      if (!bestMatch) {
        setExercisePreviewError('Nao encontramos demonstracao oficial para este exercicio.');
        return;
      }

      setSelectedExercisePreview(bestMatch);
    } catch (error) {
      setExercisePreviewError(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel abrir a demonstracao oficial do exercicio.',
      );
    } finally {
      setExercisePreviewLoadingKey(null);
    }
  };

  const updateExecutionItem = (index: number, field: string, value: string | number | boolean) => {
    setExecutionSession((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      };
    });
  };

  const handleSaveExecution = async (markCompleted = false) => {
    if (!executionSession) {
      return;
    }

    try {
      setExecutionSaving(true);
      const saved = await treinosService.saveTreinoExecution({
        sessionId: executionSession.id,
        items: executionSession.items,
        notes: executionSession.notes || '',
        markCompleted,
      });

      setExecutionSession(saved);
      await refreshStudentTrainingState();

      if (markCompleted) {
        setExecutionSession(null);
        setExecutionTreino(null);
      }
    } catch (error) {
      console.error('Erro ao salvar execucao do treino:', error);
    } finally {
      setExecutionSaving(false);
    }
  };

  const handleToggleTreinoCompletion = async (treino: Treino) => {
    if (!studentId || !user || completingTreinoId) {
      return;
    }

    try {
      setCompletingTreinoId(treino.id);
      await treinosService.setTreinoCompletion({
        treinoId: treino.id,
        completed: !treino.completed_today,
      });

      await refreshStudentTrainingState();
    } catch (error) {
      console.error('Erro ao atualizar conclusao do treino:', error);
    } finally {
      setCompletingTreinoId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!isReady || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-orange-500" size={42} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      data-lioness-shell
      className="min-h-screen bg-black text-white"
    >
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
              Aluno
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Ola, {firstName}</h1>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6 md:py-8">
        <aside className="hidden w-[290px] shrink-0 md:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/90 p-5 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-black text-black">
                  L
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-white">LIONESS PRIME</h2>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-zinc-500">
                    Painel do aluno
                  </p>
                  <div className="mt-4 inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
                    aluno
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/85 p-3 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
              <div className="space-y-3">
                {sectionItems.map((item) => (
                  <StudentNavItem
                    key={item.key}
                    label={item.label}
                    helper={item.helper}
                    icon={item.icon}
                    active={activeSection === item.key}
                    onClick={() => setActiveSection(item.key)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/85 p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
              <p className="truncate text-sm font-bold text-white">
                {profile?.display_name || user?.email?.split('@')[0] || 'Aluno'}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-500">{user?.email}</p>

              <button
                onClick={handleSignOut}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-400 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-8">
        <section data-lioness-hero className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))] p-5 shadow-[0_36px_120px_-60px_rgba(249,115,22,0.42)] md:rounded-[34px] md:p-8">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                <Sparkles size={14} />
                Aluno
              </div>

              <h2 data-lioness-hero-title className="mt-4 text-2xl font-bold leading-tight text-white md:text-4xl xl:text-5xl">
                {heroTitle}
              </h2>

              <p data-lioness-hero-description className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base md:leading-7">
                {heroDescription}
              </p>

              <div data-lioness-chip-list className="mt-5 flex flex-wrap gap-2.5">
                {statusItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300"
                  >
                    <span className="font-bold text-white">{item.label}:</span> {item.value}
                  </div>
                ))}
              </div>
            </div>

            <div data-lioness-hero-actions className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
              {heroSnapshots.map((item) => (
                <SnapshotCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  accentClassName={item.accentClassName}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-3 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)] md:hidden">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {sectionItems.map((item) => {
              return (
                <StudentNavItem
                  key={item.key}
                  label={item.label}
                  helper={item.helper}
                  icon={item.icon}
                  active={activeSection === item.key}
                  onClick={() => setActiveSection(item.key)}
                />
              );
            })}
          </div>
        </section>

        {activeSection === 'inicio' && (
          <>
        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Progresso
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Painel de progresso</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Dias treinados, faltas estimadas, treinos concluidos e ritmo da semana.
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-emerald-400">
              <ShieldCheck size={22} />
            </div>
          </div>

          {!trainingProgress ? (
            <EmptyState
              title="Progresso ainda indisponivel"
              description="Quando houver plano ativo e treinos concluidos, os dados aparecem aqui."
              icon={<ShieldCheck size={18} />}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <OverviewCard
                  eyebrow="Dias treinados"
                  title={String(trainingProgress.trained_days)}
                  description="Dias do mes em que houve ao menos uma conclusao registrada."
                  icon={<CheckCircle2 size={24} className="text-emerald-400" />}
                  accentClassName="bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent"
                />

                <OverviewCard
                  eyebrow="Dias faltados"
                  title={String(trainingProgress.missed_days)}
                  description="Faltas estimadas com base na frequencia semanal do plano atual."
                  icon={<XCircle size={24} className="text-rose-400" />}
                  accentClassName="bg-gradient-to-r from-rose-500/90 via-rose-400/70 to-transparent"
                />

                <OverviewCard
                  eyebrow="Treinos concluidos"
                  title={String(trainingProgress.completed_workouts_count)}
                  description="Quantidade total de registros de treino concluidos no mes."
                  icon={<Dumbbell size={24} className="text-sky-400" />}
                  accentClassName="bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent"
                />

                <OverviewCard
                  eyebrow="Progresso geral"
                  title={`${trainingProgress.completion_rate}%`}
                  description="Percentual mensal calculado a partir da previsao do plano de treino."
                  icon={<Sparkles size={24} className="text-orange-400" />}
                  accentClassName="bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Frequencia nesta semana
                  </p>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {trainingProgress.this_week_trained_days} dia(s)
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Dias da semana atual com pelo menos um treino concluido.
                  </p>
                </div>
                <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Sequencia atual
                  </p>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {trainingProgress.current_streak} dia(s)
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Dias consecutivos com treino registrado ate hoje.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[26px] border border-zinc-800 bg-black/25 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Treinos realizados no mes
                </p>

                {trainingProgress.completed_workouts.length === 0 ? (
                  <p className="mt-4 text-sm text-zinc-500">
                    Nenhum treino concluido ainda neste mes.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {trainingProgress.completed_workouts.map((item, index) => (
                      <div
                        key={`${item.treino_id}-${item.completed_on}-${index}`}
                        className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-bold text-white">{item.treino_nome}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            treino concluido
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                          <Calendar size={14} />
                          {formatDatePtBr(item.completed_on)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <OverviewCard
            eyebrow="Meu plano"
            title={plan?.plan_name || 'Sem plano ativo'}
            description={
              plan?.plan_price
                ? `Investimento atual de R$ ${Number(plan.plan_price).toFixed(2)} por mes.`
                : 'Nenhum plano financeiro vinculado a esta conta.'
            }
            icon={<ClipboardList size={24} className="text-orange-400" />}
            accentClassName="bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent"
          />

          <OverviewCard
            eyebrow="Plano de treino"
            title={workoutPlan?.name || 'Sem plano'}
            description={
              workoutPlan
                ? `${workoutPlan.weekly_frequency} dias previstos por semana para acompanhar seu progresso.`
                : 'Nenhum plano de treino ativo vinculado a esta conta.'
            }
            icon={<Dumbbell size={24} className="text-sky-400" />}
            accentClassName="bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent"
          />

          <OverviewCard
            eyebrow="Ultima avaliacao"
            title={
              latestAvaliacao?.data
                ? formatDatePtBr(latestAvaliacao.data)
                : 'Sem registro'
            }
            description={
              latestAvaliacao?.percentual_gordura != null
                ? `Percentual de gordura registrado: ${latestAvaliacao.percentual_gordura}%.`
                : 'Nenhuma avaliacao fisica registrada para esta conta.'
            }
            icon={<Activity size={24} className="text-purple-400" />}
            accentClassName="bg-gradient-to-r from-purple-500/90 via-purple-400/70 to-transparent"
          />
        </div>

        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Agenda
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Treino do dia</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Abra o treino programado, registre sua execucao e conclua quando terminar.
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-orange-400">
              <PlayCircle size={22} />
            </div>
          </div>

          {!todayWorkout ? (
            <EmptyState
              title="Nenhum treino programado para hoje"
                description="Hoje nao ha treino agendado. Confira a aba de treinos para ver as fichas disponiveis."
              icon={<Calendar size={18} />}
            />
          ) : (
            <div className="rounded-[26px] border border-zinc-800 bg-black/30 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2">
                    {todayWorkout.split_label ? (
                      <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
                        Split {todayWorkout.split_label}
                      </span>
                    ) : null}
                    {todayWorkoutRecentlyUpdated ? (
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                        Atualizado recentemente
                      </span>
                    ) : null}
                    <span className="rounded-full border border-zinc-800 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                      {formatTrainingDay(todayWorkout.day_of_week)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">{todayWorkout.nome}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {todayWorkout.descricao || 'Sem descricao adicional para o treino de hoje.'}
                  </p>
                  {todayWorkout.coach_notes && (
                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-4 text-sm leading-6 text-zinc-400">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Orientacoes
                      </p>
                      <p className="mt-2">{todayWorkout.coach_notes}</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Exercicios
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {todayWorkout.exercicios?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Status
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {getTreinoStatusLabel(todayWorkout)}
                    </p>
                  </div>
                  <button
                    onClick={() => void openExecutionForTreino(todayWorkout)}
                    className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black"
                  >
                    {todayWorkout.current_execution?.status === 'in_progress' ? 'Continuar execucao' : 'Abrir execucao'}
                  </button>
                  <button
                    onClick={() => void handleToggleTreinoCompletion(todayWorkout)}
                    disabled={!studentId || completingTreinoId === todayWorkout.id}
                    className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {todayWorkout.completed_today ? 'Remover conclusao' : 'Concluir direto'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
          </>
        )}

        {activeSection === 'treinos' && (
        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Treinos
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Meus Treinos</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Veja suas fichas liberadas, abra a execucao e acompanhe o que ja foi concluido.
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-sky-400">
              <Dumbbell size={22} />
            </div>
          </div>

          {treinos.length === 0 ? (
            <EmptyState
              title={studentId ? 'Nenhum treino disponivel no momento' : 'Preparando sua area de treino'}
              description={
                studentId
                  ? 'Nenhum treino foi liberado para esta conta ate o momento.'
                  : 'Seu cadastro ainda esta finalizando a preparacao dos treinos.'
              }
              icon={studentId ? <Dumbbell size={18} /> : <AlertTriangle size={18} />}
            />
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-black/20">
              {treinos.map((treino) => (
                <div
                  key={treino.id}
                  className="border-b border-zinc-800 px-4 py-4 last:border-b-0 md:px-5"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-white">{treino.nome}</h3>
                        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          {treino.nivel || 'Sem nivel'}
                        </span>
                        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                          {treino.duracao_minutos || 0} min
                        </span>
                        {treino.split_label ? (
                          <span className="rounded-full border border-orange-500/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">
                            {treino.split_label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate text-sm text-zinc-500">
                        {treino.descricao || treino.objetivo || 'Treino sem descricao adicional.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {treino.day_of_week != null ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-semibold text-zinc-400">
                            {formatTrainingDay(treino.day_of_week)}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-semibold text-zinc-400">
                          Exercicios: {treino.exercicios?.length || 0}
                        </span>
                        {isTreinoRecentlyUpdated(treino) ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300">
                            Atualizado recentemente
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-center">
                      {treino.completed_today ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                          <ShieldCheck size={14} />
                          Concluido hoje
                        </span>
                      ) : treino.current_execution?.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                          <PlayCircle size={14} />
                          Em andamento
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                          <Calendar size={14} />
                          Pendente hoje
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <button
                        onClick={() => void openExecutionForTreino(treino)}
                        disabled={!studentId}
                        className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <PlayCircle size={16} />
                        {treino.current_execution?.status === 'in_progress' ? 'Continuar' : 'Abrir'}
                      </button>

                      <button
                        onClick={() => void handleToggleTreinoCompletion(treino)}
                        disabled={!studentId || completingTreinoId === treino.id}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                          treino.completed_today
                            ? 'border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-black'
                            : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black'
                        }`}
                      >
                        {completingTreinoId === treino.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : treino.completed_today ? (
                          <XCircle size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        {treino.completed_today ? 'Remover' : 'Concluir'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {activeSection === 'avaliacoes' && (
        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Evolucao
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Minhas Avaliacoes</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Consulte seu historico corporal, acompanhe a comparacao entre registros e exporte os mesmos PDFs usados pela equipe.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {latestAvaliacao ? (
                <button
                  type="button"
                  onClick={() => void exportAvaliacaoPdf(latestAvaliacao)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white"
                >
                  <FileText size={16} />
                  PDF avaliacao atual
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => latestAvaliacao && latestEvolutionBase && void exportAvaliacaoEvolutionPdf(latestEvolutionBase, latestAvaliacao)}
                disabled={!latestAvaliacao || !latestEvolutionBase}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  latestAvaliacao && latestEvolutionBase
                    ? 'border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500 hover:text-black'
                    : 'cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500'
                }`}
                title={
                  latestAvaliacao && latestEvolutionBase
                    ? 'Exportar comparacao entre a avaliacao atual e a anterior.'
                    : 'A evolucao em PDF e liberada a partir da segunda avaliacao.'
                }
              >
                <TrendingUp size={16} />
                PDF evolucao
              </button>
            </div>
          </div>

          {avaliacoes.length === 0 ? (
            <EmptyState
              title="Nenhuma avaliacao fisica disponivel"
              description="Ainda nao existe avaliacao fisica registrada para esta conta."
              icon={<Activity size={18} />}
            />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-[26px] border border-zinc-800 bg-black/30 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Avaliacoes registradas
                  </p>
                  <p className="mt-3 text-3xl font-bold text-white">{avaliacoes.length}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Seu historico corporal completo fica salvo aqui para consulta e exportacao.
                  </p>
                </div>

                <div className="rounded-[26px] border border-zinc-800 bg-black/30 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Ultima avaliacao
                  </p>
                  <p className="mt-3 text-3xl font-bold text-white">
                    {latestAvaliacao?.data ? formatDatePtBr(latestAvaliacao.data) : '-'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Peso atual: {formatAvaliacaoMetric(latestAvaliacao?.peso, ' kg')} • BF atual:{' '}
                    {formatAvaliacaoMetric(latestAvaliacao?.percentual_gordura, '%')}
                  </p>
                </div>

                <div className="rounded-[26px] border border-zinc-800 bg-black/30 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Base comparativa
                  </p>
                  <p className="mt-3 text-3xl font-bold text-white">
                    {latestEvaluationSummary ? 'Disponivel' : 'Aguardando'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {latestEvaluationSummary
                      ? `Periodo analisado: ${latestEvaluationSummary.periodLabel}.`
                      : 'A evolucao em PDF e exibida a partir da segunda avaliacao registrada.'}
                  </p>
                </div>
              </div>

              {latestEvaluationSummary ? (
                <div className="rounded-[28px] border border-sky-500/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(2,6,23,0.45))] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-300/80">
                        Evolucao recente
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-white">
                        Comparacao entre os dois ultimos registros
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {latestEvaluationSummary.periodLabel}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => latestAvaliacao && latestEvolutionBase && void exportAvaliacaoEvolutionPdf(latestEvolutionBase, latestAvaliacao)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-200 transition-all hover:bg-sky-400 hover:text-black"
                    >
                      <Download size={16} />
                      Exportar evolucao
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Peso</p>
                      <p className="mt-2 text-xl font-bold text-white">{latestEvaluationSummary.peso}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">BF</p>
                      <p className="mt-2 text-xl font-bold text-white">{latestEvaluationSummary.gordura}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Massa magra</p>
                      <p className="mt-2 text-xl font-bold text-white">{latestEvaluationSummary.massaMagra}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Cintura</p>
                      <p className="mt-2 text-xl font-bold text-white">{latestEvaluationSummary.cintura}</p>
                    </div>
                  </div>

                  {(latestEvolutionBase?.photos?.length || latestAvaliacao?.photos?.length) ? (
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <AssessmentPhotoGallery
                        title="Fotos base"
                        subtitle={latestEvolutionBase ? formatDatePtBr(latestEvolutionBase.data) : undefined}
                        photos={latestEvolutionBase?.photos}
                        compact
                      />
                      <AssessmentPhotoGallery
                        title="Fotos de atualizacao"
                        subtitle={latestAvaliacao ? formatDatePtBr(latestAvaliacao.data) : undefined}
                        photos={latestAvaliacao?.photos}
                        compact
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {avaliacoes.map((avaliacao, index) => {
                  const comparisonBase = avaliacoes[index + 1] ?? null;

                  return (
                    <div
                      key={avaliacao.id}
                      className="rounded-[26px] border border-zinc-800 bg-black/30 p-5"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold text-white">
                            {avaliacao.data
                              ? formatDatePtBr(avaliacao.data)
                              : 'Sem data'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                            Registro de composicao corporal
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                            {avaliacao.protocolo || 'faulkner'}
                          </div>
                          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] ${
                            comparisonBase
                              ? 'border border-sky-500/20 bg-sky-500/10 text-sky-300'
                              : 'border border-zinc-800 bg-zinc-900/70 text-zinc-500'
                          }`}>
                            {comparisonBase ? 'Com evolucao' : 'Primeiro registro'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Peso
                          </p>
                          <p className="mt-2 text-xl font-bold text-white">
                            {formatAvaliacaoMetric(avaliacao.peso, ' kg')}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            IMC
                          </p>
                          <p className="mt-2 text-xl font-bold text-white">
                            {formatAvaliacaoMetric(avaliacao.imc, '', 1)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Altura
                          </p>
                          <p className="mt-2 text-xl font-bold text-white">
                            {formatAvaliacaoMetric(avaliacao.altura, ' m', 2)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            BF
                          </p>
                          <p className="mt-2 text-xl font-bold text-white">
                            {formatAvaliacaoMetric(avaliacao.percentual_gordura, '%')}
                          </p>
                        </div>
                      </div>

                      {comparisonBase ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-sky-500/12 bg-sky-500/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                              Peso x anterior
                            </p>
                            <p className="mt-2 text-base font-bold text-white">
                              {formatAvaliacaoDelta(avaliacao.peso, comparisonBase.peso, ' kg')}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-sky-500/12 bg-sky-500/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                              BF x anterior
                            </p>
                            <p className="mt-2 text-base font-bold text-white">
                              {formatAvaliacaoDelta(
                                avaliacao.percentual_gordura,
                                comparisonBase.percentual_gordura,
                                '%',
                              )}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-sky-500/12 bg-sky-500/5 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                              Cintura x anterior
                            </p>
                            <p className="mt-2 text-base font-bold text-white">
                              {formatAvaliacaoDelta(avaliacao.cintura, comparisonBase.cintura, ' cm')}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {(avaliacao.photos?.length || comparisonBase?.photos?.length) ? (
                        <div className={`mt-4 grid gap-4 ${comparisonBase ? 'xl:grid-cols-2' : ''}`}>
                          {comparisonBase ? (
                            <AssessmentPhotoGallery
                              title="Fotos base"
                              subtitle={formatDatePtBr(comparisonBase.data)}
                              photos={comparisonBase.photos}
                              compact
                            />
                          ) : null}
                          <AssessmentPhotoGallery
                            title={comparisonBase ? 'Fotos de atualizacao' : 'Fotos desta avaliacao'}
                            subtitle={
                              comparisonBase
                                ? formatDatePtBr(avaliacao.data)
                                : 'Clique em uma foto para ampliar.'
                            }
                            photos={avaliacao.photos}
                            compact
                          />
                        </div>
                      ) : null}

                      {avaliacao.observacoes && (
                        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Observacoes
                          </p>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {avaliacao.observacoes}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void exportAvaliacaoPdf(avaliacao)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white"
                        >
                          <FileText size={16} />
                          PDF avaliacao
                        </button>

                        <button
                          type="button"
                          onClick={() => comparisonBase && void exportAvaliacaoEvolutionPdf(comparisonBase, avaliacao)}
                          disabled={!comparisonBase}
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                            comparisonBase
                              ? 'border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500 hover:text-black'
                              : 'cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500'
                          }`}
                          title={
                            comparisonBase
                              ? `Comparar com ${formatDatePtBr(comparisonBase.data)}`
                              : 'A evolucao em PDF e liberada a partir do segundo registro.'
                          }
                        >
                          <Download size={16} />
                          PDF evolucao
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
        )}

        {activeSection === 'conta' && !mustChangePassword && (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                  Conta
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">Seguranca do acesso</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                  Atualize sua senha quando quiser e mantenha uma pergunta secreta configurada para recuperar a conta com rapidez.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                <ShieldCheck size={14} />
                Protecao ativa
              </div>
            </div>

            <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/70 p-3 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.95)]">
              <AccountSecurityForm compact />
            </section>
          </section>
        )}
        </div>
      </div>

      {executionSession && executionTreino && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 px-4 py-6 backdrop-blur-md">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[34px] border border-zinc-800 bg-zinc-950 p-5 shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                  Execucao do treino
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white">{executionTreino.nome}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Marque os exercicios concluidos, ajuste carga ou repeticoes e salve quando quiser.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {formatTrainingDay(executionTreino.day_of_week)}
                </span>
                {executionTreino.split_label ? (
                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                    Split {executionTreino.split_label}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {exercisePreviewError ? (
                <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
                  {exercisePreviewError}
                </div>
              ) : null}

              {executionSession.items.map((item, index) => (
                <div key={`${executionSession.id}-${item.exercise_index}`} className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-white">{item.exercise_name}</p>
                        {executionTreino.exercicios?.[index]?.biblioteca_tem_demonstracao ? (
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                            Guia visual
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Planejado: {item.planned_sets || '-'} series • {item.planned_reps || '-'} reps • carga {item.planned_load || '-'}
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm font-bold text-white">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => updateExecutionItem(index, 'completed', e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-700 bg-black text-orange-500 focus:ring-orange-500/40"
                      />
                      Concluido
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        void openExercisePreviewByName(
                          item.exercise_name,
                          `${executionSession.id}-${item.exercise_index}`,
                          executionTreino.exercicios?.[index]?.biblioteca_referencia ||
                            executionTreino.exercicios?.[index]?.biblioteca_titulo ||
                            null,
                        )
                      }
                      disabled={exercisePreviewLoadingKey === `${executionSession.id}-${item.exercise_index}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {exercisePreviewLoadingKey === `${executionSession.id}-${item.exercise_index}`
                        ? 'Buscando...'
                        : 'Como executar'}
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <input
                      type="number"
                      min="0"
                      value={item.performed_sets ?? ''}
                      onChange={(e) => updateExecutionItem(index, 'performed_sets', Number(e.target.value) || 0)}
                      className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                      placeholder="Series feitas"
                    />
                    <input
                      value={item.performed_reps ?? ''}
                      onChange={(e) => updateExecutionItem(index, 'performed_reps', e.target.value)}
                      className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                      placeholder="Repeticoes feitas"
                    />
                    <input
                      value={item.performed_load ?? ''}
                      onChange={(e) => updateExecutionItem(index, 'performed_load', e.target.value)}
                      className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                      placeholder="Carga utilizada"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={item.notes ?? ''}
                    onChange={(e) => updateExecutionItem(index, 'notes', e.target.value)}
                    className="mt-3 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Observacoes do exercicio"
                  />
                </div>
              ))}
            </div>

            <textarea
              rows={3}
              value={executionSession.notes ?? ''}
              onChange={(e) =>
                setExecutionSession((current) => (current ? { ...current, notes: e.target.value } : current))
              }
              className="mt-5 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
              placeholder="Observacoes gerais da execucao"
            />

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <button
                onClick={() => {
                  setExecutionSession(null);
                  setExecutionTreino(null);
                  setExercisePreviewError(null);
                }}
                className="flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700"
              >
                Fechar
              </button>
              <button
                onClick={() => void handleSaveExecution(false)}
                disabled={executionSaving}
                className="flex-1 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-4 font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  {executionSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar progresso
                </span>
              </button>
              <button
                onClick={() => void handleSaveExecution(true)}
                disabled={executionSaving}
                className="flex-1 rounded-2xl bg-emerald-500 px-4 py-4 font-bold text-black transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  {executionSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Concluir treino
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedExercisePreview ? (
        <ExerciseOfficialPreviewModal
          item={selectedExercisePreview}
          onClose={closeExercisePreviewModal}
        />
      ) : null}

      {mustChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 px-6 py-10 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-[34px] border border-zinc-800 bg-zinc-950 p-4 shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)]">
            <div className="rounded-[28px] border border-orange-500/20 bg-orange-500/10 px-5 py-4 text-orange-200">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-300/80">
                      Primeiro acesso
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      Conclua sua seguranca para liberar o painel
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                  <ArrowRight size={14} />
                  Etapa obrigatoria
                </div>
              </div>
            </div>

            <div className="mt-4">
              <AccountSecurityForm required compact />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
