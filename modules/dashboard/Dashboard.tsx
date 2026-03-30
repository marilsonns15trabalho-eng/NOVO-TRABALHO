'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Dumbbell,
  Loader2,
  MessageCircle,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartWrapper from '@/components/ChartWrapper';
import { Toast } from '@/components/ui';
import { useDashboard } from '@/hooks/useDashboard';
import { useNotification } from '@/hooks/useNotification';
import { formatDatePtBr } from '@/lib/date';
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from '@/lib/phone';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentClassName: string;
  onClick: () => void;
}

function MetricCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  accentClassName,
  onClick,
}: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      data-lioness-stat
      className="group relative overflow-hidden rounded-[22px] border border-zinc-800 bg-zinc-950/85 p-4 text-left shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)] transition-all hover:border-zinc-700 md:rounded-[28px] md:p-5"
    >
      <div className={`absolute inset-x-0 top-0 h-px ${accentClassName}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">{label}</p>
          <p data-lioness-stat-value className="mt-3 text-[1.85rem] font-bold tracking-tight text-white md:mt-4 md:text-3xl">{value}</p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3">
          <Icon size={22} className="text-white" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between md:mt-6">
        <div
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${
            trend === 'up'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-rose-500/10 text-rose-300'
          }`}
        >
          {change}
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 transition-colors group-hover:text-zinc-400">
          abrir
          <ArrowRight size={14} />
        </span>
      </div>
    </button>
  );
}

interface ActionTileProps {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  filled?: boolean;
}

function ActionTile({
  label,
  subtitle,
  icon: Icon,
  onClick,
  filled = false,
}: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      data-lioness-action
      className={`group rounded-[20px] border p-3.5 text-left transition-all md:rounded-[24px] md:p-4 ${
        filled
          ? 'border-orange-500/20 bg-orange-500 text-black hover:bg-orange-600'
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
            filled
              ? 'bg-black/10 text-black'
              : 'bg-zinc-900 text-orange-400 group-hover:bg-zinc-800'
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </button>
  );
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const {
    error,
    loading,
    stats,
    chartData,
    activities,
    proximosVencimentos,
    formatCurrency,
    loadData,
  } = useDashboard();
  const { notification, showNotification, clearNotification } = useNotification();

  const [chartView, setChartView] = useState<'mensal' | 'anual'>('mensal');

  const handleWhatsAppReminder = (aluno: any, bill: any) => {
    const phone = normalizeWhatsAppPhone(aluno.phone);
    const dueDate = formatDatePtBr(bill.due_date);
    const amount = Number(bill.amount || 0).toFixed(2);
    const message = `Ola ${aluno.name}, passando para lembrar que sua mensalidade de R$ ${amount} vence em ${dueDate}.`;

    if (phone) {
      window.open(buildWhatsAppUrl(phone, message), '_blank');
    } else {
      showNotification('Aluno sem telefone cadastrado.', 'error');
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: 'Total de alunos',
        value: stats.totalAlunos.toString(),
        icon: Users,
        change: '+5%',
        trend: 'up' as const,
        tab: 'alunos',
        accent: 'bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent',
      },
      {
        label: 'Receita mensal',
        value: formatCurrency(stats.receitaMensal),
        icon: DollarSign,
        change: stats.receitaChange,
        trend: (stats.receitaChange.startsWith('-') ? 'down' : 'up') as 'up' | 'down',
        tab: 'financeiro',
        accent: 'bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent',
      },
      {
        label: 'Planos ativos',
        value: stats.planosAtivos.toString(),
        icon: TrendingUp,
        change: '+3%',
        trend: 'up' as const,
        tab: 'planos',
        accent: 'bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent',
      },
      {
        label: 'Treinos ativos',
        value: stats.treinosAtivos.toString(),
        icon: Dumbbell,
        change: 'Estavel',
        trend: 'up' as const,
        tab: 'treinos',
        accent: 'bg-gradient-to-r from-purple-500/90 via-purple-400/70 to-transparent',
      },
    ],
    [formatCurrency, stats]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
        <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-950 p-8 text-center shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)]">
          <h3 className="mb-3 text-2xl font-bold">Falha ao carregar o painel</h3>
          <p className="mb-6 text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => void loadData()}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-bold text-black transition-all hover:bg-orange-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div data-lioness-shell className="min-h-screen space-y-6 bg-transparent p-4 text-white md:space-y-8 md:p-8">
        <section data-lioness-hero className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))] p-5 shadow-[0_36px_120px_-60px_rgba(249,115,22,0.42)] md:rounded-[34px] md:p-8">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-300">
                Painel executivo
              </div>

              <h2 data-lioness-hero-title className="mt-4 text-2xl font-bold leading-tight text-white md:text-4xl xl:text-5xl">
                Resumo do estudio
              </h2>

              <p data-lioness-hero-description className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base md:leading-7">
                Receita, alunos, vencimentos e atividades recentes em uma unica tela.
              </p>

              <div data-lioness-chip-list className="mt-5 flex flex-wrap gap-2.5">
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                  <span className="font-bold text-white">Receita atual:</span> {formatCurrency(stats.receitaMensal)}
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                  <span className="font-bold text-white">Proximos vencimentos:</span> {proximosVencimentos.length}
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                  <span className="font-bold text-white">Atividades:</span> {activities.length}
                </div>
              </div>
            </div>

            <div data-lioness-hero-actions className="grid gap-3 sm:grid-cols-2 xl:w-[400px]">
              <ActionTile
                label="Novo aluno"
                subtitle="Cadastrar e liberar o acesso."
                icon={UserPlus}
                onClick={() => setActiveTab('alunos')}
                filled
              />
              <ActionTile
                label="Nova receita"
                subtitle="Registrar entrada financeira."
                icon={CreditCard}
                onClick={() => setActiveTab('financeiro')}
              />
              <ActionTile
                label="Novo treino"
                subtitle="Organizar programas ativos."
                icon={Dumbbell}
                onClick={() => setActiveTab('treinos')}
              />
              <ActionTile
                label="Relatorios"
                subtitle="Abrir estatisticas e exportacoes."
                icon={Activity}
                onClick={() => setActiveTab('relatorios')}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <MetricCard
                label={stat.label}
                value={stat.value}
                change={stat.change}
                trend={stat.trend}
                icon={stat.icon}
                accentClassName={stat.accent}
                onClick={() => setActiveTab(stat.tab)}
              />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.55fr_0.95fr]">
          <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                  Receita
                </p>
                <h3 className="mt-2 text-3xl font-bold text-white">Visao geral de faturamento</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Acompanhamento dos ultimos 6 meses para leitura rapida da curva de receita.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setChartView('mensal')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    chartView === 'mensal'
                      ? 'bg-orange-500 text-black'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  mensal
                </button>
                <button
                  onClick={() => setChartView('anual')}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    chartView === 'anual'
                      ? 'bg-orange-500 text-black'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  anual
                </button>
              </div>
            </div>

            <div className="h-[360px]">
              <ChartWrapper minHeight={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: '#18181b' }}
                      contentStyle={{
                        backgroundColor: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '16px',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#f97316' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === chartData.length - 1 ? '#f97316' : '#27272a'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
          </section>

          <div className="grid gap-8">
            <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                    Financeiro
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">Proximos vencimentos</h3>
                </div>
                <Calendar size={20} className="text-orange-400" />
              </div>

              <div className="space-y-3">
                {proximosVencimentos.length > 0 ? (
                  proximosVencimentos.map((bill) => (
                    <div
                      key={bill.id}
                      className="rounded-[24px] border border-zinc-800 bg-black/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {bill.students?.name || 'Aluno'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            vence em {formatDatePtBr(bill.due_date)}
                          </p>
                        </div>

                        <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                          R$ {bill.amount}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-zinc-500">Lembrete rapido para WhatsApp</p>
                        <button
                          onClick={() =>
                            handleWhatsAppReminder(
                              { name: bill.students?.name || '', phone: bill.students?.phone },
                              bill
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black"
                        >
                          <MessageCircle size={14} />
                          Enviar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
                    Nenhum vencimento proximo no momento.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.92)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                    Operacao
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">Atividades recentes</h3>
                </div>
                <Activity size={20} className="text-orange-400" />
              </div>

              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => setActiveTab('financeiro')}
                      className="flex w-full items-start gap-4 rounded-[24px] border border-zinc-800 bg-black/25 p-4 text-left transition-all hover:border-zinc-700"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 font-bold text-white">
                        {activity.user
                          .split(' ')
                          .map((part: string) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-white">{activity.user}</p>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                            {activity.time}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-500">{activity.action}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
                    Nenhuma atividade recente encontrada.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Toast notification={notification} onClose={clearNotification} />
    </>
  );
}
