import { supabase } from '@/lib/supabase';
import { TABLES, DEFAULTS } from '@/lib/constants';
import { extractDateOnly, getLocalDateInputValue } from '@/lib/date';
import {
  attachStudentAvatar,
  collectLinkedAuthUserIds,
  fetchStudentAvatarMap,
} from '@/services/student-avatars.service';
import type {
  Pagamento,
  Boleto,
  FinanceiroStudent,
  PagamentoFormData,
  BoletoFormData,
} from '@/types/financeiro';
import { assertAdmin } from '@/lib/authz';

type RoleProtectedStudent = {
  id: string;
  linked_auth_user_id?: string | null;
};

async function fetchBillingProtectedStudentIds(
  students: RoleProtectedStudent[],
): Promise<Set<string>> {
  const linkedAuthUserIds = Array.from(
    new Set(
      students
        .map((student) => student.linked_auth_user_id?.trim() || '')
        .filter(Boolean),
    ),
  );

  if (linkedAuthUserIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from(TABLES.USER_PROFILES)
    .select('id, role')
    .in('id', linkedAuthUserIds);

  if (error) {
    throw new Error(`Financeiro.rolesProtegidas: ${error.message}`);
  }

  const protectedAuthUserIds = new Set(
    (data || [])
      .filter((profile: any) => profile?.role === 'admin' || profile?.role === 'professor')
      .map((profile: any) => profile.id),
  );

  return new Set(
    students
      .filter((student) => {
        const authUserId = student.linked_auth_user_id?.trim() || '';
        return authUserId && protectedAuthUserIds.has(authUserId);
      })
      .map((student) => student.id),
  );
}

async function assertStudentCanReceiveBills(studentId: string): Promise<void> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, linked_auth_user_id, name')
    .eq('id', studentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Financeiro.studentLookup: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error('Aluno nao encontrado para gerar boleto.');
  }

  const protectedStudentIds = await fetchBillingProtectedStudentIds([
    {
      id: data.id,
      linked_auth_user_id: data.linked_auth_user_id,
    },
  ]);

  if (protectedStudentIds.has(data.id)) {
    throw new Error('Usuarios com role admin ou professor nao podem receber boletos.');
  }
}

export async function fetchFinanceiroData() {
  const [pagamentosRes, boletosRes, alunosRes, planosRes] = await Promise.all([
    supabase
      .from(TABLES.FINANCEIRO)
      .select('id, valor, data_vencimento, status, tipo, descricao')
      .order('data_vencimento', { ascending: false }),
    supabase
      .from(TABLES.BILLS)
      .select('id, student_id, amount, due_date, status, code, students(name, phone, linked_auth_user_id)')
      .order('due_date', { ascending: false }),
    supabase.from(TABLES.STUDENTS).select('id, name, due_day, plan_id, linked_auth_user_id'),
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
  const planPriceById = new Map<string, number>();
  (planosRes.data || []).forEach((plan: any) => {
    if (plan?.id) {
      planPriceById.set(plan.id, Number(plan.price) || 0);
    }
  });

  const billingProtectedStudentIds = await fetchBillingProtectedStudentIds(
    ((alunosRes.data as any[]) || []).map((a: any) => ({
      id: a.id,
      linked_auth_user_id: a.linked_auth_user_id ?? null,
    })),
  );
  const studentRows = ((alunosRes.data as any[]) || []).filter(
    (student: any) => !billingProtectedStudentIds.has(student.id),
  );
  const billRows = ((boletosRes.data as any[]) || []).filter(
    (bill: any) => !billingProtectedStudentIds.has(bill.student_id),
  );
  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds([
      ...studentRows,
      ...billRows.map((bill: any) => {
        const studentsRaw = bill.students;
        return Array.isArray(studentsRaw) ? studentsRaw[0] : studentsRaw;
      }),
    ]),
  );

  const boletos: Boleto[] = billRows
    .map((b) => ({
      ...b,
      students: b.students
        ? (() => {
            const rawStudent = Array.isArray(b.students) ? b.students[0] : b.students;
            const student = attachStudentAvatar(rawStudent, avatarMap);
            return {
              name: student.name,
              phone: student.phone ?? null,
              linked_auth_user_id: student.linked_auth_user_id ?? null,
              avatar_url: student.avatar_url ?? null,
              avatar_path: student.avatar_path ?? null,
              avatar_updated_at: student.avatar_updated_at ?? null,
            };
          })()
        : null,
    }));

  const alunos: FinanceiroStudent[] = studentRows
    .map((a: any) => ({
      ...attachStudentAvatar(a, avatarMap),
      id: a.id,
      name: a.name,
      due_day: a.due_day,
      plan_id: a.plan_id || undefined,
      linked_auth_user_id: a.linked_auth_user_id ?? null,
      plans: a.plan_id ? { price: planPriceById.get(a.plan_id) || 0 } : undefined,
    }));

  return { pagamentos, boletos, alunos };
}

export async function createTransacao(data: PagamentoFormData): Promise<void> {
  await assertAdmin();

  const { error } = await supabase
    .from(TABLES.FINANCEIRO)
    .insert([{
      ...data,
      valor: Number(data.valor),
      data_vencimento: extractDateOnly(data.data_vencimento) || data.data_vencimento,
    }]);

  if (error) throw error;
}

export async function gerarBoleto(data: BoletoFormData): Promise<void> {
  await assertAdmin();
  await assertStudentCanReceiveBills(data.student_id);

  const { error } = await supabase
    .from(TABLES.BILLS)
    .insert([
      {
        ...data,
        due_date: extractDateOnly(data.due_date) || data.due_date,
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
  await assertStudentCanReceiveBills(studentId);

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
        due_date: getLocalDateInputValue(dataVencimento),
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

  const billingProtectedStudentIds = await fetchBillingProtectedStudentIds(
    alunos.map((student) => ({
      id: student.id,
      linked_auth_user_id: student.linked_auth_user_id ?? null,
    })),
  );

  const billableStudents = alunos.filter((student) => !billingProtectedStudentIds.has(student.id));

  const now = new Date();
  const firstDayOfMonth = getLocalDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDayOfMonth = getLocalDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const { data: existingBills, error } = await supabase
    .from(TABLES.BILLS)
    .select('student_id')
    .gte('due_date', firstDayOfMonth)
    .lte('due_date', lastDayOfMonth);

  if (error) {
    throw new Error(`Financeiro.boletosExistentes: ${error.message}`);
  }

  const studentsWithBills = new Set(existingBills?.map((b) => b.student_id) || []);
  const studentsToBill = billableStudents.filter((a) => !studentsWithBills.has(a.id));

  if (studentsToBill.length === 0) return 0;

  const newBills = studentsToBill.map((student) => {
    const dueDay = student.due_day || DEFAULTS.DUE_DAY;
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

    return {
      student_id: student.id,
      amount: student.plans?.price || 0,
      due_date: getLocalDateInputValue(dueDate),
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
      data_vencimento: getLocalDateInputValue(),
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
