'use client';

// Hook customizado para o Dashboard
import { useState, useEffect, useCallback } from 'react';
import * as dashboardService from '@/services/dashboard.service';
import type { DashboardStats, DashboardChartData, ProximoVencimento, RecentActivity } from '@/services/dashboard.service';

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    receitaMensal: 0,
    planosAtivos: 0,
    treinosAtivos: 0,
    receitaChange: '+0%',
  });
  const [chartData, setChartData] = useState<DashboardChartData[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [proximosVencimentos, setProximosVencimentos] = useState<ProximoVencimento[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.fetchDashboardData();
      setStats(data.stats);
      setChartData(data.chartData);
      setActivities(data.activities);
      setProximosVencimentos(data.proximosVencimentos);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  return {
    loading,
    stats,
    chartData,
    activities,
    proximosVencimentos,
    formatCurrency,
    loadData,
  };
}
