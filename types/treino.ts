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
  active_version?: TrainingPlanVersion | null;
}

export interface TrainingPlanVersion {
  id: string;
  training_plan_id: string;
  version_number: number;
  objective?: string | null;
  level?: string | null;
  duration_weeks?: number | null;
  coach_notes?: string | null;
  is_active: boolean;
  created_at: string;
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

export type TreinoExecutionStatus = 'in_progress' | 'completed' | 'cancelled';

export interface TreinoExecutionItem {
  id?: string;
  session_id?: string;
  exercise_index: number;
  exercise_name: string;
  planned_sets?: number | null;
  planned_reps?: string | null;
  planned_load?: string | null;
  planned_rest?: string | null;
  performed_sets?: number | null;
  performed_reps?: string | null;
  performed_load?: string | null;
  completed: boolean;
  notes?: string | null;
}

export interface TreinoExecutionSession {
  id: string;
  treino_id: string;
  student_id: string;
  execution_date: string;
  status: TreinoExecutionStatus;
  started_at: string;
  completed_at?: string | null;
  last_activity_at?: string | null;
  started_by_auth_user_id?: string | null;
  completed_by_auth_user_id?: string | null;
  completion_source: 'student' | 'staff';
  notes?: string | null;
  items: TreinoExecutionItem[];
}

export interface Treino {
  id: string;
  student_id?: string | null;
  training_plan_id?: string | null;
  training_plan_version_id?: string | null;
  created_by_auth_user_id?: string | null;
  nome: string;
  objetivo?: string;
  nivel?: string;
  duracao_minutos?: number;
  descricao?: string;
  exercicios?: Exercicio[];
  ativo?: boolean;
  sort_order?: number;
  split_label?: string | null;
  day_of_week?: number | null;
  coach_notes?: string | null;
  created_at: string;
  updated_at?: string;
  students?: { id?: string; linked_auth_user_id?: string | null; name: string };
  training_plan?: TrainingPlan | null;
  training_plan_version?: TrainingPlanVersion | null;
  assigned_students?: TreinoAssignedStudent[];
  completion_logs?: TreinoCompletionLog[];
  completed_today?: boolean;
  completions_this_month?: number;
  current_execution?: TreinoExecutionSession | null;
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
  current_streak: number;
  this_week_trained_days: number;
  completed_workouts: Array<{
    treino_id: string;
    treino_nome: string;
    completed_on: string;
  }>;
}

export interface TreinoFormData extends Partial<Treino> {
  assigned_student_ids?: string[];
}
