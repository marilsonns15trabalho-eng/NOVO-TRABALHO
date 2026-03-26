// Camada de serviço para o módulo Financeiro
import { supabase } from '@/lib/supabase';
import { TABLES, DEFAULTS } from '@/lib/constants';
import { mapStudentToListItem } from '@/lib/mappers';
import type { Pagamento, Boleto, FinanceiroStudent, PagamentoFormData, BoletoFormData } from '@/types/financeiro';
import { assertAdmin } from '@/lib/authz';

/** Busca todos os dados financeiros (pagamentos, boletos, alunos) */
export async function fetchFinanceiroData() {
  const [pagamentosRes, boletosRes, alunosRes] = await Promise.all([
    supabase.from(TABLES.FINANCEIRO).select('*').order('data_vencimento', { ascending: false }),
    supabase.from(TABLES.BILLS).select('*, students(name)').order('due_date', { ascending: false }),
    supabase.from(TABLES.STUDENTS).select('id, name, due_day, plans(price)'),
  ]);

  // Pagamentos
  const pagamentos: Pagamento[] = pagamentosRes.data || [];

  // Boletos com fallback
  let boletos: Boleto[] = [];
  if (boletosRes.data) {
    boletos = (boletosRes.data as any[]).map((b) => ({
      ...b,
      students: b.students ? { name: b.students.name } : null,
    }));
  } else if (boletosRes.error) {
    console.warn('Erro ao buscar boletos com join, tentando sem join:', boletosRes.error.message);
    const { data: dataNoJoin } = await supabase.from(TABLES.BILLS).select('*').order('due_date', { ascending: false });
    if (dataNoJoin) boletos = dataNoJoin.map((b: any) => ({ ...b, students: null }));
  }

  // Alunos com fallback
  let alunos: FinanceiroStudent[] = [];
  if (alunosRes.data) {
    alunos = (alunosRes.data as any[]).map((a: any) => ({
      id: a.id,
      name: a.name || a.nome,
      due_day: a.due_day,
      plans: a.plans,
    }));
  } else if (alunosRes.error) {
    console.warn('Erro ao buscar alunos por "name", tentando "nome":', alunosRes.error.message);
    const { data: dataNome } = await supabase.from(TABLES.STUDENTS).select('id, nome, due_day, plans(price)');
    if (dataNome) {
      alunos = dataNome.map((a: any) => ({
        id: a.id,
        name: a.nome,
        due_day: a.due_day,
        plans: a.plans,
      }));
    }
  }

  return { pagamentos, boletos, alunos };
}

/** Cria uma nova transação financeira */
export async function createTransacao(data: PagamentoFormData): Promise<void> {
  await assertAdmin();
  const { error } = await supabase
    .from(TABLES.FINANCEIRO)
    .insert([{ ...data, valor: Number(data.valor) }]);

  if (error) throw error;
}

/** Gera um boleto para um aluno */
export async function gerarBoleto(data: BoletoFormData): Promise<void> {
  await assertAdmin();
  const { error } = await supabase
    .from(TABLES.BILLS)
    .insert([{
      ...data,
      status: 'pending',
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
    }]);

  if (error) throw error;
}

/** Gera 3 boletos futuros para um aluno */
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
      b.due_date.startsWith(`${dataVencimento.getFullYear()}-${(dataVencimento.getMonth() + 1).toString().padStart(2, '0')}`)
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

/** Gera boletos em lote para todos os alunos sem cobrança no mês */
export async function gerarBoletosEmLote(alunos: FinanceiroStudent[]): Promise<number> {
  await assertAdmin();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data: existingBills } = await supabase
    .from(TABLES.BILLS)
    .select('student_id')
    .gte('due_date', firstDayOfMonth)
    .lte('due_date', lastDayOfMonth);

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

  const { error } = await supabase.from(TABLES.BILLS).insert(newBills);
  if (error) throw error;

  return newBills.length;
}

/** Dá baixa manual em um boleto (marca como pago e registra receita) */
export async function darBaixaManual(boleto: Boleto): Promise<void> {
  await assertAdmin();
  const { error: billError } = await supabase
    .from(TABLES.BILLS)
    .update({ status: 'paid' })
    .eq('id', boleto.id);

  if (billError) throw billError;

  const { error: finError } = await supabase
    .from(TABLES.FINANCEIRO)
    .insert([{
      valor: boleto.amount,
      data_vencimento: new Date().toISOString().split('T')[0],
      status: 'pago',
      tipo: 'receita',
      descricao: `Mensalidade - ${boleto.students?.name} (Boleto: ${boleto.code})`,
    }]);

  if (finError) throw finError;
}

/** Exclui um boleto */
export async function excluirBoleto(boletoId: string): Promise<void> {
  await assertAdmin();
  const { error } = await supabase
    .from(TABLES.BILLS)
    .delete()
    .eq('id', boletoId);

  if (error) throw error;
}
