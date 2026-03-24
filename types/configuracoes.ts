// Tipos do domínio de Configurações

export interface Configuracoes {
  id: string;
  nome_academia: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  mensagem_boas_vindas: string;
  termos_contrato: string;
  user_id?: string;
}

export type ConfiguracoesFormData = Partial<Configuracoes>;
