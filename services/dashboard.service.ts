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

function assertNoQueryError(label: string, error: { message?: string } | null) {
  if (error) {
    throw new Error(`${label}: ${error.message || 'erro desconhecido'}`);
  }
}

export async function fetchDashboardData() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    alunosResult,
    pagamentosMesResult,
    planosResult,
    treinosResult,
    recentBillsResult,
    allFinanceiroResult,
    proximosVencimentosResult,
  ] = await Promise.all([
    supabase.from(TABLES.STUDENTS).select('id', { count: 'exact', head: true }),
    supabase
      .from(TABLES.FINANCEIRO)
      .select('valor')
      .eq('status', 'pago')
      .eq('tipo', 'receita')
      .gte('data_vencimento', firstDayOfMonth),
    supabase
      .from(TABLES.STUDENTS)
      .select('id', { count: 'exact', head: true })
      .not('plan_id', 'is', null),
    supabase
      .from(TABLES.TREINOS)
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true),
    supabase
      .from(TABLES.BILLS)
      .select('id, status, created_at, students(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from(TABLES.FINANCEIRO)
      .select('valor, data_vencimento, status')
      .eq('tipo', 'receita'),
    supabase
      .from(TABLES.BILLS)
      .select('id, amount, due_date, students(name, phone)')
      .eq('status', 'pending')
      .gte('due_date', now.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5),
  ]);

  assertNoQueryError('Dashboard.totalAlunos', alunosResult.error);
  assertNoQueryError('Dashboard.receitaMensal', pagamentosMesResult.error);
  assertNoQueryError('Dashboard.planosAtivos', planosResult.error);
  assertNoQueryError('Dashboard.treinosAtivos', treinosResult.error);
  assertNoQueryError('Dashboard.atividadesRecentes', recentBillsResult.error);
  assertNoQueryError('Dashboard.graficoFinanceiro', allFinanceiroResult.error);
  assertNoQueryError('Dashboard.proximosVencimentos', proximosVencimentosResult.error);

  const totalAlunos = alunosResult.count ?? 0;
  const receitaMensal =
    pagamentosMesResult.data?.reduce((acc: number, curr: any) => acc + curr.valor, 0) || 0;
  const planosAtivos = planosResult.count ?? 0;
  const treinosAtivos = treinosResult.count ?? 0;

  const activities: RecentActivity[] = (recentBillsResult.data || []).map((b: any) => {
    const studentsRaw = b.students;
    const student = Array.isArray(studentsRaw) ? studentsRaw[0] : studentsRaw;

    return {
      id: b.id,
      user: student?.name || 'Sistema',
      action: b.status === 'paid' ? 'Pagamento realizado' : 'Boleto gerado',
      time: new Date(b.created_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: b.status === 'paid' ? 'payment' : 'new_user',
    };
  });

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

  const allFinanceiro = allFinanceiroResult.data || [];

  const chartData: DashboardChartData[] = last6Months.map((m) => {
    const total =
      allFinanceiro
        .filter((f: any) => {
          const d = new Date(f.data_vencimento);
          return d.getMonth() === m.monthNum && d.getFullYear() === m.year && f.status === 'pago';
        })
        .reduce((acc: number, curr: any) => acc + curr.valor, 0) || 0;

    return { name: m.month, value: total };
  });

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const receitaLastMonth =
    allFinanceiro
      .filter((f: any) => {
        const d = new Date(f.data_vencimento);
        return (
          d.getMonth() === lastMonth.getMonth() &&
          d.getFullYear() === lastMonth.getFullYear() &&
          f.status === 'pago'
        );
      })
      .reduce((acc: number, curr: any) => acc + curr.valor, 0) || 0;

  const receitaChange =
    receitaLastMonth > 0
      ? `${(((receitaMensal - receitaLastMonth) / receitaLastMonth) * 100).toFixed(0)}%`
      : '+0%';

  const proximosVencimentos: ProximoVencimento[] = (proximosVencimentosResult.data || []).map((b: any) => {
    const studentsRaw = b.students;
    const student = Array.isArray(studentsRaw) ? studentsRaw[0] : studentsRaw;

    return {
      id: b.id,
      amount: b.amount,
      due_date: b.due_date,
      students: student ? { name: student.name, phone: student.phone ?? undefined } : null,
    };
  });

  return {
    stats: {
      totalAlunos,
      receitaMensal,
      planosAtivos,
      treinosAtivos,
      receitaChange: receitaChange.startsWith('-') ? receitaChange : `+${receitaChange}`,
    },
    chartData,
    activities,
    proximosVencimentos,
  };
}

export async function fetchLateBillsCount(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLES.BILLS)
    .select('id', { count: 'exact', head: true })
    .eq('status', 'late');

  if (error) {
    console.error('Erro ao buscar boletos atrasados:', error.message);
    return 0;
  }

  return count || 0;
}

export function subscribeToBillsChanges(callback: () => void) {
  const channel = supabase
    .channel('bills_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.BILLS }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchRelatoriosMetrics() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [alunosResult, financeiroResult, inadimplentesResult] = await Promise.all([
    supabase.from(TABLES.STUDENTS).select('status, created_at'),
    supabase.from(TABLES.FINANCEIRO).select('valor, data_vencimento, status, tipo'),
    supabase
      .from(TABLES.BILLS)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'late'),
  ]);

  assertNoQueryError('Relatorios.alunos', alunosResult.error);
  assertNoQueryError('Relatorios.financeiro', financeiroResult.error);
  assertNoQueryError('Relatorios.inadimplentes', inadimplentesResult.error);

  const alunos = alunosResult.data || [];
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter((a: any) => a.status === 'ativo').length;
  const alunosInativos = totalAlunos - alunosAtivos;
  const novosAlunos = alunos.filter((a: any) => {
    const d = new Date(a.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const financeiro = financeiroResult.data || [];
  const receitasMes = financeiro.filter((p: any) => {
    const d = new Date(p.data_vencimento);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      p.tipo === 'receita' &&
      p.status === 'pago'
    );
  });

  const despesasMes = financeiro.filter((p: any) => {
    const d = new Date(p.data_vencimento);
    return (
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear &&
      p.tipo === 'despesa' &&
      p.status === 'pago'
    );
  });

  const receitas = receitasMes.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);
  const despesas = despesasMes.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    inadimplentes: inadimplentesResult.count || 0,
    totalAlunos,
    alunosAtivos,
    alunosInativos,
    novosAlunos,
    anamnesesPendentes: 0,
    avaliacoesPendentes: 0,
  };
}

export async function exportFinanceiroCSV(): Promise<string | null> {
  const { data: financeiro, error } = await supabase
    .from(TABLES.FINANCEIRO)
    .select('*')
    .order('data_vencimento', { ascending: false });

  if (error) {
    throw new Error(`Exportacao financeiro: ${error.message}`);
  }

  if (!financeiro || financeiro.length === 0) return null;

  const headers = ['Descricao', 'Valor', 'Data', 'Tipo', 'Status'];
  const rows = financeiro.map((item: any) => [
    item.descricao,
    item.valor.toString(),
    item.data_vencimento,
    item.tipo,
    item.status,
  ]);

  return [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
}
