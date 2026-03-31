import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { extractDateOnly, formatDatePtBr, getLocalDateInputValue } from '@/lib/date';
import {
  fetchPersistedNotifications,
  markPersistedNotificationsAsRead,
  subscribeToPersistedNotifications,
  type PersistedNotificationItem,
  type PersistedNotificationType,
} from '@/services/app-notifications.service';

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

export type HeaderNotificationType =
  | 'billing_late'
  | 'billing_due'
  | PersistedNotificationType;

export interface HeaderNotificationItem {
  id: string;
  type: HeaderNotificationType;
  title: string;
  description: string;
  occurred_at: string;
  route: string;
  priority: number;
}

function assertNoQueryError(label: string, error: { message?: string } | null) {
  if (error) {
    throw new Error(`${label}: ${error.message || 'erro desconhecido'}`);
  }
}

function matchesMonthAndYear(value: string | null | undefined, month: number, year: number) {
  const dateOnly = extractDateOnly(value);
  if (!dateOnly) {
    return false;
  }

  const [itemYear, itemMonth] = dateOnly.split('-').map(Number);
  return itemYear === year && itemMonth === month + 1;
}

export async function fetchDashboardData() {
  const now = new Date();
  const firstDayOfMonth = getLocalDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));

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
      .from(TABLES.PLANS)
      .select('id', { count: 'exact', head: true })
      .eq('active', true),
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
      .gte('due_date', getLocalDateInputValue())
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
          return matchesMonthAndYear(f.data_vencimento, m.monthNum, m.year) && f.status === 'pago';
        })
        .reduce((acc: number, curr: any) => acc + curr.valor, 0) || 0;

    return { name: m.month, value: total };
  });

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const receitaLastMonth =
    allFinanceiro
      .filter((f: any) => {
        return (
          matchesMonthAndYear(f.data_vencimento, lastMonth.getMonth(), lastMonth.getFullYear()) &&
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

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function normalizeJoinedRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] || null : value;
}

function sortNotifications(items: HeaderNotificationItem[]) {
  return items.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
  });
}

async function fetchReadNotificationIds(userId: string, notificationIds: string[]) {
  if (!userId || notificationIds.length === 0) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from(TABLES.USER_NOTIFICATION_READS)
    .select('notification_id')
    .eq('user_id', userId)
    .in('notification_id', notificationIds);

  assertNoQueryError('HeaderNotifications.reads', error);

  return new Set((data || []).map((row: any) => row.notification_id).filter(Boolean));
}

function mapPersistedNotification(item: PersistedNotificationItem): HeaderNotificationItem {
  const priorityMap: Record<PersistedNotificationType, number> = {
    training_update: 2,
    workout_completion: 3,
    new_anamnese: 2,
    new_avaliacao: 2,
    avaliacao_evolution: 3,
  };

  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    occurred_at: item.occurred_at,
    route: item.route,
    priority: priorityMap[item.type] ?? 1,
  };
}

async function fetchBillingNotifications(): Promise<HeaderNotificationItem[]> {
  const today = getLocalDateInputValue();
  const dueWindowEnd = getLocalDateInputValue(addDays(new Date(), 3));

  const { data, error } = await supabase
    .from(TABLES.BILLS)
    .select('id, amount, due_date, status, students(name)')
    .in('status', ['pending', 'late'])
    .order('due_date', { ascending: true })
    .limit(10);

  assertNoQueryError('HeaderNotifications.billing', error);

  return (data || [])
    .filter((row: any) => row.status === 'late' || (row.status === 'pending' && row.due_date <= dueWindowEnd))
    .map((row: any) => {
      const student = normalizeJoinedRow<{ name?: string | null }>(row.students);
      const studentName = student?.name || 'Aluno';
      const amount = Number(row.amount || 0).toFixed(2);
      const isLate = row.status === 'late' || row.due_date < today;

      return {
        id: `bill-${row.id}-${isLate ? 'late' : 'due'}`,
        type: isLate ? 'billing_late' : 'billing_due',
        title: isLate ? 'Boleto em atraso' : 'Boleto vencendo',
        description: `${studentName} • R$ ${amount} • ${isLate ? `vencido em ${formatDatePtBr(row.due_date)}` : `vence em ${formatDatePtBr(row.due_date)}`}`,
        occurred_at: row.due_date,
        route: '/dashboard/financeiro',
        priority: isLate ? 4 : 3,
      } satisfies HeaderNotificationItem;
    });
}

export async function fetchHeaderNotifications(
  userId: string,
  role: 'admin' | 'professor' | 'aluno',
): Promise<HeaderNotificationItem[]> {
  const tasks: Array<Promise<HeaderNotificationItem[]>> = [
    fetchPersistedNotifications(userId).then((items) => items.map(mapPersistedNotification)),
  ];

  if (role === 'admin') {
    tasks.unshift(fetchBillingNotifications());
  }

  const groups = await Promise.all(tasks);
  const sorted = sortNotifications(groups.flat());
  const readIds = await fetchReadNotificationIds(
    userId,
    sorted.map((item) => item.id),
  );

  return sorted.filter((item) => !readIds.has(item.id)).slice(0, 12);
}

export async function markHeaderNotificationsAsRead(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  const uniqueIds = Array.from(new Set(notificationIds.filter(Boolean)));
  if (!userId || uniqueIds.length === 0) {
    return;
  }

  const billingIds = uniqueIds.filter((notificationId) => notificationId.startsWith('bill-'));
  const persistedIds = uniqueIds.filter((notificationId) => !notificationId.startsWith('bill-'));

  if (persistedIds.length > 0) {
    await markPersistedNotificationsAsRead(userId, persistedIds);
  }

  if (billingIds.length === 0) {
    return;
  }

  const payload = billingIds.map((notificationId) => ({
    user_id: userId,
    notification_id: notificationId,
    read_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from(TABLES.USER_NOTIFICATION_READS)
    .upsert(payload, { onConflict: 'user_id,notification_id' });

  assertNoQueryError('HeaderNotifications.markAsRead', error);
}

export function subscribeToHeaderNotifications(
  userId: string,
  role: 'admin' | 'professor' | 'aluno',
  callback: () => void,
) {
  const unsubscribePersisted = subscribeToPersistedNotifications(userId, callback);
  const channel = supabase.channel(`header_notifications_${role}_${userId}`);

  if (role === 'admin') {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: TABLES.BILLS }, callback);
  }

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: TABLES.USER_NOTIFICATION_READS,
      filter: `user_id=eq.${userId}`,
    },
    callback,
  );

  channel.subscribe();

  return () => {
    unsubscribePersisted();
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
    return (
      matchesMonthAndYear(p.data_vencimento, currentMonth, currentYear) &&
      p.tipo === 'receita' &&
      p.status === 'pago'
    );
  });

  const despesasMes = financeiro.filter((p: any) => {
    return (
      matchesMonthAndYear(p.data_vencimento, currentMonth, currentYear) &&
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
