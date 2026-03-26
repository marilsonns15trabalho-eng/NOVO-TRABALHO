'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import * as treinosService from '@/services/treinos.service';
import { getTreinosCache, saveTreinosCache } from '@/lib/cache/treinosCache';
import type { StudentListItem } from '@/types/common';
import type { Exercicio, Treino, TreinoFormData } from '@/types/treino';

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
  const { user, isAluno, isReady } = useAuth();
  const { notification, showNotification, clearNotification } = useNotification();

  const restrictLinkedAuthUserId = isAluno ? user?.id : undefined;

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

  const loadData = useCallback(async () => {
    if (!isReady || !user) return;

    const cached = getTreinosCache(user.id);
    if (cached) {
      setTreinos(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      if (isAluno && !restrictLinkedAuthUserId) {
        setTreinos([]);
        setAlunos([]);
        return;
      }

      const [treinosData, alunosData] = await Promise.all([
        treinosService.fetchTreinos(restrictLinkedAuthUserId),
        treinosService.fetchAlunosParaTreino(restrictLinkedAuthUserId),
      ]);

      setTreinos(treinosData);
      setAlunos(alunosData);
      saveTreinosCache(user.id, treinosData);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
    } finally {
      setLoading(false);
    }
  }, [isAluno, isReady, restrictLinkedAuthUserId, user]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setTreinos([]);
      setAlunos([]);
      setLoading(false);
      return;
    }

    void loadData();
  }, [isReady, loadData, user]);

  const filteredTreinos = treinos.filter((treino) => {
    const nomeAluno = treino.students?.name || '';
    return (
      treino.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nomeAluno.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const addExercicio = useCallback(() => {
    setNewTreino((current) => ({
      ...current,
      exercicios: [...(current.exercicios || []), { ...EMPTY_EXERCICIO }],
    }));
  }, []);

  const removeExercicio = useCallback((index: number) => {
    setNewTreino((current) => ({
      ...current,
      exercicios: (current.exercicios || []).filter((_, currentIndex) => currentIndex !== index),
    }));
  }, []);

  const updateExercicio = useCallback((index: number, field: keyof Exercicio, value: any) => {
    setNewTreino((current) => ({
      ...current,
      exercicios: (current.exercicios || []).map((exercicio, currentIndex) =>
        currentIndex === index ? { ...exercicio, [field]: value } : exercicio
      ),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (isAluno) {
        throw new Error('Ação não permitida para aluno');
      }

      if (!newTreino.student_id || !newTreino.nome) {
        showNotification('Preencha os campos obrigatorios.', 'error');
        return;
      }

      await treinosService.createTreino(newTreino);
      showNotification('Treino criado com sucesso!', 'success');
      setShowAddModal(false);
      setNewTreino({
        nome: '',
        student_id: '',
        objetivo: '',
        nivel: 'iniciante',
        duracao_minutos: 60,
        descricao: '',
        exercicios: [{ ...EMPTY_EXERCICIO }],
        ativo: true,
      });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar treino.';
      showNotification(message, 'error');
    }
  }, [isAluno, loadData, newTreino, showNotification]);

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
