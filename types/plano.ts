// Tipos do domínio de Planos

export interface Plano {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  description: string;
  active: boolean;
  created_at: string;
}

export interface PlanoFormData {
  name: string;
  price: string;
  duration_months: string;
  description: string;
  active: boolean;
}
