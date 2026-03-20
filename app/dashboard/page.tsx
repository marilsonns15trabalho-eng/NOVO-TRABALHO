'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { RevenueChart } from '@/components/RevenueChart';
import { ChevronRight, AlertCircle, CheckCircle2, Clock, Plus, User, Users, ClipboardCheck, Activity, TrendingUp, CreditCard, ArrowUpRight, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { format, subMonths, startOfMonth, endOfMonth, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSettings } from '@/lib/SettingsContext';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const [stats, setStats] = useState([
    { label: 'Total de Alunos', value: '0', icon: Users, color: 'orange' },
    { label: 'Alunos Ativos', value: '0', icon: ClipboardCheck, color: 'green' },
    { label: 'Pagamentos Pendentes', value: '0', icon: Activity, color: 'red' },
    { label: 'Receita Mensal', value: 'R$ 0', icon: TrendingUp, color: 'orange' },
    { label: 'Vencimentos Próximos', value: '0', icon: CreditCard, color: 'orange' },
  ]);
  
  const [reminders, setReminders] = useState<any[]>([]);
  const [expirations, setExpirations] = useState<any[]>([]);
  const [signups, setSignups] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: activeStudents } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Ativo');
      
      const { data: pendingPayments } = await supabase
        .from('memberships')
        .select('*')
        .or('status.eq.pending,status.eq.overdue');
      
      const now = new Date();
      const firstDayOfMonth = startOfMonth(now);
      const lastDayOfMonth = endOfMonth(now);
      
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());
      
      const monthlyRevenue = monthlyTransactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
      
      const next7Days = addDays(now, 7);
      const { count: upcomingExpirationsCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .gte('due_date', now.toISOString())
        .lte('due_date', next7Days.toISOString());

      setStats([
        { label: 'Total de Alunos', value: String(totalStudents || 0), icon: Users, color: 'orange' },
        { label: 'Alunos Ativos', value: String(activeStudents || 0), icon: ClipboardCheck, color: 'green' },
        { label: 'Pagamentos Pendentes', value: String(pendingPayments?.length || 0), icon: Activity, color: 'red' },
        { label: 'Receita Mensal', value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'orange' },
        { label: 'Vencimentos Próximos', value: String(upcomingExpirationsCount || 0), icon: CreditCard, color: 'orange' },
      ]);

      // 2. Fetch Reminders (Pending/Overdue Memberships)
      const formattedReminders = pendingPayments?.map(p => ({
        name: p.student_name,
        date: isBefore(new Date(p.due_date), now) ? 'Atrasado' : `Vence ${format(new Date(p.due_date), "dd 'de' MMM", { locale: ptBR })}`,
        amount: `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        status: p.status === 'overdue' ? 'atrasado' : 'pendente'
      })).slice(0, 5) || [];
      setReminders(formattedReminders);

      // 3. Fetch Upcoming Expirations
      const { data: upcomingExpirations } = await supabase
        .from('memberships')
        .select('*')
        .gte('due_date', now.toISOString())
        .lte('due_date', next7Days.toISOString())
        .order('due_date', { ascending: true })
        .limit(5);
      
      setExpirations(upcomingExpirations?.map(e => ({
        name: e.student_name,
        date: `Expira: ${format(new Date(e.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}`
      })) || []);

      // 4. Fetch Recent Signups
      const { data: recentStudents } = await supabase
        .from('students')
        .select('*')
        .order('join_date', { ascending: false })
        .limit(5);
      
      setSignups(recentStudents?.map(s => ({
        name: s.name,
        date: `Entrou: ${format(new Date(s.join_date), "dd 'de' MMM, yyyy", { locale: ptBR })}`
      })) || []);

      // 5. Fetch Revenue Data for Chart (Last 6 months)
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const { data: monthTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'income')
          .gte('date', start.toISOString())
          .lte('date', end.toISOString());
        
        const total = monthTransactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
        chartData.push({
          month: format(monthDate, 'MMM', { locale: ptBR }),
          revenue: total
        });
      }
      setRevenueData(chartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const quickActions = [
    { label: 'Novo Aluno', icon: User, href: '/students', color: 'bg-orange-500' },
    { label: 'Registrar Pagamento', icon: DollarSign, href: '/financial', color: 'bg-emerald-500' },
    { label: 'Nova Transação', icon: ArrowUpRight, href: '/financial', color: 'bg-blue-500' },
    { label: 'Ver Relatórios', icon: TrendingUp, href: '/financial', color: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Olá, {settings.studioName}!</h1>
              <p className="text-gray-500 text-sm mt-1">
                Aqui está o que está acontecendo no seu estúdio hoje, {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-[#1a1d26] px-4 py-2 rounded-full border border-white/5">
              <Calendar size={14} className="text-orange-500" />
              {format(new Date(), "yyyy")}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Link 
                key={idx} 
                href={action.href}
                className="group flex flex-col items-center justify-center p-6 bg-[#1a1d26] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all hover:scale-[1.02]"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg transition-transform group-hover:scale-110", action.color)}>
                  <action.icon size={24} />
                </div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors text-center">{action.label}</span>
              </Link>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-[#1a1d26] animate-pulse rounded-2xl border border-white/5" />
              ))
            ) : (
              stats.map((stat, idx) => (
                <StatCard key={idx} {...stat} />
              ))
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="h-[400px] bg-[#1a1d26] animate-pulse rounded-2xl border border-white/5" />
              ) : (
                <RevenueChart data={revenueData} />
              )}
            </div>

            {/* Payment Reminders */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Lembretes de Pagamento</h3>
                <Link 
                  href="/financial"
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </Link>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : reminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                    <CheckCircle2 size={48} className="opacity-10" />
                    <p className="text-sm">Tudo em dia por aqui!</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {reminders.map((payment, idx) => (
                      <motion.div
                        key={payment.name + idx}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={payment.status === 'atrasado' ? 'text-red-500' : 'text-orange-500'}>
                            {payment.status === 'atrasado' ? <AlertCircle size={20} /> : <Clock size={20} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{payment.name}</p>
                            <p className="text-xs text-gray-500">{payment.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right transition-opacity">
                            <p className="text-sm font-bold text-white">{payment.amount}</p>
                            <p className={cn(
                              "text-[10px] uppercase font-bold tracking-wider",
                              payment.status === 'atrasado' ? 'text-red-500' : 'text-orange-500'
                            )}>
                              {payment.status}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upcoming Expirations */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Vencimentos Próximos</h3>
                <Link 
                  href="/financial"
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : expirations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                    <Calendar size={48} className="opacity-10" />
                    <p className="text-sm">Nenhum vencimento próximo.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {expirations.map((item, idx) => (
                      <motion.div 
                        key={item.name + idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <User size={16} />
                          </div>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500 transition-opacity">{item.date}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Novos Alunos</h3>
                <Link 
                  href="/students"
                  className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </Link>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : signups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
                    <Users size={48} className="opacity-10" />
                    <p className="text-sm">Nenhum novo aluno recente.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {signups.map((item, idx) => (
                      <motion.div 
                        key={item.name + idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={16} />
                          </div>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500 transition-opacity">{item.date}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
