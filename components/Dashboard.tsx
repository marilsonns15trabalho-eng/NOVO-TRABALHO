'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  UserPlus,
  CreditCard,
  Clock,
  BarChart3,
  Dumbbell,
  Loader2,
  TrendingUp as TrendingUpIcon,
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import ChartWrapper from './ChartWrapper';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';

interface DashboardStats {
  totalAlunos: number;
  receitaMensal: number;
  planosAtivos: number;
  aulasHoje: number;
  alunosChange: string;
  receitaChange: string;
}

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalAlunos: 0,
    receitaMensal: 0,
    planosAtivos: 0,
    aulasHoje: 0,
    alunosChange: '+0%',
    receitaChange: '+0%'
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [proximosVencimentos, setProximosVencimentos] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartView, setChartView] = useState<'mensal' | 'anual'>('mensal');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 1. Total de Alunos
      const { count: totalAlunos } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // 2. Receita Mensal
      const { data: pagamentosMes } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('status', 'pago')
        .eq('tipo', 'receita')
        .gte('data_vencimento', firstDayOfMonth);
      
      const receitaMensal = pagamentosMes?.reduce((acc, curr) => acc + curr.valor, 0) || 0;

      // 3. Planos Ativos
      const { count: planosAtivos } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .not('plan_id', 'is', null);

      // 4. Treinos Ativos (Aulas Hoje proxy)
      const { count: treinosAtivos } = await supabase
        .from('treinos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // 5. Atividades Recentes
      const { data: recentBills } = await supabase
        .from('bills')
        .select('*, students(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = recentBills?.map(b => ({
        id: b.id,
        user: b.students?.name || 'Sistema',
        action: b.status === 'paid' ? 'Pagamento realizado' : 'Boleto gerado',
        time: new Date(b.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: b.status === 'paid' ? 'payment' : 'new_user'
      })) || [];

      // 5. Dados do Gráfico (Últimos 6 meses)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          month: months[d.getMonth()],
          monthNum: d.getMonth(),
          year: d.getFullYear(),
          receita: 0
        });
      }

      const { data: allFinanceiro } = await supabase
        .from('financeiro')
        .select('valor, data_vencimento, status, tipo')
        .eq('tipo', 'receita');

      const chartDataMapped = last6Months.map(m => {
        const total = allFinanceiro?.filter(f => {
          const d = new Date(f.data_vencimento);
          return d.getMonth() === m.monthNum && d.getFullYear() === m.year && f.status === 'pago';
        }).reduce((acc, curr) => acc + curr.valor, 0) || 0;
        return { name: m.month, value: total };
      });

      // Calcular mudanças
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const receitaLastMonth = allFinanceiro?.filter(f => {
        const d = new Date(f.data_vencimento);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear() && f.status === 'pago';
      }).reduce((acc, curr) => acc + curr.valor, 0) || 0;

      const receitaChange = receitaLastMonth > 0 
        ? `${(((receitaMensal - receitaLastMonth) / receitaLastMonth) * 100).toFixed(0)}%`
        : '+0%';

      // Buscar próximos vencimentos
      const { data: proximosVencimentos } = await supabase
        .from('bills')
        .select('*, students(name, phone)')
        .eq('status', 'pending')
        .gte('due_date', now.toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(5);

      setChartData(chartDataMapped);
      setStats({
        totalAlunos: totalAlunos || 0,
        receitaMensal,
        planosAtivos: planosAtivos || 0,
        aulasHoje: treinosAtivos || 0,
        alunosChange: '+5%', // Simplificado
        receitaChange: receitaChange.startsWith('-') ? receitaChange : `+${receitaChange}`
      });
      setRecentActivities(activities);
      setProximosVencimentos(proximosVencimentos || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total de Alunos', value: stats.totalAlunos.toString(), icon: Users, change: stats.alunosChange, trend: 'up' },
    { label: 'Receita Mensal', value: `R$ ${stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, change: stats.receitaChange, trend: 'up' },
    { label: 'Planos Ativos', value: stats.planosAtivos.toString(), icon: TrendingUpIcon, change: '+3%', trend: 'up' },
    { label: 'Aulas Hoje', value: stats.aulasHoje.toString(), icon: Calendar, change: 'Estável', trend: 'up' },
  ];

  const handleWhatsAppReminder = (aluno: any, bill: any) => {
    const message = `Olá ${aluno.name}! 👋 Passando para lembrar que sua mensalidade de R$ ${bill.amount} vence no dia ${new Date(bill.due_date).toLocaleDateString('pt-BR')}. Bons treinos! 🦁`;
    const phone = aluno.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('Aluno sem telefone cadastrado.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              if (stat.label === 'Total de Alunos') setActiveTab('alunos');
              if (stat.label === 'Receita Mensal') setActiveTab('financeiro');
              if (stat.label === 'Planos Ativos') setActiveTab('planos');
              if (stat.label === 'Aulas Hoje') setActiveTab('treinos');
            }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-orange-500/50 transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-zinc-800 rounded-2xl group-hover:bg-orange-500 transition-colors">
                <stat.icon size={24} className="text-orange-500 group-hover:text-black transition-colors" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold">Visão Geral de Receita</h3>
                <p className="text-zinc-500 text-sm">Acompanhamento dos últimos 6 meses</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChartView('mensal')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${chartView === 'mensal' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  Mensal
                </button>
                <button 
                  onClick={() => setChartView('anual')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${chartView === 'anual' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  Anual
                </button>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ChartWrapper minHeight={250}>
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
                    cursor={{ fill: '#27272a' }}
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a', 
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#f97316' : '#27272a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartWrapper>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab('alunos')}
              className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-black font-bold p-4 rounded-2xl transition-all active:scale-95"
            >
              <UserPlus size={20} />
              <span>Novo Aluno</span>
            </button>
            <button 
              onClick={() => setActiveTab('financeiro')}
              className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold p-4 rounded-2xl transition-all active:scale-95"
            >
              <CreditCard size={20} className="text-orange-500" />
              <span>Lançar Receita</span>
            </button>
            <button 
              onClick={() => setActiveTab('treinos')}
              className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold p-4 rounded-2xl transition-all active:scale-95"
            >
              <Dumbbell size={20} className="text-orange-500" />
              <span>Novo Treino</span>
            </button>
          </div>
        </div>

        {/* Sidebar Activities */}
        <div className="space-y-6">
          {/* Próximos Vencimentos */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-orange-500" />
              Próximos Vencimentos
            </h3>
            <div className="space-y-4">
              {proximosVencimentos.length > 0 ? proximosVencimentos.map((bill) => (
                <div key={bill.id} className="p-4 bg-black/40 border border-zinc-800 rounded-2xl group hover:border-orange-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-white">{bill.students?.name}</p>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {new Date(bill.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-zinc-500">R$ {bill.amount}</p>
                    <button 
                      onClick={() => handleWhatsAppReminder(bill.students, bill)}
                      className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-lg transition-all"
                      title="Enviar Lembrete WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-zinc-500 text-sm text-center py-4 italic">Nenhum vencimento próximo.</p>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              Atividades Recentes
            </h3>
            <div className="space-y-6 flex-1">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4 group cursor-pointer" onClick={() => setActiveTab('financeiro')}>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold group-hover:bg-orange-500 group-hover:text-black transition-colors">
                      {activity.user.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${activity.type === 'payment' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                    </div>
                  </div>
                  <div className="flex-1 border-b border-zinc-800 pb-4 group-last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{activity.user}</p>
                      <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">{activity.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{activity.action}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setActiveTab('relatorios')}
              className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Ver Todas as Atividades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
