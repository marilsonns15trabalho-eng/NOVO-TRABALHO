'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Calendar,
  ClipboardList,
  Dumbbell,
  Loader2,
  Scale,
  TrendingUp,
  UserRoundCheck,
  Users,
  Utensils,
} from 'lucide-react';
import {
  fetchProfessorDashboardData,
  type ProfessorDashboardData,
} from '@/services/professorDashboard.service';

interface ProfessorDashboardProps {
  onNavigate: (id: string) => void;
}

interface ProfessorMetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentClassName: string;
  onClick?: () => void;
}

function ProfessorMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accentClassName,
  onClick,
}: ProfessorMetricCardProps) {
  const content = (
    <>
      <div className={`absolute inset-x-0 top-0 h-px ${accentClassName}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">{label}</p>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
          <Icon size={20} className="text-white" />
        </div>
      </div>

      <p className="mt-6 text-sm leading-6 text-zinc-500">{detail}</p>
    </>
  );

  if (!onClick) {
    return (
      <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-5 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
        {content}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-5 text-left shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)] transition-all hover:border-zinc-700"
    >
      {content}
      <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 transition-colors group-hover:text-zinc-400">
        abrir
        <ArrowRight size={14} />
      </span>
    </button>
  );
}

interface ProfessorActionTileProps {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  filled?: boolean;
}

function ProfessorActionTile({
  label,
  subtitle,
  icon: Icon,
  onClick,
  filled = false,
}: ProfessorActionTileProps) {
  return (
    <button
      onClick={onClick}
      className={`group rounded-[24px] border p-4 text-left transition-all ${
        filled
          ? 'border-sky-500/20 bg-sky-500 text-black hover:bg-sky-400'
          : 'border-zinc-800 bg-zinc-950/80 text-white hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-bold ${filled ? 'text-black' : 'text-white'}`}>{label}</p>
          <p className={`mt-1 text-xs leading-5 ${filled ? 'text-black/70' : 'text-zinc-500'}`}>
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 ${
            filled ? 'bg-black/10 text-black' : 'bg-zinc-900 text-sky-400 group-hover:bg-zinc-800'
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
}

export default function ProfessorDashboard({ onNavigate }: ProfessorDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfessorDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchProfessorDashboardData();
        setData(result);
      } catch (err: any) {
        setData(null);
        setError(err?.message || 'Nao foi possivel carregar a visao do professor.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const actionTiles = useMemo(
    () => [
      {
        id: 'alunos',
        label: 'Alunos',
        subtitle: 'Consultar alunos e acompanhar status dos cadastros.',
        icon: Users,
        filled: true,
      },
      {
        id: 'treinos',
        label: 'Treinos',
        subtitle: 'Montar e revisar programas ativos com mais agilidade.',
        icon: Dumbbell,
      },
      {
        id: 'avaliacao',
        label: 'Avaliacoes',
        subtitle: 'Registrar novas medicoes e acompanhar evolucao recente.',
        icon: Activity,
      },
      {
        id: 'anamnese',
        label: 'Anamnese',
        subtitle: 'Conferir historico alimentar e dados essenciais do aluno.',
        icon: Utensils,
      },
    ],
    []
  );

  const stats = data?.stats;
  const totalAlunos = stats?.totalAlunos || 0;
  const alunosAtivos = stats?.alunosAtivos || 0;
  const alunosInativos = stats?.alunosInativos || 0;
  const treinosAtivos = stats?.treinosAtivos || 0;
  const avaliacoesRecentes30d = stats?.avaliacoesRecentes30d || 0;
  const taxaAtivos = totalAlunos > 0 ? Math.round((alunosAtivos / totalAlunos) * 100) : 0;
  const coberturaAvaliacoes = totalAlunos > 0 ? Math.round((avaliacoesRecentes30d / totalAlunos) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="animate-spin text-sky-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-8 text-white">
        <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-950 p-8 text-center shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)]">
          <h3 className="mb-3 text-2xl font-bold">Falha ao carregar o painel do professor</h3>
          <p className="mb-6 text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-sky-500 px-6 py-3 font-bold text-black transition-all hover:bg-sky-400"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="min-h-screen space-y-8 bg-transparent p-6 text-white md:p-8"
    >
      <section className="relative overflow-hidden rounded-[34px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))] p-6 shadow-[0_36px_120px_-60px_rgba(14,165,233,0.38)] md:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
              Area do professor
            </div>

            <h2 className="mt-5 text-3xl font-bold leading-tight text-white md:text-5xl">
              Operacao diaria mais clara para acompanhar alunos, treinos e evolucao
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              Veja quem esta ativo, quantas avaliacoes entraram no periodo e quais frentes precisam de atencao imediata.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                <span className="font-bold text-white">Alunos ativos:</span> {alunosAtivos}
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                <span className="font-bold text-white">Treinos ativos:</span> {treinosAtivos}
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                <span className="font-bold text-white">Avaliacoes 30d:</span> {avaliacoesRecentes30d}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
            {actionTiles.map((tile) => (
              <ProfessorActionTile
                key={tile.id}
                label={tile.label}
                subtitle={tile.subtitle}
                icon={tile.icon}
                filled={tile.filled}
                onClick={() => onNavigate(tile.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <ProfessorMetricCard
            label="Total de alunos"
            value={String(totalAlunos)}
            detail={`${taxaAtivos}% da base esta ativa agora.`}
            icon={Users}
            accentClassName="bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent"
            onClick={() => onNavigate('alunos')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <ProfessorMetricCard
            label="Alunos ativos"
            value={String(alunosAtivos)}
            detail={`${alunosInativos} alunos seguem inativos no momento.`}
            icon={UserRoundCheck}
            accentClassName="bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent"
            onClick={() => onNavigate('alunos')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ProfessorMetricCard
            label="Treinos ativos"
            value={String(treinosAtivos)}
            detail="Fluxo pronto para revisar, atualizar e publicar novos treinos."
            icon={Dumbbell}
            accentClassName="bg-gradient-to-r from-violet-500/90 via-violet-400/70 to-transparent"
            onClick={() => onNavigate('treinos')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <ProfessorMetricCard
            label="Avaliacoes 30 dias"
            value={String(avaliacoesRecentes30d)}
            detail={`${coberturaAvaliacoes}% da base passou por avaliacao recente.`}
            icon={TrendingUp}
            accentClassName="bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent"
            onClick={() => onNavigate('avaliacao')}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">Avaliacoes</p>
              <h3 className="mt-2 text-3xl font-bold text-white">Ultimos registros fisicos</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Consulte rapidamente peso, percentual de gordura e data da ultima leitura.
              </p>
            </div>

            <button
              onClick={() => onNavigate('avaliacao')}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 transition-all hover:bg-sky-500 hover:text-black"
            >
              abrir modulo
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {data.ultimasAvaliacoes.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
                Nenhuma avaliacao encontrada ate o momento.
              </div>
            ) : (
              data.ultimasAvaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="rounded-[24px] border border-zinc-800 bg-black/25 p-4 transition-all hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{avaliacao.students?.nome || 'Aluno'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {avaliacao.data ? new Date(avaliacao.data).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Peso</p>
                        <p className="mt-2 text-lg font-bold text-white">
                          {typeof avaliacao.peso === 'number' ? `${avaliacao.peso} kg` : '-'}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Scale size={14} className="text-violet-400" />
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Gordura corporal
                          </p>
                        </div>
                        <p className="mt-2 text-lg font-bold text-white">
                          {typeof avaliacao.percentual_gordura === 'number'
                            ? `${avaliacao.percentual_gordura}%`
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-8">
          <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">Leitura rapida</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Panorama da carteira</h3>
              </div>
              <ClipboardList size={20} className="text-sky-400" />
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Base ativa</p>
                <p className="mt-3 text-3xl font-bold text-white">{taxaAtivos}%</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Percentual de alunos ativos em relacao ao total cadastrado.
                </p>
              </div>

              <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Avaliacoes recentes</p>
                <p className="mt-3 text-3xl font-bold text-white">{coberturaAvaliacoes}%</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Faixa estimada da carteira com leitura fisica registrada nos ultimos 30 dias.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">Atalhos</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Fluxos principais</h3>
              </div>
              <Calendar size={20} className="text-sky-400" />
            </div>

            <div className="grid gap-3">
              {actionTiles.map((tile) => (
                <button
                  key={`link-${tile.id}`}
                  onClick={() => onNavigate(tile.id)}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-zinc-800 bg-black/20 px-4 py-4 text-left transition-all hover:border-zinc-700 hover:bg-black/35"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{tile.label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{tile.subtitle}</p>
                  </div>
                  <ArrowRight size={16} className="text-zinc-500" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
