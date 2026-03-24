'use client';

// Hook customizado para o módulo de Anamnese
import { useState, useEffect, useCallback } from 'react';
import * as anamnesesService from '@/services/anamneses.service';
import { useNotification } from '@/hooks/useNotification';
import type { Anamnese, AnamneseFormData } from '@/types/anamnese';
import type { AlunoListItem } from '@/types/common';

export function useAnamneses() {
  const [anamneses, setAnamneses] = useState<Anamnese[]>([]);
  const [alunos, setAlunos] = useState<AlunoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(null);

  const [newAnamnese, setNewAnamnese] = useState<AnamneseFormData>({
    data: new Date().toISOString().split('T')[0],
  });

  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [anamnesesData, alunosData] = await Promise.all([
        anamnesesService.fetchAnamneses(),
        anamnesesService.fetchAlunosParaAnamnese(),
      ]);
      setAnamneses(anamnesesData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar anamneses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Anamneses filtradas por busca */
  const filteredAnamneses = anamneses.filter((a) => {
    const nome = a.students?.nome || '';
    return nome.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  /** Visualiza uma anamnese */
  const viewAnamnese = useCallback((anamnese: Anamnese) => {
    setSelectedAnamnese(anamnese);
    setShowViewModal(true);
  }, []);

  /** Salva nova anamnese */
  const handleSave = useCallback(async () => {
    try {
      await anamnesesService.createAnamnese(newAnamnese);
      showNotification('Anamnese salva com sucesso!', 'success');
      setShowAddModal(false);
      setNewAnamnese({ data: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (error: any) {
      showNotification(`Erro ao salvar anamnese: ${error.message}`, 'error');
    }
  }, [newAnamnese, loadData, showNotification]);

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
