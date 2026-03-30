'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import * as anamnesesService from '@/services/anamneses.service';
import { formatDatePtBr, getLocalDateInputValue } from '@/lib/date';
import type { AlunoListItem } from '@/types/common';
import type { Anamnese, AnamneseFormData, AnamneseStudentContext } from '@/types/anamnese';

export type AnamneseFormStep = 'dados' | 'saude' | 'alimentacao' | 'rotina' | 'metas';

function createEmptyAnamneseForm(): AnamneseFormData {
  return {
    data: getLocalDateInputValue(),
  };
}

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
  const [editingAnamnese, setEditingAnamnese] = useState<Anamnese | null>(null);
  const [newAnamnese, setNewAnamnese] = useState<AnamneseFormData>(createEmptyAnamneseForm());
  const [studentContext, setStudentContext] = useState<AnamneseStudentContext | null>(null);
  const [studentContextLoading, setStudentContextLoading] = useState(false);
  const [activeFormStep, setActiveFormStep] = useState<AnamneseFormStep>('dados');

  const loadData = useCallback(async () => {
    if (!isReady) {
      return;
    }

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
    if (!isReady) {
      return;
    }

    if (!user) {
      setAnamneses([]);
      setAlunos([]);
      setLoading(false);
      return;
    }

    void loadData();
  }, [isReady, loadData, user]);

  const filteredAnamneses = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return anamneses;
    }

    return anamneses.filter((anamnese) => {
      const values = [
        anamnese.students?.nome || '',
        anamnese.objetivo_nutricional || '',
        anamnese.data || '',
        formatDatePtBr(anamnese.data),
      ];

      return values.some((value) => value.toLowerCase().includes(needle));
    });
  }, [anamneses, searchTerm]);

  const viewAnamnese = useCallback((anamnese: Anamnese) => {
    setSelectedAnamnese(anamnese);
    setShowViewModal(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setEditingAnamnese(null);
    setStudentContext(null);
    setStudentContextLoading(false);
    setActiveFormStep('dados');
    setNewAnamnese(createEmptyAnamneseForm());
  }, []);

  const openNewAnamneseModal = useCallback(() => {
    setEditingAnamnese(null);
    setStudentContext(null);
    setStudentContextLoading(false);
    setActiveFormStep('dados');
    setNewAnamnese(createEmptyAnamneseForm());
    setShowAddModal(true);
  }, []);

  const startEditAnamnese = useCallback((anamnese: Anamnese) => {
    setEditingAnamnese(anamnese);
    setStudentContext(null);
    setStudentContextLoading(false);
    setActiveFormStep('dados');
    setNewAnamnese({
      ...anamnese,
      students: undefined,
    });
    setShowAddModal(true);
  }, []);

  const loadStudentContext = useCallback(async (studentId?: string | null) => {
    if (!studentId) {
      setStudentContext(null);
      return;
    }

    try {
      setStudentContextLoading(true);
      const context = await anamnesesService.fetchStudentAnamneseContext(studentId);
      setStudentContext(context);
      setNewAnamnese((current) => ({
        ...current,
        peso:
          current.peso === null || current.peso === undefined || Number.isNaN(current.peso)
            ? context?.latest_peso ?? current.peso
            : current.peso,
        altura:
          current.altura === null || current.altura === undefined || Number.isNaN(current.altura)
            ? context?.latest_altura ?? current.altura
            : current.altura,
      }));
    } catch (error) {
      console.error('Erro ao carregar contexto da aluna para anamnese:', error);
      setStudentContext(null);
    } finally {
      setStudentContextLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAddModal) {
      return;
    }

    const studentId = typeof newAnamnese.student_id === 'string' ? newAnamnese.student_id : null;
    void loadStudentContext(studentId);
  }, [loadStudentContext, newAnamnese.student_id, showAddModal]);

  const handleSave = useCallback(async () => {
    try {
      if (isAluno) {
        throw new Error('Acao nao permitida para aluno.');
      }

      if (!newAnamnese.student_id) {
        throw new Error('Selecione a aluna antes de salvar a anamnese.');
      }

      if (!newAnamnese.data) {
        throw new Error('Informe a data da anamnese antes de salvar.');
      }

      if (editingAnamnese?.id) {
        await anamnesesService.updateAnamnese(editingAnamnese.id, newAnamnese);
        showNotification('Anamnese atualizada com sucesso!', 'success');
      } else {
        await anamnesesService.createAnamnese(newAnamnese);
        showNotification('Anamnese salva com sucesso!', 'success');
      }

      closeAddModal();
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar anamnese.';
      showNotification(message, 'error');
    }
  }, [closeAddModal, editingAnamnese?.id, isAluno, loadData, newAnamnese, showNotification]);

  return {
    anamneses: filteredAnamneses,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    openNewAnamneseModal,
    closeAddModal,
    showViewModal,
    setShowViewModal,
    selectedAnamnese,
    viewAnamnese,
    editingAnamnese,
    startEditAnamnese,
    newAnamnese,
    setNewAnamnese,
    studentContext,
    studentContextLoading,
    activeFormStep,
    setActiveFormStep,
    handleSave,
    notification,
    showNotification,
    clearNotification,
  };
}
