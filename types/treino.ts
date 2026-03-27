// Tipos do dominio de Treinos

export interface Exercicio {
  nome: string;
  grupo_muscular?: string;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
}

export interface TrainingPlan {
  id: string;
  name: string;
  weekly_frequency: number;
  description?: string | null;
  active: boolean;
  created_at: string;
  students_count?: number;
  treinos_count?: number;
}

export interface TreinoAssignedStudent {
  id: string;
  name: string;
  linked_auth_user_id?: string | null;
  assignment_source: 'direct' | 'plan' | 'legacy';
  completed_today?: boolean;
}

export interface TreinoCompletionLog {
  id: string;
  treino_id: string;
  student_id: string;
  completed_on: string;
  completed_at: string;
  completed_by_auth_user_id?: string | null;
  completion_source: 'student' | 'staff';
  notes?: string | null;
}

export interface Treino {
  id: string;
  student_id?: string | null;
  training_plan_id?: string | null;
  created_by_auth_user_id?: string | null;
  nome: string;
  objetivo?: string;
  nivel?: string;
  duracao_minutos?: number;
  descricao?: string;
  exercicios?: Exercicio[];
  ativo?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at?: string;
  students?: { id?: string; linked_auth_user_id?: string | null; name: string };
  training_plan?: TrainingPlan | null;
  assigned_students?: TreinoAssignedStudent[];
  completion_logs?: TreinoCompletionLog[];
  completed_today?: boolean;
  completions_this_month?: number;
}

export interface TrainingPlanStudentAssignment {
  id: string;
  student_id: string;
  training_plan_id: string;
  start_date?: string | null;
  end_date?: string | null;
  active: boolean;
  notes?: string | null;
  created_at: string;
  training_plan?: TrainingPlan | null;
  student?: { id: string; name: string; linked_auth_user_id?: string | null } | null;
}

export interface StudentMonthlyTrainingProgress {
  student_id: string;
  month_key: string;
  expected_days: number;
  trained_days: number;
  missed_days: number;
  completed_workouts_count: number;
  completion_rate: number;
  completed_workouts: Array<{
    treino_id: string;
    treino_nome: string;
    completed_on: string;
  }>;
}

export interface TreinoFormData extends Partial<Treino> {
  assigned_student_ids?: string[];
}
