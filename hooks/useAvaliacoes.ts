'use client';

// Hook customizado para o módulo de Avaliação Física
import { useState, useEffect, useCallback } from 'react';
import * as avaliacoesService from '@/services/avaliacoes.service';
import { useNotification } from '@/hooks/useNotification';
import { useAuth } from '@/hooks/useAuth';
import type { Avaliacao, AvaliacaoFormData, AvaliacaoAlunoItem } from '@/types/avaliacao';

function createDefaultAvaliacaoForm(): AvaliacaoFormData {
  return {
    data: new Date().toISOString().split('T')[0],
    peso: 0,
    altura: 0,
    protocolo: 'faulkner',
  };
}

export function useAvaliacoes() {
  const { user, profile, loading: authLoading } = useAuth();
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

  const [newAvaliacao, setNewAvaliacao] = useState<AvaliacaoFormData>(createDefaultAvaliacaoForm);

  const { notification, showNotification, clearNotification } = useNotification();

  const role = profile?.role || 'aluno';
  const restrictUserId = role === 'aluno' ? user?.id : undefined;

  const loadData = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    try {
      if (role === 'aluno' && !restrictUserId) {
        setAvaliacoes([]);
        setAlunos([]);
        return;
      }

      const [avaliacoesData, alunosData] = await Promise.all([
        avaliacoesService.fetchAvaliacoes(restrictUserId),
        avaliacoesService.fetchAlunosParaAvaliacao(restrictUserId),
      ]);
      setAvaliacoes(avaliacoesData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, role, restrictUserId]);

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
      const hist = await avaliacoesService.fetchHistoricoAluno(avaliacao.student_id, restrictUserId);
      setHistorico(hist);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  }, [restrictUserId]);

  /** Salva avaliação */
  const handleSave = useCallback(async () => {
    try {
      await avaliacoesService.salvarAvaliacao(
        newAvaliacao,
        editingAvaliacao?.id ?? newAvaliacao.id
      );
      showNotification(editingAvaliacao ? 'Avaliação atualizada!' : 'Avaliação salva!', 'success');
      setShowAddModal(false);
      setEditingAvaliacao(null);
      setNewAvaliacao(createDefaultAvaliacaoForm());
      await loadData();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === 'object' &&
              error !== null &&
              'message' in error &&
              typeof (error as { message: unknown }).message === 'string'
            ? (error as { message: string }).message
            : 'Erro ao salvar a avaliação.';
      showNotification(`Erro: ${msg}`, 'error');
    }
  }, [newAvaliacao, editingAvaliacao, loadData, showNotification]);

  /** Abre modal de nova avaliação */
  const openAddModal = useCallback(() => {
    setEditingAvaliacao(null);
    setNewAvaliacao(createDefaultAvaliacaoForm());
    setShowAddModal(true);
  }, []);

  /** Fecha o modal e limpa edição / rascunho */
  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setEditingAvaliacao(null);
    setNewAvaliacao(createDefaultAvaliacaoForm());
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
    closeAddModal,
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
