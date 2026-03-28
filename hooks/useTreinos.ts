'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import * as treinosService from '@/services/treinos.service';
import { getTreinosCache, saveTreinosCache } from '@/lib/cache/treinosCache';
import type { StudentListItem } from '@/types/common';
import type {
  Exercicio,
  TrainingPlan,
  Treino,
  TreinoFormData,
} from '@/types/treino';

const EMPTY_EXERCICIO: Exercicio = {
  nome: '',
  grupo_muscular: '',
  series: 3,
  repeticoes: '12',
  carga: '',
  descanso: '60s',
  observacoes: '',
};

function createDefaultTreinoForm(): TreinoFormData {
  return {
    nome: '',
    objetivo: '',
    nivel: 'iniciante',
    duracao_minutos: 60,
    descricao: '',
    exercicios: [{ ...EMPTY_EXERCICIO }],
    ativo: true,
    assigned_student_ids: [],
    training_plan_id: '',
    training_plan_version_id: '',
    sort_order: 0,
    split_label: '',
    day_of_week: null,
    coach_notes: '',
  };
}

function createDefaultTrainingPlanForm() {
  return {
    name: '',
    weekly_frequency: 3,
    description: '',
    active: true,
    objective: '',
    level: 'iniciante',
    duration_weeks: 4,
    coach_notes: '',
  };
}

export function useTreinos() {
  const { user, isAluno, isReady } = useAuth();
  const { notification, showNotification, clearNotification } = useNotification();

  const restrictLinkedAuthUserId = isAluno ? user?.id : undefined;

  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [alunos, setAlunos] = useState<StudentListItem[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);
  const [newTreino, setNewTreino] = useState<TreinoFormData>(createDefaultTreinoForm);

  const [showTrainingPlanModal, setShowTrainingPlanModal] = useState(false);
  const [newTrainingPlan, setNewTrainingPlan] = useState(createDefaultTrainingPlanForm);
  const [editingTrainingPlan, setEditingTrainingPlan] = useState<TrainingPlan | null>(null);
  const [selectedPlanForStudents, setSelectedPlanForStudents] = useState<TrainingPlan | null>(null);
  const [showPlanStudentsModal, setShowPlanStudentsModal] = useState(false);
  const [selectedPlanStudentIds, setSelectedPlanStudentIds] = useState<string[]>([]);
  const [planLinkedStudentsPreview, setPlanLinkedStudentsPreview] = useState<StudentListItem[]>([]);

  const loadData = useCallback(async () => {
    if (!isReady || !user) {
      return;
    }

    const cached = getTreinosCache(user.id);
    if (cached) {
      setTreinos(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [treinosResult, alunosResult, trainingPlansResult] = await Promise.allSettled([
        treinosService.fetchTreinos(restrictLinkedAuthUserId),
        treinosService.fetchAlunosParaTreino(restrictLinkedAuthUserId),
        isAluno ? Promise.resolve([]) : treinosService.fetchTrainingPlans(),
      ]);

      if (treinosResult.status === 'fulfilled') {
        setTreinos(treinosResult.value);
        setSelectedTreino((current) =>
          current ? treinosResult.value.find((item) => item.id === current.id) || null : null,
        );
        saveTreinosCache(user.id, treinosResult.value);
      } else {
        console.error('Erro ao carregar treinos:', treinosResult.reason);
      }

      if (alunosResult.status === 'fulfilled') {
        setAlunos(alunosResult.value);
      } else {
        console.error('Erro ao carregar alunos para treino:', alunosResult.reason);
        setAlunos([]);
      }

      if (trainingPlansResult.status === 'fulfilled') {
        setTrainingPlans(trainingPlansResult.value as TrainingPlan[]);
      } else {
        console.error('Erro ao carregar planos de treino:', trainingPlansResult.reason);
        setTrainingPlans([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do modulo de treinos:', error);
    } finally {
      setLoading(false);
    }
  }, [isAluno, isReady, restrictLinkedAuthUserId, user]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      setTreinos([]);
      setAlunos([]);
      setTrainingPlans([]);
      setLoading(false);
      return;
    }

    void loadData();
  }, [isReady, loadData, user]);

  useEffect(() => {
    if (isAluno || !showAddModal) {
      return;
    }

    const trainingPlanId = newTreino.training_plan_id?.trim();
    if (!trainingPlanId) {
      setPlanLinkedStudentsPreview([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const students = await treinosService.fetchStudentsForTrainingPlan(trainingPlanId);
        if (!cancelled) {
          setPlanLinkedStudentsPreview(students);
        }
      } catch (error) {
        if (!cancelled) {
          setPlanLinkedStudentsPreview([]);
        }
        console.error('Erro ao carregar alunos do plano selecionado:', error);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isAluno, newTreino.training_plan_id, showAddModal]);

  const filteredTreinos = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return treinos;
    }

    return treinos.filter((treino) => {
      const assignedNames = (treino.assigned_students || []).map((student) => student.name).join(' ');
      return (
        treino.nome.toLowerCase().includes(needle) ||
        (treino.training_plan?.name || '').toLowerCase().includes(needle) ||
        assignedNames.toLowerCase().includes(needle)
      );
    });
  }, [searchTerm, treinos]);

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
        currentIndex === index ? { ...exercicio, [field]: value } : exercicio,
      ),
    }));
  }, []);

  const toggleAssignedStudent = useCallback((studentId: string) => {
    setNewTreino((current) => {
      const currentIds = current.assigned_student_ids || [];
      const nextIds = currentIds.includes(studentId)
        ? currentIds.filter((id) => id !== studentId)
        : [...currentIds, studentId];

      return {
        ...current,
        assigned_student_ids: nextIds,
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (isAluno) {
        throw new Error('Acao nao permitida para aluno.');
      }

      await treinosService.saveTreino(newTreino, selectedTreino?.id);
      showNotification(
        selectedTreino ? 'Treino atualizado com sucesso!' : 'Treino salvo com sucesso!',
        'success',
      );
      setShowAddModal(false);
      setSelectedTreino(null);
      setNewTreino(createDefaultTreinoForm());
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar treino.';
      showNotification(message, 'error');
    }
  }, [isAluno, loadData, newTreino, selectedTreino, showNotification]);

  const handleSaveTrainingPlan = useCallback(async () => {
    try {
      if (isAluno) {
        throw new Error('Acao nao permitida para aluno.');
      }

      if (editingTrainingPlan?.id) {
        await treinosService.updateTrainingPlan(editingTrainingPlan.id, newTrainingPlan);
      } else {
        await treinosService.createTrainingPlan(newTrainingPlan);
      }

      showNotification(
        editingTrainingPlan ? 'Plano de treino atualizado com sucesso!' : 'Plano de treino salvo com sucesso!',
        'success',
      );
      setShowTrainingPlanModal(false);
      setNewTrainingPlan(createDefaultTrainingPlanForm());
      setEditingTrainingPlan(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar plano de treino.';
      showNotification(message, 'error');
    }
  }, [editingTrainingPlan, isAluno, loadData, newTrainingPlan, showNotification]);

  const openNewTrainingPlanModal = useCallback(() => {
    setEditingTrainingPlan(null);
    setNewTrainingPlan(createDefaultTrainingPlanForm());
    setShowTrainingPlanModal(true);
  }, []);

  const closeTrainingPlanModal = useCallback(() => {
    setShowTrainingPlanModal(false);
    setEditingTrainingPlan(null);
    setNewTrainingPlan(createDefaultTrainingPlanForm());
  }, []);

  const startTrainingPlanEdit = useCallback((plan: TrainingPlan) => {
    setEditingTrainingPlan(plan);
    setNewTrainingPlan({
      name: plan.name || '',
      weekly_frequency: plan.weekly_frequency || 3,
      description: plan.description || '',
      active: plan.active !== false,
      objective: plan.active_version?.objective || '',
      level: plan.active_version?.level || 'iniciante',
      duration_weeks: plan.active_version?.duration_weeks || 4,
      coach_notes: plan.active_version?.coach_notes || '',
    });
    setShowTrainingPlanModal(true);
  }, []);

  const openPlanStudentsModal = useCallback(async (trainingPlan: TrainingPlan) => {
    setSelectedPlanForStudents(trainingPlan);
    setShowPlanStudentsModal(true);

    try {
      const studentIds = await treinosService.fetchStudentIdsForTrainingPlan(trainingPlan.id);
      setSelectedPlanStudentIds(studentIds);
    } catch (error) {
      setSelectedPlanStudentIds([]);
      const message =
        error instanceof Error ? error.message : 'Erro ao carregar alunos do plano.';
      showNotification(message, 'error');
    }
  }, [showNotification]);

  const togglePlanStudent = useCallback((studentId: string) => {
    setSelectedPlanStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }, []);

  const handleSavePlanStudents = useCallback(async () => {
    if (!selectedPlanForStudents) {
      return;
    }

    try {
      await treinosService.syncStudentsToTrainingPlan(
        selectedPlanForStudents.id,
        selectedPlanStudentIds,
      );
      showNotification('Alunos vinculados ao plano com sucesso!', 'success');
      setShowPlanStudentsModal(false);
      setSelectedPlanForStudents(null);
      setSelectedPlanStudentIds([]);
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar alunos do plano.';
      showNotification(message, 'error');
    }
  }, [loadData, selectedPlanForStudents, selectedPlanStudentIds, showNotification]);

  const viewTreino = useCallback((treino: Treino) => {
    setSelectedTreino(treino);
    setShowViewModal(true);
  }, []);

  const startTreinoEdit = useCallback((treino: Treino) => {
    setSelectedTreino(treino);
    setNewTreino({
      id: treino.id,
      nome: treino.nome,
      objetivo: treino.objetivo || '',
      nivel: treino.nivel || 'iniciante',
      duracao_minutos: treino.duracao_minutos || 60,
      descricao: treino.descricao || '',
      exercicios: treino.exercicios?.length ? treino.exercicios : [{ ...EMPTY_EXERCICIO }],
      ativo: treino.ativo !== false,
      training_plan_id: treino.training_plan_id || '',
      training_plan_version_id: treino.training_plan_version_id || '',
      assigned_student_ids: (treino.assigned_students || []).map((student) => student.id),
      sort_order: treino.sort_order || 0,
      split_label: treino.split_label || '',
      day_of_week: treino.day_of_week ?? null,
      coach_notes: treino.coach_notes || '',
    });
    setShowAddModal(true);
  }, []);

  const openNewTreinoModal = useCallback(() => {
    setSelectedTreino(null);
    setNewTreino(createDefaultTreinoForm());
    setPlanLinkedStudentsPreview([]);
    setShowAddModal(true);
  }, []);

  const handleCompletionToggle = useCallback(async (treinoId: string, studentId?: string, completed = true) => {
    try {
      await treinosService.setTreinoCompletion({
        treinoId,
        studentId,
        completed,
      });
      showNotification(
        completed ? 'Treino marcado como concluido.' : 'Conclusao removida.',
        'success',
      );
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar conclusao do treino.';
      showNotification(message, 'error');
    }
  }, [loadData, showNotification]);

  return {
    treinos: filteredTreinos,
    alunos,
    trainingPlans,
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
    toggleAssignedStudent,
    handleSave,
    viewTreino,
    startTreinoEdit,
    openNewTreinoModal,
    showTrainingPlanModal,
    setShowTrainingPlanModal,
    editingTrainingPlan,
    newTrainingPlan,
    setNewTrainingPlan,
    handleSaveTrainingPlan,
    openNewTrainingPlanModal,
    closeTrainingPlanModal,
    startTrainingPlanEdit,
    showPlanStudentsModal,
    setShowPlanStudentsModal,
    selectedPlanForStudents,
    selectedPlanStudentIds,
    openPlanStudentsModal,
    togglePlanStudent,
    handleSavePlanStudents,
    handleCompletionToggle,
    planLinkedStudentsPreview,
    notification,
    clearNotification,
  };
}
