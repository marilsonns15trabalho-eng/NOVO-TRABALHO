import { supabase } from '@/lib/supabase';
import { TABLES, DEFAULTS } from '@/lib/constants';
import type {
  Pagamento,
  Boleto,
  FinanceiroStudent,
  PagamentoFormData,
  BoletoFormData,
} from '@/types/financeiro';
import { assertAdmin } from '@/lib/authz';

export async function fetchFinanceiroData() {
  const [pagamentosRes, boletosRes, alunosRes, planosRes] = await Promise.all([
    supabase
      .from(TABLES.FINANCEIRO)
      .select('id, valor, data_vencimento, status, tipo, descricao')
      .order('data_vencimento', { ascending: false }),
    supabase
      .from(TABLES.BILLS)
      .select('id, student_id, amount, due_date, status, code, students(name)')
      .order('due_date', { ascending: false }),
    supabase.from(TABLES.STUDENTS).select('id, name, due_day, plan_id'),
    supabase.from(TABLES.PLANS).select('id, price'),
  ]);

  if (pagamentosRes.error) {
    throw new Error(`Financeiro.pagamentos: ${pagamentosRes.error.message}`);
  }

  if (boletosRes.error) {
    throw new Error(`Financeiro.boletos: ${boletosRes.error.message}`);
  }

  if (alunosRes.error) {
    throw new Error(`Financeiro.alunos: ${alunosRes.error.message}`);
  }

  if (planosRes.error) {
    throw new Error(`Financeiro.planos: ${planosRes.error.message}`);
  }

  const pagamentos: Pagamento[] = pagamentosRes.data || [];
  const boletos: Boleto[] = (boletosRes.data as any[]).map((b) => ({
    ...b,
    students: b.students ? { name: b.students.name } : null,
  }));

  const planPriceById = new Map<string, number>();
  (planosRes.data || []).forEach((plan: any) => {
    if (plan?.id) {
      planPriceById.set(plan.id, Number(plan.price) || 0);
    }
  });

  const alunos: FinanceiroStudent[] = (alunosRes.data as any[]).map((a: any) => ({
    id: a.id,
    name: a.name,
    due_day: a.due_day,
    plan_id: a.plan_id || undefined,
    plans: a.plan_id ? { price: planPriceById.get(a.plan_id) || 0 } : undefined,
  }));

  return { pagamentos, boletos, alunos };
}

export async function createTransacao(data: PagamentoFormData): Promise<void> {
  await assertAdmin();

  const { error } = await supabase
    .from(TABLES.FINANCEIRO)
    .insert([{ ...data, valor: Number(data.valor) }]);

  if (error) throw error;
}

export async function gerarBoleto(data: BoletoFormData): Promise<void> {
  await assertAdmin();

  const { error } = await supabase
    .from(TABLES.BILLS)
    .insert([
      {
        ...data,
        status: 'pending',
        code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    ]);

  if (error) throw error;
}

export async function gerar3Boletos(
  studentId: string,
  alunos: FinanceiroStudent[],
  boletos: Boleto[]
): Promise<number> {
  await assertAdmin();

  const student = alunos.find((a) => a.id === studentId);
  if (!student) return 0;

  const studentBoletos = boletos.filter((b) => b.student_id === studentId);
  const newBoletos: any[] = [];
  const now = new Date();

  let mesesGerados = 0;
  let mesAtual = now.getMonth();
  let anoAtual = now.getFullYear();

  while (mesesGerados < 3) {
    const dataVencimento = new Date(anoAtual, mesAtual, student.due_day || DEFAULTS.DUE_DAY);
    const existeBoleto = studentBoletos.some((b) =>
      b.due_date.startsWith(
        `${dataVencimento.getFullYear()}-${(dataVencimento.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`
      )
    );

    if (!existeBoleto) {
      newBoletos.push({
        student_id: studentId,
        amount: student.plans?.price || 0,
        due_date: dataVencimento.toISOString().split('T')[0],
        status: 'pending',
        code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      });
      mesesGerados++;
    }

    mesAtual++;
    if (mesAtual > 11) {
      mesAtual = 0;
      anoAtual++;
    }
  }

  const { error } = await supabase.from(TABLES.BILLS).insert(newBoletos);
  if (error) throw error;

  return newBoletos.length;
}

export async function gerarBoletosEmLote(alunos: FinanceiroStudent[]): Promise<number> {
  await assertAdmin();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data: existingBills, error } = await supabase
    .from(TABLES.BILLS)
    .select('student_id')
    .gte('due_date', firstDayOfMonth)
    .lte('due_date', lastDayOfMonth);

  if (error) {
    throw new Error(`Financeiro.boletosExistentes: ${error.message}`);
  }

  const studentsWithBills = new Set(existingBills?.map((b) => b.student_id) || []);
  const studentsToBill = alunos.filter((a) => !studentsWithBills.has(a.id));

  if (studentsToBill.length === 0) return 0;

  const newBills = studentsToBill.map((student) => {
    const dueDay = student.due_day || DEFAULTS.DUE_DAY;
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

    return {
      student_id: student.id,
      amount: student.plans?.price || 0,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    };
  });

  const { error: insertError } = await supabase.from(TABLES.BILLS).insert(newBills);
  if (insertError) throw insertError;

  return newBills.length;
}

export async function darBaixaManual(boleto: Boleto): Promise<void> {
  await assertAdmin();

  const { error: billError } = await supabase
    .from(TABLES.BILLS)
    .update({ status: 'paid' })
    .eq('id', boleto.id);

  if (billError) throw billError;

  const { error: finError } = await supabase.from(TABLES.FINANCEIRO).insert([
    {
      valor: boleto.amount,
      data_vencimento: new Date().toISOString().split('T')[0],
      status: 'pago',
      tipo: 'receita',
      descricao: `Mensalidade - ${boleto.students?.name} (Boleto: ${boleto.code})`,
    },
  ]);

  if (finError) throw finError;
}

export async function excluirBoleto(boletoId: string): Promise<void> {
  await assertAdmin();

  const { error } = await supabase.from(TABLES.BILLS).delete().eq('id', boletoId);

  if (error) throw error;
}
