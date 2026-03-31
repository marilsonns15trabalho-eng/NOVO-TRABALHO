// Tipos do domínio de Anamnese Nutricional

export interface Anamnese {
  id: string;
  student_id: string;
  data: string;
  peso?: number;
  altura?: number;
  objetivo_nutricional?: string;
  restricoes_alimentares?: string;
  alergias?: string;
  medicamentos?: string;
  historico_familiar?: string;
  habitos_alimentares?: string;
  consumo_agua?: string;
  atividade_fisica?: string;
  observacoes?: string;
  circunferencia_abdominal?: string;
  circunferencia_quadril?: string;
  medidas_corpo?: string;
  doencas_cronicas?: string;
  problemas_saude?: string;
  cirurgias?: string;
  condicoes_hormonais?: string;
  acompanhamento_psicologico?: string;
  disturbios_alimentares?: string;
  gravida_amamentando?: string;
  acompanhamento_previo?: string;
  frequencia_refeicoes?: string;
  horarios_refeicoes?: string;
  consumo_fastfood?: string;
  consumo_doces?: string;
  consumo_bebidas_acucaradas?: string;
  consumo_alcool?: string;
  gosta_cozinhar?: string;
  preferencia_alimentos?: string;
  consumo_cafe?: string;
  uso_suplementos?: string;
  frequencia_atividade_fisica?: string;
  objetivos_treino?: string;
  rotina_sono?: string;
  nivel_estresse?: string;
  tempo_sentado?: string;
  dificuldade_dietas?: string;
  lanches_fora?: string;
  come_emocional?: string;
  beliscar?: string;
  compulsao_alimentar?: string;
  fome_fora_horario?: string;
  estrategias_controle_peso?: string;
  alimentos_preferidos?: string;
  alimentos_evitados?: string;
  meta_peso_medidas?: string;
  disposicao_mudancas?: string;
  preferencia_dietas?: string;
  expectativas?: string;
  created_at: string;
  students?: {
    id: string;
    linked_auth_user_id?: string | null;
    nome: string;
    email?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    plan_name?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
    avatar_updated_at?: string | null;
  };
}

export type AnamneseFormData = Partial<Anamnese>;

export interface AnamneseStudentContext {
  student_id: string;
  student_name: string;
  linked_auth_user_id?: string | null;
  email?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  plan_name?: string | null;
  latest_avaliacao_date?: string | null;
  latest_peso?: number | null;
  latest_altura?: number | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}
