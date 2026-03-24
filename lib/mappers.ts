// Funções de mapeamento entre banco de dados (Supabase) e UI
// Centraliza a conversão de nomes de campo en↔pt-BR

import type { Aluno, StudentDBRow } from '@/types/aluno';
import type { PlanoListItem } from '@/types/common';

/**
 * Converte uma row da tabela `students` (Supabase) para o formato `Aluno` (UI).
 */
export function mapStudentRowToAluno(row: Record<string, any>): Aluno {
  return {
    id: row.id,
    nome: row.name || '',
    cpf: row.cpf || '',
    rg: row.rg || '',
    data_nascimento: row.birth_date || '',
    genero: row.gender || '',
    estado_civil: row.marital_status || '',
    profissao: row.profession || '',
    telefone: row.phone || '',
    celular: row.cellphone || '',
    email: row.email || '',
    cep: row.zip_code || '',
    endereco: row.address || '',
    numero: row.number || '',
    complemento: row.complement || '',
    bairro: row.bairro || '',
    cidade: row.city || '',
    estado: row.state || '',
    contato_emergencia_nome: row.emergency_contact || '',
    contato_emergencia_telefone: row.emergency_phone || '',
    contato_emergencia_parentesco: row.emergency_relationship || '',
    plano_id: row.plan_id || '',
    data_matricula: row.join_date || '',
    dia_vencimento: row.due_day || 0,
    status: row.status || 'ativo',
    observacoes: row.notes || '',
    objetivos: row.objectives || [],
    peso_desejado: row.desired_weight || 0,
    grupo: row.group || '',
    modalidade: row.modality || '',
    created_at: row.created_at,
    user_id: row.user_id,
  };
}

/**
 * Converte um `Aluno` do formulário UI para o formato da tabela `students` (Supabase).
 */
export function mapAlunoToStudentRow(
  aluno: Partial<Aluno>,
  planos: PlanoListItem[],
  selectedPlanoId: string
): Record<string, any> {
  const plano = planos.find((p) => p.id === selectedPlanoId);

  return {
    name: aluno.nome,
    email: aluno.email || null,
    phone: aluno.telefone || null,
    plan: plano ? plano.name : (aluno.modalidade || null),
    plan_name: plano ? plano.name : null,
    status: aluno.status || 'ativo',
    join_date: aluno.data_matricula || null,
    address: aluno.endereco || null,
    profession: aluno.profissao || null,
    modality: aluno.modalidade || null,
    desired_weight: aluno.peso_desejado || null,
    start_date: aluno.data_matricula || null,
    emergency_contact: aluno.contato_emergencia_nome || null,
    objectives: aluno.objetivos || null,
    notes: aluno.observacoes || null,
    plan_id: selectedPlanoId || null,
    birth_date: aluno.data_nascimento || null,
    gender: aluno.genero || null,
    bairro: aluno.bairro || null,
    cpf: aluno.cpf || null,
    rg: aluno.rg || null,
    marital_status: aluno.estado_civil || null,
    cellphone: aluno.celular || null,
    zip_code: aluno.cep || null,
    number: aluno.numero || null,
    complement: aluno.complemento || null,
    city: aluno.cidade || null,
    state: aluno.estado || null,
    emergency_phone: aluno.contato_emergencia_telefone || null,
    emergency_relationship: aluno.contato_emergencia_parentesco || null,
    due_day: aluno.dia_vencimento || null,
    group: aluno.grupo || null,
    user_id: null,
  };
}

/**
 * Mapeia os dados de lista de alunos (usado em selects de vários módulos).
 * Lida com a ambiguidade de campos `name` vs `nome`.
 */
export function mapStudentToListItem(row: Record<string, any>): { id: string; name: string } {
  return {
    id: row.id,
    name: row.name || row.nome || '',
  };
}

/**
 * Mapeia aluno para formato com campo `nome` (usado em Anamnese/Avaliação).
 */
export function mapStudentToAlunoListItem(row: Record<string, any>): { id: string; nome: string } {
  return {
    id: row.id,
    nome: row.name || row.nome || '',
  };
}
