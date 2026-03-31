// Tipos do domínio Financeiro

export interface Pagamento {
  id: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'vencido' | 'atrasado';
  tipo: 'receita' | 'despesa';
  descricao: string;
  forma_pagamento?: string;
}

export type PagamentoFormData = Partial<Pagamento>;

export interface Boleto {
  id: string;
  student_id: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'late';
  code: string;
  students: {
    name: string;
    phone?: string | null;
    linked_auth_user_id?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
    avatar_updated_at?: string | null;
  } | null;
}

export interface BoletoFormData {
  student_id: string;
  amount: number;
  due_date: string;
}

/** Representação de aluno na visão financeira (com plano e dia de vencimento) */
export interface FinanceiroStudent {
  id: string;
  name: string;
  due_day?: number;
  plan_id?: string;
  linked_auth_user_id?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
  plans?: {
    price: number;
  };
}

/** Aluno com boletos agrupados (para a aba "Por Aluno") */
export interface AlunoBoletos extends FinanceiroStudent {
  boletos: Boleto[];
  displayBoleto?: Boleto;
}
