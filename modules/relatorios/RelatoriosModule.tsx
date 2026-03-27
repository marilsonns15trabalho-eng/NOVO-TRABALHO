'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  DollarSign,
  Download,
  FileText,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Toast } from '@/components/ui';
import * as dashboardService from '@/services/dashboard.service';
import { useNotification } from '@/hooks/useNotification';
import {
  ModuleHero,
  ModuleHeroAction,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
  ModuleSectionHeading,
} from '@/components/dashboard/ModulePrimitives';
import { getLocalDateInputValue } from '@/lib/date';

export default function RelatoriosModule() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    inadimplentes: 0,
    totalAlunos: 0,
    alunosAtivos: 0,
    alunosInativos: 0,
    novosAlunos: 0,
    anamnesesPendentes: 0,
    avaliacoesPendentes: 0,
  });
  const { notification, showNotification, clearNotification } = useNotification();

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await dashboardService.fetchRelatoriosMetrics();
        setMetrics(data);
      } catch (err: any) {
        console.error('Erro ao buscar metricas:', err);
        setError(err?.message || 'Nao foi possivel carregar as metricas.');
      } finally {
        setLoading(false);
      }
    };

    void fetchMetrics();
  }, []);

  const exportToCSV = async () => {
    setExporting(true);

    try {
      const csvContent = await dashboardService.exportFinanceiroCSV();

      if (!csvContent) {
        showNotification('Nao ha dados para exportar.', 'error');
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_financeiro_${getLocalDateInputValue()}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('CSV exportado com sucesso.', 'success');
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      showNotification('Nao foi possivel exportar o CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-8">
        <Loader2 className="animate-spin text-emerald-400" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-8 text-white">
        <div className="w-full max-w-xl rounded-[32px] border border-zinc-800 bg-zinc-950 p-8 text-center shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)]">
          <h3 className="mb-3 text-2xl font-bold">Falha ao carregar relatorios</h3>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ModuleShell>
        <ModuleHero
          badge="Relatorios executivos"
          title="Relatorios e indicadores"
          description="Resumo financeiro, base de alunos e pendencias do periodo."
          accent="emerald"
          chips={[
            { label: 'Receitas', value: formatCurrency(metrics.receitas) },
            { label: 'Despesas', value: formatCurrency(metrics.despesas) },
            { label: 'Saldo', value: formatCurrency(metrics.saldo) },
            { label: 'Inadimplentes', value: String(metrics.inadimplentes) },
          ]}
          actions={
            <>
              <ModuleHeroAction
                label="Exportar CSV"
                subtitle="Levar o consolidado financeiro para fora do sistema."
                icon={Download}
                accent="emerald"
                filled
                onClick={exportToCSV}
                disabled={exporting}
              />
              <ModuleHeroAction
                label="Visao gerencial"
                subtitle="Conferir carteira, documentos pendentes e ritmo do mes."
                icon={BarChart3}
                accent="emerald"
              />
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <ModuleStatCard
            label="Receitas do mes"
            value={formatCurrency(metrics.receitas)}
            detail="Entradas financeiras confirmadas no periodo atual."
            icon={TrendingUp}
            accent="emerald"
          />
          <ModuleStatCard
            label="Despesas do mes"
            value={formatCurrency(metrics.despesas)}
            detail="Saidas registradas e consideradas na leitura mensal."
            icon={DollarSign}
            accent="rose"
          />
          <ModuleStatCard
            label="Saldo liquido"
            value={formatCurrency(metrics.saldo)}
            detail="Resultado financeiro consolidado das operacoes do periodo."
            icon={BarChart3}
            accent="amber"
          />
          <ModuleStatCard
            label="Total de alunos"
            value={String(metrics.totalAlunos)}
            detail="Base atual de alunos considerada no consolidado."
            icon={Users}
            accent="sky"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ModuleSurface className="space-y-6">
            <ModuleSectionHeading
              eyebrow="Carteira"
              title="Metricas de alunos"
              description="Indicadores essenciais de base, ativacao e inadimplencia."
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <span className="text-zinc-400">Alunos ativos</span>
                <span className="font-bold text-emerald-400">{metrics.alunosAtivos}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <span className="text-zinc-400">Alunos inativos</span>
                <span className="font-bold text-rose-400">{metrics.alunosInativos}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <span className="text-zinc-400">Novos alunos no mes</span>
                <span className="font-bold text-sky-400">+{metrics.novosAlunos}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <span className="text-zinc-400">Inadimplentes</span>
                <span className="font-bold text-amber-300">{metrics.inadimplentes}</span>
              </div>
            </div>
          </ModuleSurface>

          <ModuleSurface className="space-y-6">
            <ModuleSectionHeading
              eyebrow="Documentacao"
              title="Pendencias operacionais"
              description="Itens que ainda pedem acao da equipe antes de concluir o ciclo do aluno."
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-zinc-500" size={20} />
                  <span className="text-zinc-400">Anamneses pendentes</span>
                </div>
                <span className="font-bold text-white">{metrics.anamnesesPendentes}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <Activity className="text-zinc-500" size={20} />
                  <span className="text-zinc-400">Avaliacoes pendentes</span>
                </div>
                <span className="font-bold text-white">{metrics.avaliacoesPendentes}</span>
              </div>
            </div>
          </ModuleSurface>
        </div>
      </ModuleShell>

      <Toast notification={notification} onClose={clearNotification} />
    </>
  );
}
