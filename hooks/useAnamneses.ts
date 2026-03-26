'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import * as anamnesesService from '@/services/anamneses.service';
import type { AlunoListItem } from '@/types/common';
import type { Anamnese, AnamneseFormData } from '@/types/anamnese';

export function useAnamneses() {
  const { user, isAluno, isReady } = useAuth();
  const { notification, showNotification, clearNotification } = useNotification();

  const restrictLinkedAuthUserId = isAluno ? user?.id : undefined;

  const [anamneses, setAnamneses] = useState<Anamnese[]>([]);
  const [alunos, setAlunos] = useState<AlunoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(null);
  const [newAnamnese, setNewAnamnese] = useState<AnamneseFormData>({
    data: new Date().toISOString().split('T')[0],
  });

  const loadData = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    try {
      if (isAluno && !restrictLinkedAuthUserId) {
        setAnamneses([]);
        setAlunos([]);
        return;
      }

      const [anamnesesData, alunosData] = await Promise.all([
        anamnesesService.fetchAnamneses(restrictLinkedAuthUserId),
        anamnesesService.fetchAlunosParaAnamnese(restrictLinkedAuthUserId),
      ]);

      setAnamneses(anamnesesData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar anamneses:', error);
    } finally {
      setLoading(false);
    }
  }, [isAluno, isReady, restrictLinkedAuthUserId]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setAnamneses([]);
      setAlunos([]);
      setLoading(false);
      return;
    }

    void loadData();
  }, [isReady, loadData, user]);

  const filteredAnamneses = anamneses.filter((anamnese) => {
    const nome = anamnese.students?.nome || '';
    return nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const viewAnamnese = useCallback((anamnese: Anamnese) => {
    setSelectedAnamnese(anamnese);
    setShowViewModal(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (isAluno) {
        throw new Error('Ação não permitida para aluno');
      }

      await anamnesesService.createAnamnese(newAnamnese);
      showNotification('Anamnese salva com sucesso!', 'success');
      setShowAddModal(false);
      setNewAnamnese({ data: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar anamnese.';
      showNotification(message, 'error');
    }
  }, [isAluno, loadData, newAnamnese, showNotification]);

  return {
    anamneses: filteredAnamneses,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    showViewModal,
    setShowViewModal,
    selectedAnamnese,
    viewAnamnese,
    newAnamnese,
    setNewAnamnese,
    handleSave,
    notification,
    showNotification,
    clearNotification,
  };
}
