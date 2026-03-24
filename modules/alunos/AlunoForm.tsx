'use client';

// Formulário de Aluno extraído — usado pelo Modal de criar/editar aluno
import React from 'react';
import FormField, { inputClassName, selectClassName, textareaClassName } from '@/components/ui/FormField';
import type { AlunoFormData } from '@/types/aluno';
import type { PlanoListItem } from '@/types/common';
import type { UserRole } from '@/contexts/AuthContext';

interface AlunoFormProps {
  data: Partial<AlunoFormData>;
  onChange: (data: Partial<AlunoFormData>) => void;
  planos: PlanoListItem[];
  selectedPlanoId: string;
  onPlanoChange: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  /** Role do usuário logado — controla quais campos ficam habilitados */
  userRole?: UserRole;
}

/** Campos administrativos que alunos NÃO podem editar */
const ADMIN_ONLY_FIELDS = [
  'plano_id', 'plan', 'plan_name', 'plan_id',
  'dia_vencimento', 'due_day',
  'status',
  'amount_paid',
  'data_matricula',
  'grupo',
  'modalidade',
];

export default function AlunoForm({
  data,
  onChange,
  planos,
  selectedPlanoId,
  onPlanoChange,
  onSubmit,
  onCancel,
  isEditing,
  userRole = 'admin',
}: AlunoFormProps) {
  const isAluno = userRole === 'aluno';

  const update = (field: string, value: any) => {
    // Alunos não podem modificar campos administrativos
    if (isAluno && ADMIN_ONLY_FIELDS.includes(field)) return;
    onChange({ ...data, [field]: value });
  };

  // Classes adicionais para campos desabilitados
  const disabledClass = 'opacity-50 cursor-not-allowed';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Plano — oculto para alunos */}
      {!isAluno && (
        <FormField label="Plano">
          <select
            value={selectedPlanoId}
            onChange={(e) => onPlanoChange(e.target.value)}
            className={selectClassName}
          >
            <option value="">Selecione um plano...</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>
            ))}
          </select>
        </FormField>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dados Pessoais — editáveis por todos */}
        <FormField label="Nome Completo" required>
          <input required type="text" value={data.nome || ''} onChange={(e) => update('nome', e.target.value)} className={inputClassName} placeholder="Ex: João Silva" />
        </FormField>
        <FormField label="CPF">
          <input type="text" value={data.cpf || ''} onChange={(e) => update('cpf', e.target.value)} className={inputClassName} placeholder="000.000.000-00" />
        </FormField>
        <FormField label="RG">
          <input type="text" value={data.rg || ''} onChange={(e) => update('rg', e.target.value)} className={inputClassName} placeholder="00.000.000-0" />
        </FormField>
        <FormField label="Data de Nascimento">
          <input type="date" value={data.data_nascimento || ''} onChange={(e) => update('data_nascimento', e.target.value)} className={inputClassName} />
        </FormField>
        <FormField label="Gênero">
          <select value={data.genero || ''} onChange={(e) => update('genero', e.target.value)} className={selectClassName}>
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
        </FormField>
        <FormField label="Estado Civil">
          <select value={data.estado_civil || ''} onChange={(e) => update('estado_civil', e.target.value)} className={selectClassName}>
            <option value="">Selecione...</option>
            <option value="Solteiro(a)">Solteiro(a)</option>
            <option value="Casado(a)">Casado(a)</option>
            <option value="Divorciado(a)">Divorciado(a)</option>
            <option value="Viúvo(a)">Viúvo(a)</option>
          </select>
        </FormField>

        {/* Contato — editáveis por todos */}
        <FormField label="E-mail">
          <input type="email" value={data.email || ''} onChange={(e) => update('email', e.target.value)} className={inputClassName} placeholder="joao@exemplo.com" />
        </FormField>
        <FormField label="Telefone Fixo">
          <input type="text" value={data.telefone || ''} onChange={(e) => update('telefone', e.target.value)} className={inputClassName} placeholder="(11) 3333-3333" />
        </FormField>
        <FormField label="Celular">
          <input type="text" value={data.celular || ''} onChange={(e) => update('celular', e.target.value)} className={inputClassName} placeholder="(11) 99999-9999" />
        </FormField>
        <FormField label="CEP">
          <input type="text" value={data.cep || ''} onChange={(e) => update('cep', e.target.value)} className={inputClassName} placeholder="00000-000" />
        </FormField>

        {/* Endereço — editáveis por todos */}
        <FormField label="Endereço" fullWidth>
          <input type="text" value={data.endereco || ''} onChange={(e) => update('endereco', e.target.value)} className={inputClassName} placeholder="Rua Exemplo" />
        </FormField>
        <FormField label="Número">
          <input type="text" value={data.numero || ''} onChange={(e) => update('numero', e.target.value)} className={inputClassName} placeholder="123" />
        </FormField>
        <FormField label="Complemento">
          <input type="text" value={data.complemento || ''} onChange={(e) => update('complemento', e.target.value)} className={inputClassName} placeholder="Apto 45" />
        </FormField>
        <FormField label="Bairro">
          <input type="text" value={data.bairro || ''} onChange={(e) => update('bairro', e.target.value)} className={inputClassName} placeholder="Centro" />
        </FormField>
        <FormField label="Cidade">
          <input type="text" value={data.cidade || ''} onChange={(e) => update('cidade', e.target.value)} className={inputClassName} placeholder="São Paulo" />
        </FormField>
        <FormField label="Estado (UF)">
          <input type="text" value={data.estado || ''} onChange={(e) => update('estado', e.target.value)} className={inputClassName} placeholder="SP" />
        </FormField>
        <FormField label="Profissão">
          <input type="text" value={data.profissao || ''} onChange={(e) => update('profissao', e.target.value)} className={inputClassName} placeholder="Engenheiro" />
        </FormField>

        {/* Contato de Emergência — editáveis por todos */}
        <FormField label="Contato de Emergência (Nome)">
          <input type="text" value={data.contato_emergencia_nome || ''} onChange={(e) => update('contato_emergencia_nome', e.target.value)} className={inputClassName} placeholder="Nome do Contato" />
        </FormField>
        <FormField label="Telefone de Emergência">
          <input type="text" value={data.contato_emergencia_telefone || ''} onChange={(e) => update('contato_emergencia_telefone', e.target.value)} className={inputClassName} placeholder="(11) 99999-9999" />
        </FormField>
        <FormField label="Parentesco">
          <input type="text" value={data.contato_emergencia_parentesco || ''} onChange={(e) => update('contato_emergencia_parentesco', e.target.value)} className={inputClassName} placeholder="Ex: Mãe, Cônjuge" />
        </FormField>

        {/* Campos Administrativos — desabilitados para alunos */}
        <FormField label="Data de Matrícula">
          <input type="date" value={data.data_matricula || ''} onChange={(e) => update('data_matricula', e.target.value)} disabled={isAluno} className={`${inputClassName} ${isAluno ? disabledClass : ''}`} />
        </FormField>
        <FormField label="Dia de Vencimento">
          <input type="number" min="1" max="31" value={data.dia_vencimento || ''} onChange={(e) => update('dia_vencimento', e.target.value ? parseInt(e.target.value) : undefined)} disabled={isAluno} className={`${inputClassName} ${isAluno ? disabledClass : ''}`} placeholder="Ex: 5" />
        </FormField>
        <FormField label="Grupo">
          <input type="text" value={data.grupo || ''} onChange={(e) => update('grupo', e.target.value)} disabled={isAluno} className={`${inputClassName} ${isAluno ? disabledClass : ''}`} placeholder="Ex: Turma da Manhã" />
        </FormField>
        <FormField label="Modalidade">
          <input type="text" value={data.modalidade || ''} onChange={(e) => update('modalidade', e.target.value)} disabled={isAluno} className={`${inputClassName} ${isAluno ? disabledClass : ''}`} placeholder="Ex: Musculação" />
        </FormField>
        <FormField label="Peso Desejado (kg)">
          <input type="number" step="0.1" value={data.peso_desejado || ''} onChange={(e) => update('peso_desejado', e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClassName} placeholder="75.5" />
        </FormField>
        <FormField label="Status">
          <select value={data.status || 'ativo'} onChange={(e) => update('status', e.target.value)} disabled={isAluno} className={`${selectClassName} ${isAluno ? disabledClass : ''}`}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </FormField>
      </div>

      {/* Objetivos */}
      <FormField label="Objetivos (separados por vírgula)">
        <input
          type="text"
          value={data.objetivos?.join(', ') || ''}
          onChange={(e) => update('objetivos', e.target.value.split(',').map((s: string) => s.trim()))}
          className={inputClassName}
          placeholder="Emagrecimento, Hipertrofia..."
        />
      </FormField>

      {/* Observações */}
      <FormField label="Observações">
        <textarea
          value={data.observacoes || ''}
          onChange={(e) => update('observacoes', e.target.value)}
          className={`${textareaClassName} min-h-[100px]`}
          placeholder="Observações gerais sobre o aluno..."
        />
      </FormField>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20"
        >
          Salvar Aluno
        </button>
      </div>
    </form>
  );
}
