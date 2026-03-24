// Tipos do domínio de Treinos

export interface Exercicio {
  nome: string;
  grupo_muscular?: string;
  series: number;
  repeticoes: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
}

export interface Treino {
  id: string;
  student_id: string;
  nome: string;
  objetivo?: string;
  nivel?: string;
  duracao_minutos?: number;
  descricao?: string;
  exercicios?: Exercicio[];
  ativo?: boolean;
  created_at: string;
  user_id?: string;
  students?: { name: string };
}

export type TreinoFormData = Partial<Treino>;
