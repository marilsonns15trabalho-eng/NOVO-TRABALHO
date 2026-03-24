'use client';

// Formulário de Treino extraído
import React from 'react';
import { Plus } from 'lucide-react';
import FormField, { inputClassName, selectClassName, textareaClassName } from '@/components/ui/FormField';
import type { TreinoFormData, Exercicio } from '@/types/treino';
import type { StudentListItem } from '@/types/common';

interface TreinoFormProps {
  data: TreinoFormData;
  onChange: (data: TreinoFormData) => void;
  alunos: StudentListItem[];
  exercicios: Exercicio[];
  onAddExercicio: () => void;
  onRemoveExercicio: (index: number) => void;
  onUpdateExercicio: (index: number, field: keyof Exercicio, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function TreinoForm({
  data, onChange, alunos, exercicios,
  onAddExercicio, onRemoveExercicio, onUpdateExercicio,
  onSubmit, onCancel,
}: TreinoFormProps) {
  const update = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Aluno" required>
          <select required value={data.student_id || ''} onChange={(e) => update('student_id', e.target.value)} className={selectClassName}>
            <option value="" disabled>Selecione um aluno</option>
            {alunos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </FormField>
        <FormField label="Nome do Treino" required>
          <input required type="text" value={data.nome || ''} onChange={(e) => update('nome', e.target.value)} className={inputClassName} placeholder="Ex: Treino A - Hipertrofia" />
        </FormField>
        <FormField label="Objetivo">
          <input type="text" value={data.objetivo || ''} onChange={(e) => update('objetivo', e.target.value)} className={inputClassName} placeholder="Ex: Hipertrofia" />
        </FormField>
        <FormField label="Nível">
          <select value={data.nivel || 'Iniciante'} onChange={(e) => update('nivel', e.target.value)} className={selectClassName}>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
        </FormField>
        <FormField label="Duração (minutos)">
          <input type="number" min="1" value={data.duracao_minutos || 60} onChange={(e) => update('duracao_minutos', parseInt(e.target.value))} className={inputClassName} />
        </FormField>
        <div className="space-y-1.5 flex items-center gap-2 mt-6">
          <input type="checkbox" id="ativo" checked={data.ativo !== false} onChange={(e) => update('ativo', e.target.checked)} className="w-5 h-5 rounded bg-black border-zinc-800 text-blue-500 focus:ring-blue-500/50" />
          <label htmlFor="ativo" className="text-sm font-bold text-zinc-400 cursor-pointer">Treino Ativo</label>
        </div>
      </div>

      <FormField label="Descrição / Observações Gerais">
        <textarea rows={3} value={data.descricao || ''} onChange={(e) => update('descricao', e.target.value)} className={`${textareaClassName} resize-none`} placeholder="Foco na cadência, descanso de 60s..." />
      </FormField>

      {/* Exercícios */}
      <div className="border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-blue-500">Exercícios</h4>
          <button type="button" onClick={onAddExercicio} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl text-sm font-bold transition-all">
            <Plus size={16} />
            Adicionar Exercício
          </button>
        </div>
        <div className="space-y-4">
          {exercicios.map((exercicio, index) => (
            <div key={index} className="p-4 bg-black border border-zinc-800 rounded-2xl relative group">
              <button type="button" onClick={() => onRemoveExercicio(index)} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors">Remover</button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-12">
                <FormField label="Nome do Exercício" required fullWidth>
                  <input required type="text" value={exercicio.nome} onChange={(e) => onUpdateExercicio(index, 'nome', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: Supino Reto" />
                </FormField>
                <FormField label="Grupo Muscular">
                  <input type="text" value={exercicio.grupo_muscular || ''} onChange={(e) => onUpdateExercicio(index, 'grupo_muscular', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: Peito" />
                </FormField>
                <FormField label="Séries" required>
                  <input required type="number" min="1" value={exercicio.series} onChange={(e) => onUpdateExercicio(index, 'series', parseInt(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" />
                </FormField>
                <FormField label="Repetições" required>
                  <input required type="text" value={exercicio.repeticoes} onChange={(e) => onUpdateExercicio(index, 'repeticoes', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: 10-12" />
                </FormField>
                <FormField label="Carga">
                  <input type="text" value={exercicio.carga || ''} onChange={(e) => onUpdateExercicio(index, 'carga', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: 20kg" />
                </FormField>
                <FormField label="Descanso">
                  <input type="text" value={exercicio.descanso || ''} onChange={(e) => onUpdateExercicio(index, 'descanso', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: 60s" />
                </FormField>
                <FormField label="Observações" fullWidth>
                  <input type="text" value={exercicio.observacoes || ''} onChange={(e) => onUpdateExercicio(index, 'observacoes', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: Focar na excêntrica" />
                </FormField>
              </div>
            </div>
          ))}
          {exercicios.length === 0 && (
            <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              Nenhum exercício adicionado. Clique no botão acima para adicionar.
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
        <button type="submit" className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20">Salvar Treino</button>
      </div>
    </form>
  );
}
