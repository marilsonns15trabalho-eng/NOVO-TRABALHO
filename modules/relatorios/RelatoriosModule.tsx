'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Activity,
  Loader2,
  Download,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as dashboardService from '@/services/dashboard.service';

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
        alert('Nao ha dados para exportar.');
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
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
      <div className="flex min-h-screen items-center justify-center bg-black p-8">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h3 className="mb-3 text-2xl font-bold">Falha ao carregar relatorios</h3>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-black p-8 text-white">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatorios Mensais</h2>
          <p className="text-zinc-500">Acompanhe as metricas e o desempenho do seu estudio.</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={exporting}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-black transition-all disabled:opacity-50 hover:bg-emerald-600"
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Receitas do Mes</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(metrics.receitas)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Despesas do Mes</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(metrics.despesas)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Saldo Liquido</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(metrics.saldo)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total de Alunos</p>
              <h3 className="text-2xl font-bold text-white">{metrics.totalAlunos}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <Users className="text-orange-500" />
            Metricas de Alunos
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="text-zinc-400">Alunos Ativos</span>
              <span className="font-bold text-emerald-500">{metrics.alunosAtivos}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="text-zinc-400">Alunos Inativos</span>
              <span className="font-bold text-red-500">{metrics.alunosInativos}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="text-zinc-400">Novos Alunos (Mes)</span>
              <span className="font-bold text-blue-500">+{metrics.novosAlunos}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="text-zinc-400">Inadimplentes</span>
              <span className="font-bold text-orange-500">{metrics.inadimplentes}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-white">
            <FileText className="text-orange-500" />
            Documentacoes
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-zinc-500" size={20} />
                <span className="text-zinc-400">Anamneses Pendentes</span>
              </div>
              <span className="font-bold text-white">{metrics.anamnesesPendentes}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="flex items-center gap-3">
                <Activity className="text-zinc-500" size={20} />
                <span className="text-zinc-400">Avaliacoes Pendentes</span>
              </div>
              <span className="font-bold text-white">{metrics.avaliacoesPendentes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
