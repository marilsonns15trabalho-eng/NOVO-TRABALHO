'use client';

// Hook customizado para o módulo de Avaliação Física
import { useState, useEffect, useCallback } from 'react';
import * as avaliacoesService from '@/services/avaliacoes.service';
import { useNotification } from '@/hooks/useNotification';
import type { Avaliacao, AvaliacaoFormData, AvaliacaoAlunoItem } from '@/types/avaliacao';

export function useAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunos, setAlunos] = useState<AvaliacaoAlunoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais e formulário
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [historico, setHistorico] = useState<Avaliacao[]>([]);

  const [newAvaliacao, setNewAvaliacao] = useState<AvaliacaoFormData>({
    data: new Date().toISOString().split('T')[0],
    peso: 0,
    altura: 0,
    protocolo: 'faulkner',
  });

  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avaliacoesData, alunosData] = await Promise.all([
        avaliacoesService.fetchAvaliacoes(),
        avaliacoesService.fetchAlunosParaAvaliacao(),
      ]);
      setAvaliacoes(avaliacoesData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Avaliações filtradas por busca */
  const filteredAvaliacoes = avaliacoes.filter((a) => {
    const nome = a.students?.nome || '';
    return nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  /** Inicia edição */
  const startEdit = useCallback((avaliacao: Avaliacao) => {
    setEditingAvaliacao(avaliacao);
    setNewAvaliacao({ ...avaliacao });
    setShowAddModal(true);
  }, []);

  /** Visualiza avaliação e carrega histórico */
  const viewAvaliacao = useCallback(async (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setShowViewModal(true);

    try {
      const hist = await avaliacoesService.fetchHistoricoAluno(avaliacao.student_id);
      setHistorico(hist);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  }, []);

  /** Salva avaliação */
  const handleSave = useCallback(async () => {
    try {
      await avaliacoesService.salvarAvaliacao(newAvaliacao, editingAvaliacao?.id);
      showNotification(editingAvaliacao ? 'Avaliação atualizada!' : 'Avaliação salva!', 'success');
      setShowAddModal(false);
      setEditingAvaliacao(null);
      setNewAvaliacao({ data: new Date().toISOString().split('T')[0], peso: 0, altura: 0 });
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [newAvaliacao, editingAvaliacao, loadData, showNotification]);

  /** Abre modal de nova avaliação */
  const openAddModal = useCallback(() => {
    setEditingAvaliacao(null);
    setNewAvaliacao({ data: new Date().toISOString().split('T')[0], peso: 0, altura: 0 });
    setShowAddModal(true);
  }, []);

  return {
    avaliacoes: filteredAvaliacoes,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    openAddModal,
    editingAvaliacao,
    startEdit,
    showViewModal,
    setShowViewModal,
    selectedAvaliacao,
    historico,
    viewAvaliacao,
    newAvaliacao,
    setNewAvaliacao,
    handleSave,
    notification,
    showNotification,
    clearNotification,
  };
}
