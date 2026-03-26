// Tipos do domínio de Avaliação Física

export type ProtocoloAvaliacao = 'faulkner' | 'pollock7' | 'pollock3';

export interface Avaliacao {
  id: string;
  student_id: string;
  data: string;
  peso: number;
  altura: number;

  // Perímetros
  ombro?: number;
  torax?: number;
  braco_direito?: number;
  braco_esquerdo?: number;
  antebraco_direito?: number;
  antebraco_esquerdo?: number;
  cintura?: number;
  abdome?: number;
  quadril?: number;
  coxa_direita?: number;
  coxa_esquerda?: number;
  panturrilha_direita?: number;
  panturrilha_esquerda?: number;

  // Dobras Cutâneas (Faulkner)
  tricipital?: number;
  subescapular?: number;
  supra_iliaca?: number;
  abdominal?: number;

  observacoes?: string;

  // Resultados (calculados)
  imc?: number;
  percentual_gordura?: number;
  massa_gorda?: number;
  massa_magra?: number;
  soma_dobras?: number;
  protocolo?: ProtocoloAvaliacao;

  created_at: string;
  students?: {
    id?: string;
    linked_auth_user_id?: string | null;
    nome: string;
    name?: string;
    sexo?: string;
    data_nascimento?: string;
  };
}

export type AvaliacaoFormData = Partial<Avaliacao>;

/** Aluno para o seletor no formulário de avaliação */
export interface AvaliacaoAlunoItem {
  id: string;
  nome: string;
  sexo?: string;
  data_nascimento?: string;
}
