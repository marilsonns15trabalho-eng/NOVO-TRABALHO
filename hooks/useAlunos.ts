'use client';
import { useState, useEffect, useCallback } from 'react';
import * as alunosService from '@/services/alunos.service';
import { useNotification } from '@/hooks/useNotification';
import { useAuth } from '@/contexts/AuthContext';
import { getAlunosCache, saveAlunosCache } from '@/lib/cache/alunosCache';
import type { Aluno, AlunoFormData } from '@/types/aluno';
import type { PlanoListItem } from '@/types/common';
import type { UserRole } from '@/contexts/AuthContext';

export function useAlunos(userRole: UserRole | null) {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<PlanoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  // Modais e formulário
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [selectedPlanoId, setSelectedPlanoId] = useState('');

  const { notification, showNotification, clearNotification } = useNotification();

  /** Carrega alunos e planos do banco */
  const loadData = useCallback(async () => {
    if (!user) return;

    const cached = getAlunosCache(user.id);
    if (cached) {
      console.log('Usando cache de alunos');
      setAlunos(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [alunosData, planosData] = await Promise.all([
        alunosService.fetchAlunos(),
        alunosService.fetchPlanosAtivos(),
      ]);
      setAlunos(alunosData);
      setPlanos(planosData);
      saveAlunosCache(user.id, alunosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (cached) {
        console.warn('Mantendo cache de alunos');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Alunos filtrados por busca e status */
  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch = aluno.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || aluno.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /** Inicia edição de um aluno */
  const startEdit = useCallback((aluno: Aluno) => {
    setEditingAluno(aluno);
    setSelectedPlanoId(aluno.plano_id || '');
    setShowAddModal(true);
  }, []);

  /** Salva (cria ou atualiza) um aluno */
  const handleSave = useCallback(async (formData: AlunoFormData) => {
    try {
      if (editingAluno) {
        await alunosService.updateAluno(editingAluno.id, formData, planos, selectedPlanoId, userRole ?? undefined);
        showNotification('Aluno atualizado com sucesso!', 'success');
      } else {
        await alunosService.createAluno(formData, planos, selectedPlanoId);
        showNotification('Aluno e acesso criados com senha inicial 123456.', 'success');
      }
      setShowAddModal(false);
      setEditingAluno(null);
      setSelectedPlanoId('');
      await loadData();
    } catch (error: any) {
      showNotification(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
    }
  }, [editingAluno, loadData, planos, selectedPlanoId, showNotification, userRole]);

  /** Exclui um aluno (cascade) */
  const handleDelete = useCallback(async () => {
    if (!deleteConfirmation) return;
    try {
      await alunosService.deleteAluno(deleteConfirmation);
      showNotification('Aluno excluído com sucesso.', 'success');
      setDeleteConfirmation(null);
      setSelectedAluno(null);
      await loadData();
    } catch (error: any) {
      showNotification(`Erro ao excluir: ${error.message}`, 'error');
    }
  }, [deleteConfirmation, loadData, showNotification]);

  /** Alterna status ativo/inativo */
  const handleToggleStatus = useCallback(async (alunoId: string, currentStatus: string) => {
    try {
      await alunosService.toggleAlunoStatus(alunoId, currentStatus);
      showNotification(`Status do aluno alterado.`, 'success');
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [loadData, showNotification]);

  /** Abre modal de novo aluno */
  const openAddModal = useCallback(() => {
    setEditingAluno(null);
    setSelectedPlanoId('');
    setShowAddModal(true);
  }, []);

  /** Fecha modal */
  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setEditingAluno(null);
    setSelectedPlanoId('');
  }, []);

  return {
    // Dados
    alunos: filteredAlunos,
    allAlunos: alunos,
    planos,
    loading,

    // Busca e filtros
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,

    // Modais
    showAddModal,
    openAddModal,
    closeAddModal,
    editingAluno,
    startEdit,
    selectedAluno,
    setSelectedAluno,
    deleteConfirmation,
    setDeleteConfirmation,
    selectedPlanoId,
    setSelectedPlanoId,

    // Ações
    handleSave,
    handleDelete,
    handleToggleStatus,
    loadData,

    // Notificação
    notification,
    showNotification,
    clearNotification,
  };
}
