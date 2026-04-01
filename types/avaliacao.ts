export type ProtocoloAvaliacao = 'faulkner' | 'navy' | 'pollock7' | 'pollock3';
export type AvaliacaoPhotoPosition = 'front' | 'back' | 'left' | 'right';

export interface AvaliacaoPhoto {
  id: string;
  avaliacao_id: string;
  student_id: string;
  position: AvaliacaoPhotoPosition;
  storage_path: string;
  file_name?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  signed_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AvaliacaoPhotoDraft {
  existing?: AvaliacaoPhoto | null;
  file?: File | null;
  preview_url?: string | null;
  remove?: boolean;
}

export type AvaliacaoPhotoDraftMap = Record<AvaliacaoPhotoPosition, AvaliacaoPhotoDraft>;

export interface Avaliacao {
  id: string;
  student_id: string;
  data: string;
  peso: number;
  altura: number;

  // Perimetros
  pescoco?: number;
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

  // Dobras cutaneas
  tricipital?: number;
  subescapular?: number;
  supra_iliaca?: number;
  abdominal?: number;

  observacoes?: string;

  // Resultados calculados
  imc?: number;
  percentual_gordura?: number;
  massa_gorda?: number;
  massa_magra?: number;
  soma_dobras?: number;
  rcq?: number;
  protocolo?: ProtocoloAvaliacao;
  photos?: AvaliacaoPhoto[];

  created_at: string;
  students?: {
    id?: string;
    linked_auth_user_id?: string | null;
    nome: string;
    name?: string;
    sexo?: string;
    data_nascimento?: string;
    gender?: string | null;
    birth_date?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
    avatar_updated_at?: string | null;
  };
}

export type AvaliacaoFormData = Partial<Avaliacao> & {
  student_gender?: string | null;
  student_birth_date?: string | null;
};

export interface AvaliacaoAlunoItem {
  id: string;
  nome: string;
  linked_auth_user_id?: string | null;
  sexo?: string;
  data_nascimento?: string;
  gender?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}
