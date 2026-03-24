// Camada de serviço para Dashboard e Relatórios
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';

export interface DashboardStats {
  totalAlunos: number;
  receitaMensal: number;
  planosAtivos: number;
  treinosAtivos: number;
  receitaChange: string;
}

export interface DashboardChartData {
  name: string;
  value: number;
}

export interface ProximoVencimento {
  id: string;
  amount: number;
  due_date: string;
  students: { name: string; phone?: string } | null;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'payment' | 'new_user';
}

/** Busca todos os dados do dashboard */
export async function fetchDashboardData() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Total de Alunos
  const { count: totalAlunos } = await supabase
    .from(TABLES.STUDENTS)
    .select('*', { count: 'exact', head: true });

  // 2. Receita Mensal
  const { data: pagamentosMes } = await supabase
    .from(TABLES.FINANCEIRO)
    .select('valor')
    .eq('status', 'pago')
    .eq('tipo', 'receita')
    .gte('data_vencimento', firstDayOfMonth);

  const receitaMensal = pagamentosMes?.reduce((acc, curr) => acc + curr.valor, 0) || 0;

  // 3. Planos Ativos
  const { count: planosAtivos } = await supabase
    .from(TABLES.STUDENTS)
    .select('*', { count: 'exact', head: true })
    .not('plan_id', 'is', null);

  // 4. Treinos Ativos
  const { count: treinosAtivos } = await supabase
    .from(TABLES.TREINOS)
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true);

  // 5. Atividades Recentes
  const { data: recentBills } = await supabase
    .from(TABLES.BILLS)
    .select('*, students(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  const activities: RecentActivity[] = (recentBills || []).map((b: any) => ({
    id: b.id,
    user: b.students?.name || 'Sistema',
    action: b.status === 'paid' ? 'Pagamento realizado' : 'Boleto gerado',
    time: new Date(b.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    type: b.status === 'paid' ? 'payment' : 'new_user',
  }));

  // 6. Dados do gráfico (últimos 6 meses)
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      month: months[d.getMonth()],
      monthNum: d.getMonth(),
      year: d.getFullYear(),
    });
  }

  const { data: allFinanceiro } = await supabase
    .from(TABLES.FINANCEIRO)
    .select('valor, data_vencimento, status, tipo')
    .eq('tipo', 'receita');

  const chartData: DashboardChartData[] = last6Months.map((m) => {
    const total = allFinanceiro?.filter((f: any) => {
      const d = new Date(f.data_vencimento);
      return d.getMonth() === m.monthNum && d.getFullYear() === m.year && f.status === 'pago';
    }).reduce((acc: number, curr: any) => acc + curr.valor, 0) || 0;
    return { name: m.month, value: total };
  });

  // 7. Calcular variação de receita
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const receitaLastMonth = allFinanceiro?.filter((f: any) => {
    const d = new Date(f.data_vencimento);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear() && f.status === 'pago';
  }).reduce((acc: number, curr: any) => acc + curr.valor, 0) || 0;

  const receitaChange = receitaLastMonth > 0
    ? `${(((receitaMensal - receitaLastMonth) / receitaLastMonth) * 100).toFixed(0)}%`
    : '+0%';

  // 8. Próximos vencimentos
  const { data: proximosVencimentos } = await supabase
    .from(TABLES.BILLS)
    .select('*, students(name, phone)')
    .eq('status', 'pending')
    .gte('due_date', now.toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(5);

  return {
    stats: {
      totalAlunos: totalAlunos || 0,
      receitaMensal,
      planosAtivos: planosAtivos || 0,
      treinosAtivos: treinosAtivos || 0,
      receitaChange: receitaChange.startsWith('-') ? receitaChange : `+${receitaChange}`,
    },
    chartData,
    activities,
    proximosVencimentos: (proximosVencimentos || []) as ProximoVencimento[],
  };
}

/** Busca contagem de boletos atrasados (para o badge do Header) */
export async function fetchLateBillsCount(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLES.BILLS)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'late');

  if (error) return 0;
  return count || 0;
}

/** Subscrição realtime para boletos (Header) */
export function subscribeToBillsChanges(callback: () => void) {
  const channel = supabase
    .channel('bills_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.BILLS }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Busca métricas para o módulo de Relatórios */
export async function fetchRelatoriosMetrics() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Alunos
  const { data: alunos } = await supabase.from(TABLES.STUDENTS).select('*');
  const totalAlunos = alunos?.length || 0;
  const alunosAtivos = alunos?.filter((a: any) => a.status === 'ativo').length || 0;
  const alunosInativos = totalAlunos - alunosAtivos;

  const novosAlunos = alunos?.filter((a: any) => {
    const d = new Date(a.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length || 0;

  // Financeiro
  const { data: financeiro } = await supabase.from(TABLES.FINANCEIRO).select('*');

  const receitasMes = financeiro?.filter((p: any) => {
    const d = new Date(p.data_vencimento);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.tipo === 'receita' && p.status === 'pago';
  }) || [];

  const despesasMes = financeiro?.filter((p: any) => {
    const d = new Date(p.data_vencimento);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.tipo === 'despesa' && p.status === 'pago';
  }) || [];

  const receitas = receitasMes.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);
  const despesas = despesasMes.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);

  // Inadimplentes
  const { count: inadimplentes } = await supabase
    .from(TABLES.BILLS)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'late');

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    inadimplentes: inadimplentes || 0,
    totalAlunos,
    alunosAtivos,
    alunosInativos,
    novosAlunos,
    anamnesesPendentes: 0,
    avaliacoesPendentes: 0,
  };
}

/** Exporta dados financeiros para CSV */
export async function exportFinanceiroCSV(): Promise<string | null> {
  const { data: financeiro } = await supabase
    .from(TABLES.FINANCEIRO)
    .select('*')
    .order('data_vencimento', { ascending: false });

  if (!financeiro || financeiro.length === 0) return null;

  const headers = ['Descrição', 'Valor', 'Data', 'Tipo', 'Status'];
  const rows = financeiro.map((item: any) => [
    item.descricao,
    item.valor.toString(),
    item.data_vencimento,
    item.tipo,
    item.status,
  ]);

  return [
    headers.join(','),
    ...rows.map((r: string[]) => r.join(',')),
  ].join('\n');
}
