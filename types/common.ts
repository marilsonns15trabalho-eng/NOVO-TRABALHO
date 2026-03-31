// Tipos compartilhados entre módulos

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

/** Representação mínima de aluno usada em selects/dropdowns */
export interface StudentListItem {
  id: string;
  name: string;
  linked_auth_user_id?: string | null;
  plan_id?: string | null;
  plan_name?: string | null;
  email?: string | null;
  status?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

/** Representação mínima de aluno com nome em pt-BR (usada em Anamnese) */
export interface AlunoListItem {
  id: string;
  nome: string;
  linked_auth_user_id?: string | null;
  email?: string | null;
  plan_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  status?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

/** Representação mínima de plano usada em selects/dropdowns */
export interface PlanoListItem {
  id: string;
  name: string;
  price: number;
}
