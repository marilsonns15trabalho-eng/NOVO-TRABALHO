'use client';
import React, { useState } from 'react';
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
  Dumbbell,
  Loader2,
  TrendingUp as TrendingUpIcon,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import ChartWrapper from '@/components/ChartWrapper';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
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

  const [chartView, setChartView] = useState<'mensal' | 'anual'>('mensal');

  const handleWhatsAppReminder = (aluno: any, bill: any) => {
    const message = `Olá ${aluno.name}! 👋 Passando para lembrar que sua mensalidade de R$ ${bill.amount} vence no dia ${new Date(bill.due_date).toLocaleDateString('pt-BR')}. Bons treinos! 🦁`;
    const phone = aluno.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('Aluno sem telefone cadastrado.');
    }
  };

  const statCards = [
    { label: 'Total de Alunos', value: stats.totalAlunos.toString(), icon: Users, change: '+5%', trend: 'up', tab: 'alunos' },
    { label: 'Receita Mensal', value: formatCurrency(stats.receitaMensal), icon: DollarSign, change: stats.receitaChange, trend: 'up', tab: 'financeiro' },
    { label: 'Planos Ativos', value: stats.planosAtivos.toString(), icon: TrendingUpIcon, change: '+3%', trend: 'up', tab: 'planos' },
    { label: 'Aulas Hoje', value: stats.treinosAtivos.toString(), icon: Calendar, change: 'Estável', trend: 'up', tab: 'treinos' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h3 className="mb-3 text-2xl font-bold">Falha ao carregar o dashboard</h3>
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
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveTab(stat.tab)}
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
        {/* Gráfico */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold">Visão Geral de Receita</h3>
                <p className="text-zinc-500 text-sm">Acompanhamento dos últimos 6 meses</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setChartView('mensal')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${chartView === 'mensal' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Mensal</button>
                <button onClick={() => setChartView('anual')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${chartView === 'anual' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>Anual</button>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ChartWrapper minHeight={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                  <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#f97316' }} />
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
            <button onClick={() => setActiveTab('alunos')} className="flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-black font-bold p-4 rounded-2xl transition-all active:scale-95">
              <UserPlus size={20} />
              <span>Novo Aluno</span>
            </button>
            <button onClick={() => setActiveTab('financeiro')} className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold p-4 rounded-2xl transition-all active:scale-95">
              <CreditCard size={20} className="text-orange-500" />
              <span>Lançar Receita</span>
            </button>
            <button onClick={() => setActiveTab('treinos')} className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold p-4 rounded-2xl transition-all active:scale-95">
              <Dumbbell size={20} className="text-orange-500" />
              <span>Novo Treino</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
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
                    <p className="text-sm font-bold text-white">{bill.students?.name || 'Aluno'}</p>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {new Date(bill.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-zinc-500">R$ {bill.amount}</p>
                    <button
                      onClick={() => handleWhatsAppReminder({ name: bill.students?.name || '', phone: bill.students?.phone }, bill)}
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

          {/* Atividades Recentes */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-full">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              Atividades Recentes
            </h3>
            <div className="space-y-6 flex-1">
              {activities.map((activity) => (
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
            <button onClick={() => setActiveTab('relatorios')} className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
              Ver Todas as Atividades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
