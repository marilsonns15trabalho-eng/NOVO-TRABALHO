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
  Dumbbell,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AccountSecurityForm from '@/components/account/AccountSecurityForm';
import * as avaliacoesService from '@/services/avaliacoes.service';
import * as treinosService from '@/services/treinos.service';
import type { Avaliacao } from '@/types/avaliacao';
import type { StudentMonthlyTrainingProgress, TrainingPlan, Treino } from '@/types/treino';

interface StudentPlan {
  plan_name?: string;
  plan_price?: number;
}

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
  const [completingTreinoId, setCompletingTreinoId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!isReady || !user) return;

      try {
        setLoading(true);

        const { data: studentRow } = await supabase
          .from('students')
          .select('id, plan_id, plan_name')
          .eq('linked_auth_user_id', user.id)
          .maybeSingle();

        const resolvedStudentId = studentRow?.id ?? null;
        setStudentId(resolvedStudentId);

        const [treinosData, avaliacoesData, workoutPlanData, trainingProgressData] = await Promise.all([
          treinosService.fetchTreinos(user.id),
          avaliacoesService.fetchAvaliacoes(user.id),
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
  const mustChangePassword = Boolean(profile?.must_change_password);
  const firstName = useMemo(() => {
    const baseName = profile?.display_name || user?.email?.split('@')[0] || 'Aluno';
    return baseName.split(' ')[0];
  }, [profile?.display_name, user?.email]);

  const heroTitle = mustChangePassword
    ? 'Seu primeiro acesso esta quase pronto'
    : studentId
      ? 'Seu painel pessoal esta organizado'
      : 'Seu acesso foi criado com sucesso';

  const heroDescription = mustChangePassword
    ? 'Atualize sua senha e escolha uma pergunta secreta para liberar o uso completo do painel com seguranca.'
    : studentId
      ? 'Acompanhe seus treinos, avaliacoes e informacoes do plano em um ambiente mais claro e profissional.'
      : 'Agora falta apenas a equipe vincular este acesso ao seu cadastro de aluno para liberar plano, treinos e avaliacoes.';

  const statusItems = [
    {
      label: 'Conta',
      value: mustChangePassword ? 'Aguardando seguranca' : 'Protegida',
    },
    {
      label: 'Cadastro',
      value: studentId ? 'Vinculado' : 'Pendente',
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

      const [treinosData, progressData] = await Promise.all([
        treinosService.fetchTreinos(user.id),
        treinosService.fetchStudentMonthlyProgress(user.id),
      ]);

      setTreinos(treinosData);
      setTrainingProgress(progressData);
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
              Area do Aluno
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

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-8">
        <section data-lioness-hero className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))] p-5 shadow-[0_36px_120px_-60px_rgba(249,115,22,0.42)] md:rounded-[34px] md:p-8">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                <Sparkles size={14} />
                Area do aluno
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

            <div data-lioness-hero-actions className="grid gap-3 sm:grid-cols-3 xl:w-[460px]">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Minha conta
                </p>
                <p className="mt-3 text-lg font-bold text-white">
                  {mustChangePassword ? 'Protecao pendente' : 'Tudo em ordem'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Treinos
                </p>
                <p className="mt-3 text-lg font-bold text-white">{treinos.length} disponiveis</p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  Avaliacoes
                </p>
                <p className="mt-3 text-lg font-bold text-white">{avaliacoes.length} registros</p>
              </div>
            </div>
          </div>
        </section>

        {!mustChangePassword && (
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <OverviewCard
            eyebrow="Meu plano"
            title={plan?.plan_name || 'Sem plano ativo'}
            description={
              plan?.plan_price
                ? `Investimento atual de R$ ${Number(plan.plan_price).toFixed(2)} por mes.`
                : 'Consulte a recepcao para definir ou confirmar o plano mais adequado.'
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
                : 'Assim que a equipe definir seu plano de treino, ele aparecera aqui.'
            }
            icon={<Dumbbell size={24} className="text-sky-400" />}
            accentClassName="bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent"
          />

          <OverviewCard
            eyebrow="Treinos"
            title={String(treinos.length)}
            description={
              studentId
                ? 'Seus programas de treino ficam organizados aqui para consulta rapida.'
                : 'Seu cadastro ainda precisa ser vinculado para liberar a leitura dos treinos.'
            }
            icon={<ShieldCheck size={24} className="text-emerald-400" />}
            accentClassName="bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent"
          />

          <OverviewCard
            eyebrow="Ultima avaliacao"
            title={
              latestAvaliacao?.data
                ? new Date(latestAvaliacao.data).toLocaleDateString('pt-BR')
                : 'Sem registro'
            }
            description={
              latestAvaliacao?.percentual_gordura != null
                ? `Percentual de gordura registrado: ${latestAvaliacao.percentual_gordura}%.`
                : 'Nenhuma avaliacao fisica disponivel neste acesso por enquanto.'
            }
            icon={<Activity size={24} className="text-purple-400" />}
            accentClassName="bg-gradient-to-r from-purple-500/90 via-purple-400/70 to-transparent"
          />
        </div>

        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Leitura
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Meus Treinos</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Consulte suas fichas e acompanhe a estrutura dos treinos liberados pela equipe.
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-sky-400">
              <Dumbbell size={22} />
            </div>
          </div>

          {treinos.length === 0 ? (
            <EmptyState
              title={studentId ? 'Nenhum treino disponivel no momento' : 'Seu cadastro ainda nao foi vinculado'}
              description={
                studentId
                  ? 'Assim que a equipe liberar uma ficha para voce, ela aparecera aqui com todos os detalhes.'
                  : 'Seu acesso ja esta ativo, mas ainda falta conectar esta conta ao cadastro de aluno para liberar plano, treinos e historico.'
              }
              icon={studentId ? <Dumbbell size={18} /> : <AlertTriangle size={18} />}
            />
          ) : (
            <div className="space-y-4">
              {treinos.map((treino) => (
                <div
                  key={treino.id}
                  className="rounded-[26px] border border-zinc-800 bg-black/30 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="max-w-3xl">
                      <h3 className="text-xl font-bold text-white">{treino.nome}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {treino.descricao || 'Sem descricao adicional para este treino.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                      <span className="rounded-full border border-zinc-800 px-3 py-1.5">
                        {treino.nivel || 'Sem nivel'}
                      </span>
                      <span className="rounded-full border border-zinc-800 px-3 py-1.5">
                        {treino.duracao_minutos || 0} min
                      </span>
                      <span className="rounded-full border border-zinc-800 px-3 py-1.5">
                        {treino.ativo === false ? 'Inativo' : 'Ativo'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-400">
                      <Calendar size={14} />
                      {treino.created_at
                        ? new Date(treino.created_at).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-400">
                      Objetivo: {treino.objetivo || 'Nao informado'}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-zinc-400">
                      Exercicios: {treino.exercicios?.length || 0}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {treino.completed_today ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                        <ShieldCheck size={14} />
                        Concluido hoje
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        <Calendar size={14} />
                        Ainda nao concluido hoje
                      </span>
                    )}

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
                      {treino.completed_today ? 'Remover conclusao' : 'Marcar como concluido'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Progresso
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Meu mes de treino</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Acompanhamento mensal com dias treinados, faltas estimadas e treinos concluidos.
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-emerald-400">
              <ShieldCheck size={22} />
            </div>
          </div>

          {!trainingProgress ? (
            <EmptyState
              title="Progresso ainda indisponivel"
              description="Assim que seu plano de treino estiver vinculado e os treinos forem concluidos, o acompanhamento mensal aparecera aqui."
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
                          {new Date(item.completed_on).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Evolucao
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">Minhas Avaliacoes</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Veja os registros mais recentes de composicao corporal e acompanhe sua linha de evolucao.
              </p>
            </div>

            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-purple-400">
              <Activity size={22} />
            </div>
          </div>

          {avaliacoes.length === 0 ? (
            <EmptyState
              title="Nenhuma avaliacao fisica disponivel"
              description="Quando a equipe registrar sua primeira avaliacao, os dados aparecerao aqui com resumo visual e historico."
              icon={<Activity size={18} />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {avaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="rounded-[26px] border border-zinc-800 bg-black/30 p-5"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-white">
                        {avaliacao.data
                          ? new Date(avaliacao.data).toLocaleDateString('pt-BR')
                          : 'Sem data'}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                        Registro de composicao corporal
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                      {avaliacao.protocolo || 'faulkner'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Peso
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">
                        {avaliacao.peso ?? '-'} kg
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        IMC
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">{avaliacao.imc ?? '-'}</p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Altura
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">
                        {avaliacao.altura ?? '-'} m
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        BF
                      </p>
                      <p className="mt-2 text-xl font-bold text-white">
                        {avaliacao.percentual_gordura != null
                          ? `${avaliacao.percentual_gordura}%`
                          : '-'}
                      </p>
                    </div>
                  </div>

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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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
