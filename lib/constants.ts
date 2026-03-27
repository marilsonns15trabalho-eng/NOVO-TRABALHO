// Constantes centralizadas do sistema LIONESS PRIME

/** Valores padrão para formulários */
export const DEFAULTS = {
  DUE_DAY: 10,
  PLAN_DURATION_MONTHS: 1,
  TREINO_DURATION_MINUTES: 60,
  NOTIFICATION_TIMEOUT_MS: 3000,
} as const;

/** Status de aluno */
export const ALUNO_STATUS = {
  ATIVO: 'ativo',
  INATIVO: 'inativo',
} as const;

/** Status de boleto */
export const BOLETO_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  LATE: 'late',
} as const;

/** Status de pagamento */
export const PAGAMENTO_STATUS = {
  PENDENTE: 'pendente',
  PAGO: 'pago',
  VENCIDO: 'vencido',
  ATRASADO: 'atrasado',
} as const;

/** Tipos de transação financeira */
export const TRANSACTION_TYPE = {
  RECEITA: 'receita',
  DESPESA: 'despesa',
} as const;

/** Nomes de tabelas no Supabase */
export const TABLES = {
  STUDENTS: 'students',
  PLANS: 'plans',
  TRAINING_PLANS: 'training_plans',
  TRAINING_PLAN_VERSIONS: 'training_plan_versions',
  STUDENT_TRAINING_PLANS: 'student_training_plans',
  TREINOS: 'treinos',
  TREINO_STUDENT_ASSIGNMENTS: 'treino_student_assignments',
  TREINO_COMPLETION_LOGS: 'treino_completion_logs',
  TREINO_EXECUTION_SESSIONS: 'treino_execution_sessions',
  TREINO_EXECUTION_ITEMS: 'treino_execution_items',
  AVALIACOES: 'avaliacoes',
  ANAMNESES: 'anamneses',
  FINANCEIRO: 'financeiro',
  BILLS: 'bills',
  ASSINATURAS: 'assinaturas',
  CONFIGURACOES: 'configuracoes',
  USER_PROFILES: 'user_profiles',
} as const;

/** Super admin — protegido contra alterações */
export const SUPER_ADMIN_EMAIL = 'marilsonns15@gmail.com';
