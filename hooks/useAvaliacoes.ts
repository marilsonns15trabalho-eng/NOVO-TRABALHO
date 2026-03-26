'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import * as avaliacoesService from '@/services/avaliacoes.service';
import type { Avaliacao, AvaliacaoAlunoItem, AvaliacaoFormData } from '@/types/avaliacao';

function createDefaultAvaliacaoForm(): AvaliacaoFormData {
  return {
    data: new Date().toISOString().split('T')[0],
    peso: 0,
    altura: 0,
    protocolo: 'faulkner',
  };
}

export function useAvaliacoes() {
  const { user, isAluno, isReady } = useAuth();
  const { notification, showNotification, clearNotification } = useNotification();

  const restrictLinkedAuthUserId = isAluno ? user?.id : undefined;

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunos, setAlunos] = useState<AvaliacaoAlunoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  const [historico, setHistorico] = useState<Avaliacao[]>([]);
  const [newAvaliacao, setNewAvaliacao] = useState<AvaliacaoFormData>(createDefaultAvaliacaoForm);

  const loadData = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    try {
      if (isAluno && !restrictLinkedAuthUserId) {
        setAvaliacoes([]);
        setAlunos([]);
        return;
      }

      const [avaliacoesData, alunosData] = await Promise.all([
        avaliacoesService.fetchAvaliacoes(restrictLinkedAuthUserId),
        avaliacoesService.fetchAlunosParaAvaliacao(restrictLinkedAuthUserId),
      ]);

      setAvaliacoes(avaliacoesData);
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar avaliacoes:', error);
    } finally {
      setLoading(false);
    }
  }, [isAluno, isReady, restrictLinkedAuthUserId]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      setAvaliacoes([]);
      setAlunos([]);
      setLoading(false);
      return;
    }

    void loadData();
  }, [isReady, loadData, user]);

  const filteredAvaliacoes = avaliacoes.filter((avaliacao) => {
    const nome = avaliacao.students?.nome || '';
    return nome.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const startEdit = useCallback((avaliacao: Avaliacao) => {
    try {
      if (isAluno) {
        throw new Error('Ação não permitida para aluno');
      }

      setEditingAvaliacao(avaliacao);
      setNewAvaliacao({ ...avaliacao });
      setShowAddModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao abrir avaliacao.';
      showNotification(message, 'error');
    }
  }, [isAluno, showNotification]);

  const viewAvaliacao = useCallback(async (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setShowViewModal(true);

    try {
      const hist = await avaliacoesService.fetchHistoricoAluno(
        avaliacao.student_id,
        restrictLinkedAuthUserId
      );
      setHistorico(hist);
    } catch (error) {
      console.error('Erro ao buscar historico:', error);
    }
  }, [restrictLinkedAuthUserId]);

  const handleSave = useCallback(async () => {
    try {
      if (isAluno) {
        throw new Error('Ação não permitida para aluno');
      }

      await avaliacoesService.salvarAvaliacao(
        newAvaliacao,
        editingAvaliacao?.id ?? newAvaliacao.id
      );

      showNotification(editingAvaliacao ? 'Avaliacao atualizada!' : 'Avaliacao salva!', 'success');
      setShowAddModal(false);
      setEditingAvaliacao(null);
      setNewAvaliacao(createDefaultAvaliacaoForm());
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao salvar a avaliacao.';
      showNotification(message, 'error');
    }
  }, [editingAvaliacao, isAluno, loadData, newAvaliacao, showNotification]);

  const openAddModal = useCallback(() => {
    try {
      if (isAluno) {
        throw new Error('Ação não permitida para aluno');
      }

      setEditingAvaliacao(null);
      setNewAvaliacao(createDefaultAvaliacaoForm());
      setShowAddModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao abrir formulario.';
      showNotification(message, 'error');
    }
  }, [isAluno, showNotification]);

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
