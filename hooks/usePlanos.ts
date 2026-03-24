'use client';

// Hook customizado para o módulo de Planos
import { useState, useEffect, useCallback } from 'react';
import * as planosService from '@/services/planos.service';
import { useNotification } from '@/hooks/useNotification';
import type { Plano, PlanoFormData } from '@/types/plano';

const EMPTY_FORM: PlanoFormData = {
  name: '',
  price: '',
  duration_months: '',
  description: '',
  active: true,
};

export function usePlanos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const [formData, setFormData] = useState<PlanoFormData>({ ...EMPTY_FORM });

  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await planosService.fetchPlanos();
      setPlanos(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Inicia edição */
  const startEdit = useCallback((plano: Plano) => {
    setEditingPlano(plano);
    setFormData({
      name: plano.name,
      price: (plano.price ?? 0).toString(),
      duration_months: (plano.duration_months ?? 1).toString(),
      description: plano.description,
      active: plano.active,
    });
    setShowAddModal(true);
  }, []);

  /** Salva (cria ou atualiza) */
  const handleSave = useCallback(async () => {
    try {
      if (editingPlano) {
        await planosService.updatePlano(editingPlano.id, formData);
      } else {
        await planosService.createPlano(formData);
      }
      showNotification(editingPlano ? 'Plano atualizado!' : 'Plano criado!', 'success');
      setShowAddModal(false);
      setEditingPlano(null);
      setFormData({ ...EMPTY_FORM });
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [formData, editingPlano, loadData, showNotification]);

  /** Confirma exclusão/desativação */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmation) return;

    const plano = planos.find((p) => p.id === deleteConfirmation);
    if (!plano) return;

    try {
      await planosService.deleteOrDeactivatePlano(plano);
      showNotification(plano.active ? 'Plano desativado.' : 'Plano excluído.', 'success');
      setDeleteConfirmation(null);
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [deleteConfirmation, planos, loadData, showNotification]);

  /** Abre modal para novo plano */
  const openAddModal = useCallback(() => {
    setEditingPlano(null);
    setFormData({ ...EMPTY_FORM });
    setShowAddModal(true);
  }, []);

  return {
    planos,
    loading,
    showAddModal,
    setShowAddModal,
    openAddModal,
    editingPlano,
    startEdit,
    deleteConfirmation,
    setDeleteConfirmation,
    formData,
    setFormData,
    handleSave,
    handleConfirmDelete,
    notification,
    showNotification,
    clearNotification,
  };
}
