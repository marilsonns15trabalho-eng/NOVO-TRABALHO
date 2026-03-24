'use client';

// Hook customizado para o módulo de Treinos
import { useState, useEffect, useCallback } from 'react';
import * as treinosService from '@/services/treinos.service';
import { useNotification } from '@/hooks/useNotification';
import type { Treino, TreinoFormData, Exercicio } from '@/types/treino';
import type { StudentListItem } from '@/types/common';

const EMPTY_EXERCICIO: Exercicio = {
  nome: '',
  grupo_muscular: '',
  series: 3,
  repeticoes: '12',
  carga: '',
  descanso: '60s',
  observacoes: '',
};

export function useTreinos() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [alunos, setAlunos] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);

  const [newTreino, setNewTreino] = useState<TreinoFormData>({
    nome: '',
    student_id: '',
    objetivo: '',
    nivel: 'iniciante',
    duracao_minutos: 60,
    descricao: '',
    exercicios: [{ ...EMPTY_EXERCICIO }],
    ativo: true,
  });

  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [treinosData, alunosData] = await Promise.all([
        treinosService.fetchTreinos(),
        treinosService.fetchAlunosParaTreino(),
      ]);
      setTreinos(treinosData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Treinos filtrados por busca */
  const filteredTreinos = treinos.filter((t) => {
    const nomeAluno = t.students?.name || '';
    return (
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomeAluno.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  /** Adicionar exercício ao formulário */
  const addExercicio = useCallback(() => {
    setNewTreino((prev) => ({
      ...prev,
      exercicios: [...(prev.exercicios || []), { ...EMPTY_EXERCICIO }],
    }));
  }, []);

  /** Remover exercício do formulário */
  const removeExercicio = useCallback((index: number) => {
    setNewTreino((prev) => ({
      ...prev,
      exercicios: (prev.exercicios || []).filter((_, i) => i !== index),
    }));
  }, []);

  /** Atualizar exercício no formulário */
  const updateExercicio = useCallback((index: number, field: keyof Exercicio, value: any) => {
    setNewTreino((prev) => ({
      ...prev,
      exercicios: (prev.exercicios || []).map((ex, i) => i === index ? { ...ex, [field]: value } : ex),
    }));
  }, []);

  /** Salva treino novo */
  const handleSave = useCallback(async () => {
    if (!newTreino.student_id || !newTreino.nome) {
      showNotification('Preencha os campos obrigatórios.', 'error');
      return;
    }

    try {
      await treinosService.createTreino(newTreino);
      showNotification('Treino criado com sucesso!', 'success');
      setShowAddModal(false);
      setNewTreino({
        nome: '', student_id: '', objetivo: '', nivel: 'iniciante',
        duracao_minutos: 60, descricao: '',
        exercicios: [{ ...EMPTY_EXERCICIO }], ativo: true,
      });
      await loadData();
    } catch (error: any) {
      showNotification(`Erro ao salvar: ${error.message}`, 'error');
    }
  }, [newTreino, loadData, showNotification]);

  /** Abre modal de visualização */
  const viewTreino = useCallback((treino: Treino) => {
    setSelectedTreino(treino);
    setShowViewModal(true);
  }, []);

  return {
    treinos: filteredTreinos,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    showViewModal,
    setShowViewModal,
    selectedTreino,
    newTreino,
    setNewTreino,
    addExercicio,
    removeExercicio,
    updateExercicio,
    handleSave,
    viewTreino,
    notification,
    showNotification,
    clearNotification,
  };
}
