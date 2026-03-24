// Tipos do domínio de Alunos

/** Representação do aluno na UI (campos em pt-BR) */
export interface Aluno {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  genero?: string;
  estado_civil?: string;
  profissao?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_telefone?: string;
  contato_emergencia_parentesco?: string;
  plano_id?: string;
  data_matricula?: string;
  dia_vencimento?: number;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  objetivos?: string[];
  peso_desejado?: number;
  grupo?: string;
  modalidade?: string;
  created_at: string;
  user_id: string;
}

/** Dados para o formulário de criação/edição de aluno */
export type AlunoFormData = Partial<Aluno>;

/** Formato da row no banco Supabase (tabela students) */
export interface StudentDBRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cellphone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  profession?: string | null;
  zip_code?: string | null;
  address?: string | null;
  number?: string | null;
  complement?: string | null;
  bairro?: string | null;
  city?: string | null;
  state?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  emergency_relationship?: string | null;
  plan?: string | null;
  plan_name?: string | null;
  plan_id?: string | null;
  join_date?: string | null;
  start_date?: string | null;
  due_day?: number | null;
  status?: string | null;
  notes?: string | null;
  objectives?: string[] | null;
  desired_weight?: number | null;
  group?: string | null;
  modality?: string | null;
  created_at: string;
  user_id?: string | null;
}
