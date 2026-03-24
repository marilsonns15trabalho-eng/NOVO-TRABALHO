// Tipos compartilhados entre módulos

export interface Notification {
  message: string;
  type: 'success' | 'error';
}

/** Representação mínima de aluno usada em selects/dropdowns */
export interface StudentListItem {
  id: string;
  name: string;
}

/** Representação mínima de aluno com nome em pt-BR (usada em Anamnese) */
export interface AlunoListItem {
  id: string;
  nome: string;
}

/** Representação mínima de plano usada em selects/dropdowns */
export interface PlanoListItem {
  id: string;
  name: string;
  price: number;
}
