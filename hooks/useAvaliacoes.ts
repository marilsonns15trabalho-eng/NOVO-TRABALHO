'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import * as avaliacoesService from '@/services/avaliacoes.service';
import { formatDatePtBr, getLocalDateInputValue } from '@/lib/date';
import type {
  Avaliacao,
  AvaliacaoAlunoItem,
  AvaliacaoFormData,
} from '@/types/avaliacao';

function createDefaultAvaliacaoForm(): AvaliacaoFormData {
  return {
    data: getLocalDateInputValue(),
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
  const [newAvaliacao, setNewAvaliacao] = useState<AvaliacaoFormData>(
    createDefaultAvaliacaoForm,
  );

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
        avaliacoesService.fetchAvaliacoes(restrictLinkedAuthUserId, isAluno),
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
    const needle = searchTerm.trim().toLowerCase();

    if (!needle) {
      return true;
    }

    const values = [
      avaliacao.students?.nome || '',
      avaliacao.protocolo || '',
      avaliacao.data || '',
      formatDatePtBr(avaliacao.data),
    ];

    return values.some((value) => value.toLowerCase().includes(needle));
  });

  const startEdit = useCallback(
    async (avaliacao: Avaliacao) => {
      try {
        if (isAluno) {
          throw new Error('Acao nao permitida para aluno');
        }

        const historicoCompleto = await avaliacoesService.fetchHistoricoAluno(
          avaliacao.student_id,
          restrictLinkedAuthUserId,
        );
        const avaliacaoCompleta =
          historicoCompleto.find((item) => item.id === avaliacao.id) ?? avaliacao;

        setEditingAvaliacao(avaliacaoCompleta);
        setNewAvaliacao({ ...avaliacaoCompleta });
        setShowAddModal(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao abrir avaliacao.';
        showNotification(message, 'error');
      }
    },
    [isAluno, restrictLinkedAuthUserId, showNotification],
  );

  const viewAvaliacao = useCallback(
    async (avaliacao: Avaliacao) => {
      try {
        const hist = await avaliacoesService.fetchHistoricoAluno(
          avaliacao.student_id,
          restrictLinkedAuthUserId,
        );
        const avaliacaoCompleta = hist.find((item) => item.id === avaliacao.id) ?? avaliacao;
        setSelectedAvaliacao(avaliacaoCompleta);
        setHistorico(hist);
        setShowViewModal(true);
      } catch (error) {
        console.error('Erro ao buscar historico:', error);
      }
    },
    [restrictLinkedAuthUserId],
  );

  const handleSave = useCallback(
    async (afterPersist?: (saved: Avaliacao) => Promise<void> | void) => {
      try {
        if (isAluno) {
          throw new Error('Acao nao permitida para aluno');
        }

        if (!newAvaliacao.student_id) {
          throw new Error('Selecione o aluno antes de salvar a avaliacao.');
        }

        if (!newAvaliacao.data) {
          throw new Error('Informe a data da avaliacao.');
        }

        if (newAvaliacao.peso === null || newAvaliacao.peso === undefined || Number(newAvaliacao.peso) <= 0) {
          throw new Error('Informe um peso valido para a avaliacao.');
        }

        if (newAvaliacao.altura === null || newAvaliacao.altura === undefined || Number(newAvaliacao.altura) <= 0) {
          throw new Error('Informe uma altura valida para a avaliacao.');
        }

        const savedAvaliacao = await avaliacoesService.salvarAvaliacao(
          newAvaliacao,
          editingAvaliacao?.id ?? newAvaliacao.id,
        );

        if (afterPersist) {
          await afterPersist(savedAvaliacao);
        }

        showNotification(
          editingAvaliacao ? 'Avaliacao atualizada!' : 'Avaliacao salva!',
          'success',
        );
        setShowAddModal(false);
        setEditingAvaliacao(null);
        setNewAvaliacao(createDefaultAvaliacaoForm());
        await loadData();

        return savedAvaliacao;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao salvar a avaliacao.';
        showNotification(message, 'error');
        return null;
      }
    },
    [editingAvaliacao, isAluno, loadData, newAvaliacao, showNotification],
  );

  const openAddModal = useCallback(() => {
    try {
      if (isAluno) {
        throw new Error('Acao nao permitida para aluno');
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
