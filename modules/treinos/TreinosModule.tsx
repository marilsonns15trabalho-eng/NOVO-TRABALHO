'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  Eye,
  Filter,
  Layers3,
  Loader2,
  PencilLine,
  PlayCircle,
  Plus,
  Search,
  X,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ExerciseOfficialPreviewModal from '@/components/treinos/ExerciseOfficialPreviewModal';
import { useTreinos } from '@/hooks/useTreinos';
import { useUserRole } from '@/hooks/useUserRole';
import { Toast } from '@/components/ui';
import { formatDatePtBr } from '@/lib/date';
import { formatTrainingDay } from '@/lib/training';
import * as exerciseLibraryService from '@/services/exerciseLibrary.service';
import * as treinosService from '@/services/treinos.service';
import type { StudentListItem } from '@/types/common';
import type { ExerciseLibraryItem } from '@/types/exercise-library';
import type { TrainingPlan, Treino, TreinoExecutionItem, TreinoExecutionSession } from '@/types/treino';

const SPLIT_PRESETS = [
  { value: 'A', label: 'A: superiores' },
  { value: 'B', label: 'B: inferiores' },
  { value: 'C', label: 'C: cardio + core' },
];

function getSplitDisplayLabel(splitLabel?: string | null) {
  if (!splitLabel) {
    return '-';
  }

  const preset = SPLIT_PRESETS.find((item) => item.value === splitLabel.trim().toUpperCase());
  return preset?.label || splitLabel;
}

function hasExerciseOfficialPreview(item: ExerciseLibraryItem) {
  return Boolean(item.stream_path);
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
      <h3 className="mt-2 text-3xl font-bold text-white">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  accent,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-5 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
      <div className={`absolute inset-x-0 top-0 h-px ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">{label}</p>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-white">{icon}</div>
      </div>
      <p className="mt-6 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function HeroButton({
  filled = false,
  onClick,
  title,
  description,
  icon,
}: {
  filled?: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[24px] border p-4 text-left transition-all ${
        filled
          ? 'border-sky-500/20 bg-sky-500 text-black hover:bg-sky-400'
          : 'border-zinc-800 bg-zinc-950/80 text-white hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-bold ${filled ? 'text-black' : 'text-white'}`}>{title}</p>
          <p className={`mt-1 text-xs leading-5 ${filled ? 'text-black/70' : 'text-zinc-500'}`}>
            {description}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${filled ? 'bg-black/10' : 'bg-zinc-900 text-sky-400'}`}>{icon}</div>
      </div>
    </button>
  );
}

function CloseModalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
      aria-label="Fechar"
    >
      <X size={18} />
    </button>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs leading-5 text-zinc-500">{children}</p>;
}

function TrainingPlanCard({
  plan,
  onOpen,
  onEdit,
  onAssignStudents,
}: {
  plan: TrainingPlan;
  onOpen: (plan: TrainingPlan) => void;
  onEdit: (plan: TrainingPlan) => void;
  onAssignStudents: (plan: TrainingPlan) => void;
}) {
  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,2fr)_120px_100px_100px_auto] lg:items-center lg:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold text-white">{plan.name}</p>
          <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
            {plan.weekly_frequency}x / semana
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">
          {plan.active_version?.objective || plan.description || 'Rotina semanal sem objetivo detalhado.'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Versao</p>
        <p className="mt-1 text-sm font-bold text-white">
          {plan.active_version?.version_number ? `v${plan.active_version.version_number}` : '-'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Alunas</p>
        <p className="mt-1 text-sm font-bold text-white">{plan.students_count || 0}</p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Treinos</p>
        <p className="mt-1 text-sm font-bold text-white">{plan.treinos_count || 0}</p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          onClick={() => onOpen(plan)}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm font-bold text-white transition-all hover:border-zinc-700"
        >
          <Eye size={15} />
          Abrir
        </button>
        <button
          onClick={() => onEdit(plan)}
          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm font-bold text-white transition-all hover:border-zinc-700"
        >
          <PencilLine size={15} />
          Editar
        </button>
        <button
          onClick={() => onAssignStudents(plan)}
          className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black"
        >
          <Users size={15} />
          Vincular alunas
        </button>
      </div>
    </div>
  );
}

function TreinoCard({
  treino,
  canManageRecords,
  onView,
  onEdit,
}: {
  treino: Treino;
  canManageRecords: boolean;
  onView: (treino: Treino) => void;
  onEdit: (treino: Treino) => void;
}) {
  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto] lg:items-center lg:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-bold text-white">{treino.nome}</p>
          {treino.training_plan?.name ? (
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
              {treino.training_plan.name}
            </span>
          ) : (
            <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-500">
              Vinculo direto
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">
          {treino.descricao || treino.objetivo || 'Treino sem descricao adicional.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          {treino.split_label ? (
            <span className="rounded-full border border-orange-500/20 px-2.5 py-1 text-orange-300">
              {getSplitDisplayLabel(treino.split_label)}
            </span>
          ) : null}
          {treino.day_of_week != null ? (
            <span className="rounded-full border border-zinc-800 px-2.5 py-1">
              {formatTrainingDay(treino.day_of_week)}
            </span>
          ) : null}
          <span className="rounded-full border border-zinc-800 px-2.5 py-1">
            {treino.created_at ? formatDatePtBr(treino.created_at) : 'Sem data'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Exercicios</p>
          <p className="mt-1 text-sm font-bold text-white">{treino.exercicios?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Alunas</p>
          <p className="mt-1 text-sm font-bold text-white">{treino.assigned_students?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Mes</p>
          <p className="mt-1 text-sm font-bold text-white">{treino.completions_this_month || 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 lg:justify-end">
        <button onClick={() => onView(treino)} className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black">
          Ver detalhes
        </button>
        {canManageRecords && (
          <button onClick={() => onEdit(treino)} className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700">
            Editar
          </button>
        )}
      </div>
    </div>
  );
}

export default function TreinosModule() {
  const { isAdmin, isProfessor } = useUserRole();
  const canManageRecords = isAdmin || isProfessor;
  const [activePanel, setActivePanel] = useState<'rotinas' | 'treinos' | 'alunos'>('rotinas');
  const [selectedTrainingPlanView, setSelectedTrainingPlanView] = useState<TrainingPlan | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [planStudentSearchTerm, setPlanStudentSearchTerm] = useState('');
  const [studentPlanFilter, setStudentPlanFilter] = useState('');
  const [showAllStudentsForAssignment, setShowAllStudentsForAssignment] = useState(false);
  const [studentWorkoutSearchTerm, setStudentWorkoutSearchTerm] = useState('');
  const [selectedStudentView, setSelectedStudentView] = useState<StudentListItem | null>(null);
  const [operationalSession, setOperationalSession] = useState<TreinoExecutionSession | null>(null);
  const [operationalTreino, setOperationalTreino] = useState<Treino | null>(null);
  const [operationalStudent, setOperationalStudent] = useState<StudentListItem | null>(null);
  const [operationalSaving, setOperationalSaving] = useState(false);
  const [showExerciseLibraryModal, setShowExerciseLibraryModal] = useState(false);
  const [exerciseLibraryQuery, setExerciseLibraryQuery] = useState('');
  const [exerciseLibraryLoading, setExerciseLibraryLoading] = useState(false);
  const [exerciseLibraryResults, setExerciseLibraryResults] = useState<ExerciseLibraryItem[]>([]);
  const [exerciseLibraryError, setExerciseLibraryError] = useState<string | null>(null);
  const [selectedExercisePreview, setSelectedExercisePreview] = useState<ExerciseLibraryItem | null>(null);
  const [exercisePreviewLoadingName, setExercisePreviewLoadingName] = useState<string | null>(null);
  const state = useTreinos();
  const {
    treinos,
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
    planLinkedStudentsPreview,
    openPlanStudentsModal,
    togglePlanStudent,
    handleSavePlanStudents,
    handleCompletionToggle,
    reloadData,
    showNotification,
    notification,
    clearNotification,
  } = state;

  const metrics = useMemo(() => {
    const assignments = treinos.reduce((acc, item) => acc + (item.assigned_students?.length || 0), 0);
    const completions = treinos.reduce((acc, item) => acc + (item.completions_this_month || 0), 0);
    return { totalTreinos: treinos.length, totalPlans: trainingPlans.filter((item) => item.active).length, assignments, completions };
  }, [trainingPlans, treinos]);

  useEffect(() => {
    if (showAddModal) {
      setStudentSearchTerm('');
      setStudentPlanFilter('');
      setShowAllStudentsForAssignment(false);
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showPlanStudentsModal) {
      setPlanStudentSearchTerm('');
    }
  }, [showPlanStudentsModal]);

  const studentPlanOptions = useMemo(() => {
    return Array.from(
      new Set(
        alunos
          .map((aluno) => aluno.plan_name?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [alunos]);

  const routineStudentIds = useMemo(
    () => new Set(planLinkedStudentsPreview.map((student) => student.id)),
    [planLinkedStudentsPreview],
  );

  const filteredStudentsForAssignment = useMemo(() => {
    const needle = studentSearchTerm.trim().toLowerCase();
    const selectedIds = new Set(newTreino.assigned_student_ids || []);
    const shouldRestrictToRoutine =
      Boolean(newTreino.training_plan_id) && !showAllStudentsForAssignment;

    const baseStudents = shouldRestrictToRoutine
      ? alunos.filter((aluno) => routineStudentIds.has(aluno.id) || selectedIds.has(aluno.id))
      : alunos;

    return baseStudents
      .filter((aluno) => {
        const matchName =
          !needle ||
          aluno.name.toLowerCase().includes(needle) ||
          (aluno.email || '').toLowerCase().includes(needle);

        const matchPlan =
          !studentPlanFilter ||
          (studentPlanFilter === '__sem_plano__'
            ? !aluno.plan_name
            : aluno.plan_name === studentPlanFilter);

        return matchName && matchPlan;
      })
      .sort((a, b) => {
        const aSelected = selectedIds.has(a.id);
        const bSelected = selectedIds.has(b.id);

        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1;
        }

        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [
    alunos,
    newTreino.assigned_student_ids,
    newTreino.training_plan_id,
    routineStudentIds,
    showAllStudentsForAssignment,
    studentPlanFilter,
    studentSearchTerm,
  ]);

  const filteredPlanStudents = useMemo(() => {
    const needle = planStudentSearchTerm.trim().toLowerCase();
    return alunos
      .filter((aluno) => {
        if (!needle) {
          return true;
        }

        return (
          aluno.name.toLowerCase().includes(needle) ||
          (aluno.email || '').toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const aSelected = selectedPlanStudentIds.includes(a.id);
        const bSelected = selectedPlanStudentIds.includes(b.id);

        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1;
        }

        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [alunos, planStudentSearchTerm, selectedPlanStudentIds]);

  const studentsWithTreinos = useMemo(() => {
    const byStudent = new Map<
      string,
      { student: StudentListItem; treinos: Treino[]; completedTodayCount: number }
    >();

    treinos.forEach((treino) => {
      (treino.assigned_students || []).forEach((student) => {
        const fallbackStudent =
          alunos.find((aluno) => aluno.id === student.id) || {
            id: student.id,
            name: student.name,
            status: null,
            email: null,
            plan_id: null,
            plan_name: null,
          };

        const current =
          byStudent.get(student.id) || {
            student: fallbackStudent,
            treinos: [],
            completedTodayCount: 0,
          };

        current.treinos.push(treino);
        if (student.completed_today) {
          current.completedTodayCount += 1;
        }
        byStudent.set(student.id, current);
      });
    });

    const needle = studentWorkoutSearchTerm.trim().toLowerCase();

    return Array.from(byStudent.values())
      .filter((entry) => {
        if (!needle) {
          return true;
        }

        return (
          entry.student.name.toLowerCase().includes(needle) ||
          (entry.student.email || '').toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.student.name.localeCompare(b.student.name, 'pt-BR'));
  }, [alunos, studentWorkoutSearchTerm, treinos]);

  const selectedStudentTreinos = useMemo(() => {
    if (!selectedStudentView) {
      return [];
    }

    return treinos
      .filter((treino) =>
        (treino.assigned_students || []).some((student) => student.id === selectedStudentView.id),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [selectedStudentView, treinos]);

  const openStudentExecution = async (student: StudentListItem, treino: Treino) => {
    try {
      const session = await treinosService.startTreinoExecution({
        treinoId: treino.id,
        studentId: student.id,
      });
      setOperationalStudent(student);
      setOperationalTreino(treino);
      setOperationalSession(session);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel abrir a execucao do treino.';
      showNotification(message, 'error');
    }
  };

  const updateOperationalExecutionItem = (
    index: number,
    field: keyof TreinoExecutionItem,
    value: string | number | boolean | null,
  ) => {
    setOperationalSession((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      };
    });
  };

  const closeOperationalModal = () => {
    setOperationalSession(null);
    setOperationalTreino(null);
    setOperationalStudent(null);
  };

  const openExerciseLibraryModal = () => {
    setShowExerciseLibraryModal(true);
    setExerciseLibraryError(null);
  };

  const closeExercisePreviewModal = () => {
    setSelectedExercisePreview(null);
  };

  const closeExerciseLibraryModal = () => {
    setShowExerciseLibraryModal(false);
    setExerciseLibraryError(null);
    closeExercisePreviewModal();
  };

  const openExercisePreviewModal = (item: ExerciseLibraryItem) => {
    setSelectedExercisePreview(item);
  };

  const openExercisePreviewByName = async (
    exerciseName: string,
    preferredReference?: string | null,
    loadingKey?: string,
  ) => {
    const normalizedName = exerciseName.trim();
    if (!normalizedName) {
      showNotification('Este exercicio nao possui nome suficiente para buscar a demonstracao.', 'error');
      return;
    }

    try {
      setExercisePreviewLoadingName(loadingKey || normalizedName);
      const bestMatch = await exerciseLibraryService.resolveOfficialExercisePreview(
        normalizedName,
        preferredReference,
      );

      if (!bestMatch) {
        showNotification('Nao encontramos demonstracao oficial para este exercicio.', 'error');
        return;
      }

      openExercisePreviewModal(bestMatch);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel abrir a demonstracao oficial.';
      showNotification(message, 'error');
    } finally {
      setExercisePreviewLoadingName(null);
    }
  };

  const handleSearchExerciseLibrary = async () => {
    const query = exerciseLibraryQuery.trim();
    if (query.length < 2) {
      setExerciseLibraryError('Digite pelo menos 2 letras para buscar.');
      setExerciseLibraryResults([]);
      return;
    }

    try {
      setExerciseLibraryLoading(true);
      setExerciseLibraryError(null);
      const response = await exerciseLibraryService.searchOfficialExerciseLibrary(query);
      setExerciseLibraryResults(response.results || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel consultar a biblioteca oficial.';
      setExerciseLibraryError(message);
      setExerciseLibraryResults([]);
    } finally {
      setExerciseLibraryLoading(false);
    }
  };

  const addExerciseFromLibrary = (item: ExerciseLibraryItem) => {
    setNewTreino((current) => {
      const currentExercises = current.exercicios || [];
      const preparedExercise = {
        nome: item.display_name,
        grupo_muscular: item.primary_muscle_label || '',
        series: 3,
        repeticoes: '12',
        carga: '',
        descanso: '60s',
        observacoes: '',
        biblioteca_origem: 'wger' as const,
        biblioteca_referencia: item.original_name || item.display_name,
        biblioteca_titulo: item.display_name,
        biblioteca_tem_demonstracao: hasExerciseOfficialPreview(item),
      };

      const blankIndex = currentExercises.findIndex(
        (exercise) =>
          !exercise.nome?.trim() &&
          !exercise.grupo_muscular?.trim() &&
          !exercise.carga?.trim() &&
          !exercise.descanso?.trim() &&
          !exercise.observacoes?.trim(),
      );

      if (blankIndex >= 0) {
        return {
          ...current,
          exercicios: currentExercises.map((exercise, index) =>
            index === blankIndex ? preparedExercise : exercise,
          ),
        };
      }

      return {
        ...current,
        exercicios: [...currentExercises, preparedExercise],
      };
    });

    showNotification(`${item.display_name} adicionado ao treino.`, 'success');
    closeExerciseLibraryModal();
  };

  const saveOperationalExecution = async (markCompleted = false) => {
    if (!operationalSession) {
      return;
    }

    try {
      setOperationalSaving(true);
      const saved = await treinosService.saveTreinoExecution({
        sessionId: operationalSession.id,
        items: operationalSession.items,
        notes: operationalSession.notes || undefined,
        markCompleted,
      });
      setOperationalSession(saved);
      showNotification(
        markCompleted ? 'Treino concluido para a aluna.' : 'Execucao atualizada.',
        'success',
      );
      await reloadData();
      if (markCompleted) {
        closeOperationalModal();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar a execucao do treino.';
      showNotification(message, 'error');
    } finally {
      setOperationalSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-transparent"><Loader2 className="animate-spin text-sky-400" size={46} /></div>;
  }

  return (
    <div className="min-h-screen space-y-8 bg-transparent p-6 text-white md:p-8">
      <section className="relative overflow-hidden rounded-[34px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))] p-6 shadow-[0_36px_120px_-60px_rgba(14,165,233,0.38)] md:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300"><Sparkles size={14} />Modulo de treinos</div>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-white md:text-5xl">Rotinas semanais claras, treinos organizados e execucao acompanhada</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">Monte a rotina da aluna, distribua os treinos com seguranca e acompanhe a execucao da equipe e do painel da aluna no mesmo fluxo.</p>
          </div>
          {canManageRecords && (
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
              <HeroButton filled onClick={openNewTrainingPlanModal} title="Nova rotina semanal" description="Defina a frequencia e as alunas que participam dessa estrutura." icon={<Layers3 size={18} />} />
              <HeroButton onClick={openNewTreinoModal} title="Novo treino" description="Cadastre exercicios e entregue pela rotina ou por alunas especificas." icon={<Plus size={18} />} />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <MetricCard label="Treinos ativos" value={String(metrics.totalTreinos)} description="Biblioteca atual de treinos visiveis." accent="bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent" icon={<Dumbbell size={22} />} />
        <MetricCard label="Rotinas semanais" value={String(metrics.totalPlans)} description="Rotinas organizadas por frequencia semanal." accent="bg-gradient-to-r from-violet-500/90 via-violet-400/70 to-transparent" icon={<Layers3 size={22} />} />
        <MetricCard label="Vinculos" value={String(metrics.assignments)} description="Alunas ligadas aos treinos neste momento." accent="bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent" icon={<Users size={22} />} />
        <MetricCard label="Concluidos no mes" value={String(metrics.completions)} description="Marcacoes registradas no mes atual." accent="bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent" icon={<CheckCircle2 size={22} />} />
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-sky-400" size={20} />
        <input type="text" placeholder="Buscar treino, aluna ou rotina..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-12 py-3 text-white transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
      </div>

      {canManageRecords ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { key: 'rotinas', label: 'Rotinas semanais', helper: 'Frequencia, participantes e proposta da rotina.' },
            { key: 'treinos', label: 'Biblioteca de treinos', helper: 'Lista compacta com detalhes so quando abrir.' },
            { key: 'alunos', label: 'Alunas com treinos', helper: 'Abra a ficha da aluna e acompanhe exercicio por exercicio.' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePanel(item.key as 'rotinas' | 'treinos' | 'alunos')}
              className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                activePanel === item.key
                  ? 'border-sky-500/25 bg-sky-500/10 text-white'
                  : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <p className="text-sm font-bold">{item.label}</p>
              <p className={`mt-2 text-xs leading-5 ${activePanel === item.key ? 'text-sky-100/80' : 'text-zinc-500'}`}>
                {item.helper}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {canManageRecords && activePanel === 'rotinas' && (
        <section className="space-y-5">
          <SectionTitle eyebrow="Rotinas" title="Rotinas semanais por frequencia" description="Monte rotinas 2x, 3x, 5x ou qualquer nova frequencia e vincule as alunas corretas a essa estrutura." />
          {trainingPlans.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-zinc-800 bg-black/25 px-6 py-7 text-sm text-zinc-500">
              Nenhuma rotina semanal criada ainda.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
              {trainingPlans.map((plan) => (
                <div key={plan.id} className="border-b border-zinc-800 last:border-b-0">
                  <TrainingPlanCard
                    plan={plan}
                    onOpen={setSelectedTrainingPlanView}
                    onEdit={startTrainingPlanEdit}
                    onAssignStudents={openPlanStudentsModal}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(!canManageRecords || activePanel === 'treinos') && (
      <section className="space-y-5">
        <SectionTitle eyebrow="Treinos" title="Biblioteca e distribuicao" description="Cada treino pode ser entregue por rotina semanal ou por vinculacao direta, com detalhes completos apenas ao abrir." />
        {treinos.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-zinc-800 bg-black/25 px-6 py-7 text-sm text-zinc-500">
            Nenhum treino cadastrado no momento.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            {treinos.map((treino) => (
              <div key={treino.id} className="border-b border-zinc-800 last:border-b-0">
                <TreinoCard treino={treino} canManageRecords={canManageRecords} onView={viewTreino} onEdit={startTreinoEdit} />
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {canManageRecords && activePanel === 'alunos' ? (
        <section className="space-y-5">
          <SectionTitle eyebrow="Operacao" title="Alunas com treinos vinculados" description="Pesquise a aluna, abra a ficha dela e acompanhe a execucao do treino sem sair do modulo." />

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-sky-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar aluna por nome ou e-mail..."
              value={studentWorkoutSearchTerm}
              onChange={(e) => setStudentWorkoutSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-12 py-3 text-white transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          {studentsWithTreinos.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-zinc-800 bg-black/25 px-6 py-7 text-sm text-zinc-500">
              Nenhuma aluna com treino vinculado foi encontrada com o filtro atual.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
              {studentsWithTreinos.map((entry) => (
                <button
                  key={entry.student.id}
                  type="button"
                  onClick={() => setSelectedStudentView(entry.student)}
                  className="grid w-full gap-4 border-b border-zinc-800 px-4 py-4 text-left transition-all hover:bg-zinc-900/70 last:border-b-0 lg:grid-cols-[minmax(0,2fr)_110px_110px_auto] lg:items-center lg:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">{entry.student.name}</p>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {entry.student.email || 'Sem e-mail informado'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Treinos</p>
                    <p className="mt-1 text-sm font-bold text-white">{entry.treinos.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Hoje</p>
                    <p className="mt-1 text-sm font-bold text-white">{entry.completedTodayCount}</p>
                  </div>
                  <div className="flex justify-start lg:justify-end">
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300">
                      <PlayCircle size={16} />
                      Abrir ficha
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}
      <AnimatePresence>
        {showTrainingPlanModal && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeTrainingPlanModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-zinc-800 bg-zinc-950 p-4 shadow-2xl sm:p-5 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <SectionTitle eyebrow={editingTrainingPlan ? 'Editar rotina' : 'Nova rotina'} title={editingTrainingPlan ? editingTrainingPlan.name : 'Rotina semanal'} description="Defina a frequencia da semana, a proposta da rotina e as orientacoes gerais da equipe." />
                </div>
                <CloseModalButton onClick={closeTrainingPlanModal} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); void handleSaveTrainingPlan(); }} className="mt-5 space-y-5 sm:mt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <input value={newTrainingPlan.name} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Nome da rotina semanal" />
                    <FieldHint>Use um nome simples para identificar essa estrutura, como 3x iniciantes ou 5x hipertrofia.</FieldHint>
                  </div>
                  <div>
                    <input type="number" min="1" max="7" value={newTrainingPlan.weekly_frequency} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, weekly_frequency: Number(e.target.value) || 1 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Frequencia semanal" />
                    <FieldHint>Informe quantos dias na semana essa rotina cobre. Se criar uma rotina 4x, ela sera reconhecida normalmente.</FieldHint>
                  </div>
                  <div>
                    <input value={newTrainingPlan.objective} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, objective: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Objetivo da rotina" />
                    <FieldHint>Exemplo: adaptacao, emagrecimento, hipertrofia, retorno gradual.</FieldHint>
                  </div>
                  <div>
                    <select value={newTrainingPlan.level} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, level: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                      <option value="iniciante">Iniciante</option>
                      <option value="intermediario">Intermediario</option>
                      <option value="avancado">Avancado</option>
                    </select>
                    <FieldHint>Nivel geral das alunas que costumam seguir essa rotina.</FieldHint>
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" min="1" max="52" value={newTrainingPlan.duration_weeks} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, duration_weeks: Number(e.target.value) || 1 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Duracao em semanas" />
                    <FieldHint>Use a duracao como referencia de revisao da rotina, nao como bloqueio tecnico.</FieldHint>
                  </div>
                </div>
                <div>
                  <textarea rows={4} value={newTrainingPlan.description} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, description: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Descricao geral da rotina" />
                  <FieldHint>Descreva a ideia central da rotina. Esse resumo aparece na lista e ajuda a equipe a identificar a estrutura certa.</FieldHint>
                </div>
                <div>
                  <textarea rows={3} value={newTrainingPlan.coach_notes} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, coach_notes: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Orientacoes do treinador" />
                  <FieldHint>Use esse campo para explicar observacoes gerais da rotina para a equipe e para futuras revisoes.</FieldHint>
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button type="button" onClick={closeTrainingPlanModal} className="w-full flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700">Cancelar</button>
                  <button type="submit" className="w-full flex-1 rounded-2xl bg-sky-500 px-4 py-4 font-bold text-black transition-all hover:bg-sky-400">{editingTrainingPlan ? 'Salvar alteracoes' : 'Salvar rotina'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedTrainingPlanView && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTrainingPlanView(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-3xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle
                  eyebrow="Detalhes da rotina"
                  title={selectedTrainingPlanView.name}
                  description={selectedTrainingPlanView.description || 'Rotina semanal por frequencia, sem geracao automatica de treino.'}
                />
                <CloseModalButton onClick={() => setSelectedTrainingPlanView(null)} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Frequencia</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.weekly_frequency}x/semana</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Versao</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.active_version?.version_number ? `v${selectedTrainingPlanView.active_version.version_number}` : '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Alunas</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.students_count || 0}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Treinos</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.treinos_count || 0}</p></div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Objetivo</p><p className="mt-2 text-sm leading-6 text-white">{selectedTrainingPlanView.active_version?.objective || '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Nivel</p><p className="mt-2 text-sm leading-6 text-white">{selectedTrainingPlanView.active_version?.level || '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duracao</p><p className="mt-2 text-sm leading-6 text-white">{selectedTrainingPlanView.active_version?.duration_weeks ? `${selectedTrainingPlanView.active_version.duration_weeks} semanas` : '-'}</p></div>
              </div>

              {selectedTrainingPlanView.active_version?.coach_notes ? (
                <div className="mt-4 rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Orientacoes</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{selectedTrainingPlanView.active_version.coach_notes}</p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => { setSelectedTrainingPlanView(null); startTrainingPlanEdit(selectedTrainingPlanView); }} className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700">
                  Editar rotina
                </button>
                <button onClick={() => { setSelectedTrainingPlanView(null); openPlanStudentsModal(selectedTrainingPlanView); }} className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black">
                  Vincular alunas
                </button>
                <button onClick={() => setSelectedTrainingPlanView(null)} className="rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-700">
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPlanStudentsModal && selectedPlanForStudents && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlanStudentsModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-3xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Vinculacao" title={selectedPlanForStudents.name} description="Escolha as alunas que participam dessa rotina semanal." />
                <CloseModalButton onClick={() => setShowPlanStudentsModal(false)} />
              </div>
              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    value={planStudentSearchTerm}
                    onChange={(e) => setPlanStudentSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-11 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Pesquisar aluna por nome ou e-mail"
                  />
                </div>

                <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-2">
                {filteredPlanStudents.map((aluno) => {
                  const checked = selectedPlanStudentIds.includes(aluno.id);
                  return (
                    <button key={aluno.id} type="button" onClick={() => togglePlanStudent(aluno.id)} className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all ${checked ? 'border-sky-500/20 bg-sky-500/10 text-white' : 'border-zinc-800 bg-black/25 text-zinc-300 hover:border-zinc-700'}`}>
                      <div>
                        <p className="font-bold">{aluno.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {aluno.email || 'participa da rotina'}
                        </p>
                      </div>
                      {checked ? <CheckCircle2 size={18} className="text-sky-300" /> : <UserCheck size={18} className="text-zinc-500" />}
                    </button>
                  );
                })}
                {filteredPlanStudents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-4 py-6 text-sm text-zinc-500">
                    Nenhuma aluna encontrada com esse nome.
                  </div>
                ) : null}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowPlanStudentsModal(false)} className="flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700">Cancelar</button>
                <button type="button" onClick={() => void handleSavePlanStudents()} className="flex-1 rounded-2xl bg-sky-500 px-4 py-4 font-bold text-black transition-all hover:bg-sky-400">Salvar vinculacao</button>
              </div>
            </motion.div>
          </div>
        )}

        {showAddModal && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-5xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[94vh] overflow-y-auto md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Treino" title={selectedTreino ? 'Editar treino' : 'Novo treino'} description="Cadastre os exercicios, defina o dia da semana e escolha se o treino vai pela rotina semanal ou por vinculacao direta." />
                <CloseModalButton onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); void handleSave(); }} className="mt-6 space-y-6">
                <div className="rounded-[24px] border border-zinc-800 bg-black/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Como preencher</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Primeiro escolha a rotina semanal se esse treino fizer parte de uma estrutura fixa. Depois defina o nome, o bloco do treino, o dia sugerido e monte os exercicios abaixo.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <input value={newTreino.nome || ''} onChange={(e) => setNewTreino((c) => ({ ...c, nome: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Nome do treino" />
                    <FieldHint>Exemplo: treino A superiores, treino de sexta ou gluteos e posterior.</FieldHint>
                  </div>
                  <div>
                    <select value={newTreino.training_plan_id || ''} onChange={(e) => setNewTreino((c) => ({ ...c, training_plan_id: e.target.value, training_plan_version_id: '' }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                      <option value="">Sem rotina semanal especifica</option>
                      {trainingPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.weekly_frequency}x/semana)</option>)}
                    </select>
                    <FieldHint>Se escolher uma rotina, o sistema passa a priorizar automaticamente as alunas vinculadas a ela.</FieldHint>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Bloco sugerido</p>
                    <select
                      value={SPLIT_PRESETS.some((item) => item.value === (newTreino.split_label || '').trim().toUpperCase()) ? (newTreino.split_label || '').trim().toUpperCase() : ''}
                      onChange={(e) => setNewTreino((c) => ({ ...c, split_label: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    >
                      <option value="">Selecionar sugestao</option>
                      {SPLIT_PRESETS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldHint>Use A, B e C quando quiser manter um padrao simples de organizacao.</FieldHint>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Nome livre do bloco</p>
                    <input
                      value={newTreino.split_label || ''}
                      onChange={(e) => setNewTreino((c) => ({ ...c, split_label: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                      placeholder="Ex.: superiores, inferiores, gluteos"
                    />
                    <FieldHint>Se preferir, escreva um nome claro em vez de usar letras.</FieldHint>
                  </div>
                  <div>
                    <select value={newTreino.day_of_week ?? ''} onChange={(e) => setNewTreino((c) => ({ ...c, day_of_week: e.target.value === '' ? null : Number(e.target.value) }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                      <option value="">Sem dia fixo</option>
                      <option value="0">Domingo</option>
                      <option value="1">Segunda</option>
                      <option value="2">Terca</option>
                      <option value="3">Quarta</option>
                      <option value="4">Quinta</option>
                      <option value="5">Sexta</option>
                      <option value="6">Sabado</option>
                    </select>
                    <FieldHint>O painel da aluna usa esse dia para destacar o treino correto.</FieldHint>
                  </div>
                  <div>
                    <input value={newTreino.objetivo || ''} onChange={(e) => setNewTreino((c) => ({ ...c, objetivo: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Objetivo" />
                    <FieldHint>Exemplo: cardio, tecnica, posteriores, hipertrofia de superiores.</FieldHint>
                  </div>
                  <div>
                    <select value={newTreino.nivel || 'iniciante'} onChange={(e) => setNewTreino((c) => ({ ...c, nivel: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                      <option value="iniciante">Iniciante</option>
                      <option value="intermediario">Intermediario</option>
                      <option value="avancado">Avancado</option>
                    </select>
                    <FieldHint>Nivel esperado da aluna para esse treino.</FieldHint>
                  </div>
                  <div>
                    <input type="number" min="1" value={newTreino.duracao_minutos || 60} onChange={(e) => setNewTreino((c) => ({ ...c, duracao_minutos: Number(e.target.value) || 60 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Duracao em minutos" />
                    <FieldHint>Tempo medio total da sessao.</FieldHint>
                  </div>
                  <div>
                    <input type="number" min="0" value={newTreino.sort_order || 0} onChange={(e) => setNewTreino((c) => ({ ...c, sort_order: Number(e.target.value) || 0 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Ordem na rotina" />
                    <FieldHint>Use a ordem para controlar qual treino aparece primeiro dentro da mesma rotina.</FieldHint>
                  </div>
                </div>

                <div>
                  <textarea rows={4} value={newTreino.descricao || ''} onChange={(e) => setNewTreino((c) => ({ ...c, descricao: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Descricao do treino" />
                  <FieldHint>Resumo do foco da sessao e como ela deve ser conduzida.</FieldHint>
                </div>
                <div>
                  <textarea rows={3} value={newTreino.coach_notes || ''} onChange={(e) => setNewTreino((c) => ({ ...c, coach_notes: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Orientacoes do treinador" />
                  <FieldHint>Observacoes internas para execucao, adaptacoes ou pontos de atencao.</FieldHint>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Alunas vinculadas diretamente</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Esse passo e opcional. Se voce escolher uma rotina semanal, a lista abaixo ja passa a priorizar automaticamente as alunas daquela rotina. A mensalidade serve apenas como filtro de apoio.
                      </p>
                    </div>
                    <div className="rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{(newTreino.assigned_student_ids || []).length} selecionados</div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_220px] xl:grid-cols-[minmax(0,1.7fr)_220px_auto]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-black px-11 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                        placeholder="Pesquisar aluna por nome ou e-mail"
                      />
                    </div>

                    <select
                      value={studentPlanFilter}
                      onChange={(e) => setStudentPlanFilter(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    >
                      <option value="">Todas as mensalidades</option>
                      <option value="__sem_plano__">Sem mensalidade</option>
                      {studentPlanOptions.map((planName) => (
                        <option key={planName} value={planName}>
                          {planName}
                        </option>
                        ))}
                      </select>
                    {newTreino.training_plan_id ? (
                      <button
                        type="button"
                        onClick={() => setShowAllStudentsForAssignment((current) => !current)}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                          showAllStudentsForAssignment
                            ? 'border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500 hover:text-black'
                            : 'border-zinc-800 bg-zinc-900 text-white hover:border-zinc-700'
                        }`}
                      >
                        <Filter size={16} />
                        {showAllStudentsForAssignment ? 'Voltar para a rotina' : 'Mostrar todas as alunas'}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{filteredStudentsForAssignment.length} aluna(s) visiveis</span>
                      {newTreino.training_plan_id && !showAllStudentsForAssignment ? (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-300">
                          Prioridade para a rotina selecionada
                        </span>
                      ) : null}
                    </div>
                    {(studentSearchTerm || studentPlanFilter) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSearchTerm('');
                          setStudentPlanFilter('');
                        }}
                        className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-all hover:border-zinc-700"
                      >
                        Limpar filtros
                      </button>
                    ) : null}
                  </div>

                  <div className="grid max-h-[260px] gap-3 overflow-y-auto rounded-[24px] border border-zinc-800 bg-black/20 p-4 md:grid-cols-2">
                    {filteredStudentsForAssignment.map((aluno) => {
                      const checked = (newTreino.assigned_student_ids || []).includes(aluno.id);
                      const isFromRoutine = routineStudentIds.has(aluno.id);
                      return (
                        <button key={aluno.id} type="button" onClick={() => toggleAssignedStudent(aluno.id)} className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${checked ? 'border-sky-500/20 bg-sky-500/10 text-white' : 'border-zinc-800 bg-black/25 text-zinc-300 hover:border-zinc-700'}`}>
                          <div className="min-w-0">
                            <span className="block truncate font-bold">{aluno.name}</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                 {aluno.plan_name || 'Sem mensalidade'}
                              </span>
                              {aluno.status ? (
                                <span className="rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                  {aluno.status}
                                </span>
                              ) : null}
                              {newTreino.training_plan_id && isFromRoutine ? (
                                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300">
                                  Da rotina
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {checked ? <CheckCircle2 size={16} className="mt-1 shrink-0 text-sky-300" /> : <Users size={16} className="mt-1 shrink-0 text-zinc-500" />}
                        </button>
                      );
                    })}
                    {filteredStudentsForAssignment.length === 0 ? (
                      <div className="md:col-span-2 rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-4 py-5 text-sm text-zinc-500">
                        Nenhuma aluna encontrada com os filtros atuais.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-zinc-800 bg-black/20 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Alunas pela rotina
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {newTreino.training_plan_id
                        ? 'Essas alunas receberao o treino automaticamente por estarem vinculadas a rotina semanal selecionada.'
                        : 'Selecione uma rotina semanal para enxergar quem recebera esse treino automaticamente.'}
                    </p>

                    {newTreino.training_plan_id ? (
                      planLinkedStudentsPreview.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {planLinkedStudentsPreview.map((student) => (
                            <span
                              key={`plan-preview-${student.id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300"
                            >
                              <UserCheck size={12} />
                              {student.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-4 py-4 text-sm text-zinc-500">
                          Nenhuma aluna ativa encontrada nesta rotina.
                        </div>
                      )
                    ) : null}
                  </div>

                  <div className="rounded-[24px] border border-zinc-800 bg-black/20 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Distribuicao final
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      O treino pode ser entregue por plano, por vinculacao direta ou pelos dois caminhos.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Pela rotina
                        </p>
                        <p className="mt-2 text-xl font-bold text-white">{planLinkedStudentsPreview.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Vinculo direto
                        </p>
                        <p className="mt-2 text-xl font-bold text-white">
                          {(newTreino.assigned_student_ids || []).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[24px] border border-zinc-800 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Exercicios</p>
                      <p className="mt-1 text-sm text-zinc-500">Monte a estrutura manualmente ou busque nomes prontos na biblioteca oficial.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={openExerciseLibraryModal} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700">
                        <Search size={16} />
                        Biblioteca oficial
                      </button>
                      <button type="button" onClick={addExercicio} className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black"><Plus size={16} />Adicionar</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {(newTreino.exercicios || []).map((exercicio, index) => (
                      <div key={`${index}-${exercicio.nome}`} className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <input value={exercicio.nome} onChange={(e) => updateExercicio(index, 'nome', e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 md:col-span-2" placeholder="Nome do exercicio" />
                          <input value={exercicio.grupo_muscular || ''} onChange={(e) => updateExercicio(index, 'grupo_muscular', e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Grupo muscular" />
                          <input type="number" min="1" value={exercicio.series} onChange={(e) => updateExercicio(index, 'series', Number(e.target.value) || 1)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Series" />
                          <input value={exercicio.repeticoes} onChange={(e) => updateExercicio(index, 'repeticoes', e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Repeticoes" />
                          <input value={exercicio.carga || ''} onChange={(e) => updateExercicio(index, 'carga', e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Carga" />
                          <input value={exercicio.descanso || ''} onChange={(e) => updateExercicio(index, 'descanso', e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Descanso" />
                          <input value={exercicio.observacoes || ''} onChange={(e) => updateExercicio(index, 'observacoes', e.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 md:col-span-2" placeholder="Observacoes" />
                          <button type="button" onClick={() => removeExercicio(index)} className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500 hover:text-black">Remover</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700">Cancelar</button>
                  <button type="submit" className="flex-1 rounded-2xl bg-sky-500 px-4 py-4 font-bold text-black transition-all hover:bg-sky-400">Salvar treino</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showExerciseLibraryModal && canManageRecords && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeExerciseLibraryModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-5xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[94vh] overflow-y-auto md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Biblioteca oficial" title="Buscar exercicios prontos" description="A busca aceita nomes em portugues, consulta a biblioteca gratuita do wger e retorna nomes mais amigaveis para a equipe." />
                <CloseModalButton onClick={closeExerciseLibraryModal} />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSearchExerciseLibrary();
                }}
                className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    value={exerciseLibraryQuery}
                    onChange={(event) => setExerciseLibraryQuery(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-11 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Ex.: rosca, agachamento, remada, supino"
                  />
                </div>
                <button type="submit" disabled={exerciseLibraryLoading} className="rounded-2xl bg-sky-500 px-4 py-3 font-bold text-black transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {exerciseLibraryLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded-full border border-zinc-800 px-3 py-1">Powered by wger</span>
                <span className="rounded-full border border-zinc-800 px-3 py-1">Busca com nome + video oficial</span>
              </div>

              {exerciseLibraryError ? (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
                  {exerciseLibraryError}
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                {exerciseLibraryResults.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
                    {exerciseLibraryLoading
                      ? 'Consultando a biblioteca oficial...'
                      : 'Busque um exercicio para carregar sugestoes prontas da biblioteca oficial.'}
                  </div>
                ) : (
                  exerciseLibraryResults.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-zinc-800 bg-black/20 p-4">
                      <div className="space-y-4">
                        <p className="text-lg font-bold text-white">{item.display_name}</p>

                        {item.stream_path ? (
                          <div className="overflow-hidden rounded-[22px] border border-zinc-800 bg-black">
                            <video
                              controls
                              muted
                              playsInline
                              preload="metadata"
                              className="aspect-video w-full bg-black object-contain"
                            >
                              <source src={item.stream_path} />
                              Seu navegador nao conseguiu abrir o video oficial deste exercicio.
                            </video>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {item.stream_path ? (
                            <button
                              type="button"
                              onClick={() => openExercisePreviewModal(item)}
                              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700"
                            >
                              Ver video
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => addExerciseFromLibrary(item)}
                            className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black"
                          >
                            Adicionar ao treino
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {selectedExercisePreview && canManageRecords && (
          <ExerciseOfficialPreviewModal
            item={selectedExercisePreview}
            onClose={closeExercisePreviewModal}
            primaryActionLabel="Adicionar ao treino"
            onPrimaryAction={() => addExerciseFromLibrary(selectedExercisePreview)}
          />
        )}

        {showViewModal && selectedTreino && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowViewModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-4xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[94vh] overflow-y-auto md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Detalhes do treino" title={selectedTreino.nome} description={selectedTreino.training_plan?.name ? `Rotina: ${selectedTreino.training_plan.name}` : 'Treino com vinculacao direta para alunas especificas.'} />
                <CloseModalButton onClick={() => setShowViewModal(false)} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Objetivo</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.objetivo || '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Nivel</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.nivel || '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duracao</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.duracao_minutos || 0} min</p></div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Bloco do treino</p><p className="mt-2 text-lg font-bold text-white">{getSplitDisplayLabel(selectedTreino.split_label)}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Dia sugerido</p><p className="mt-2 text-lg font-bold text-white">{formatTrainingDay(selectedTreino.day_of_week)}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Versao</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.training_plan_version?.version_number ? `v${selectedTreino.training_plan_version.version_number}` : '-'}</p></div>
              </div>
              {selectedTreino.coach_notes && (
                <div className="mt-4 rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Orientacoes</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{selectedTreino.coach_notes}</p>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <SectionTitle eyebrow="Alunas ligadas" title="Distribuicao atual" description="Cada aluna pode concluir o treino por conta propria ou a equipe pode registrar a execucao dentro deste modulo." />
                {(selectedTreino.assigned_students || []).length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">Este treino ainda nao foi vinculado a nenhuma aluna nem a uma rotina com participantes ativos.</div>
                ) : (
                  <div className="grid gap-3">
                    {(selectedTreino.assigned_students || []).map((student) => (
                      <div key={`${selectedTreino.id}-${student.id}`} className="flex flex-col gap-4 rounded-[24px] border border-zinc-800 bg-black/25 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">origem: {student.assignment_source === 'plan' ? 'rotina' : student.assignment_source === 'direct' ? 'vinculo direto' : 'legado'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {student.completed_today ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300"><CheckCircle2 size={14} />Concluido hoje</span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500"><Calendar size={14} />Ainda nao concluido</span>
                          )}
                          {canManageRecords && (
                            <>
                              <button
                                onClick={() => {
                                  const studentDetails = alunos.find((item) => item.id === student.id) || {
                                    id: student.id,
                                    name: student.name,
                                    email: null,
                                    plan_id: null,
                                    plan_name: null,
                                    status: null,
                                  };
                                  setShowViewModal(false);
                                  setSelectedStudentView(studentDetails);
                                }}
                                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700"
                              >
                                Abrir ficha
                              </button>
                              <button onClick={() => void handleCompletionToggle(selectedTreino.id, student.id, !student.completed_today)} className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${student.completed_today ? 'border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-black' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black'}`}>
                                {student.completed_today ? 'Remover conclusao' : 'Marcar concluido'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <SectionTitle eyebrow="Estrutura" title="Exercicios do treino" description="Sequencia montada manualmente para execucao da aluna." />
                <div className="grid gap-4">
                  {(selectedTreino.exercicios || []).map((exercicio, index) => (
                    <div key={`${selectedTreino.id}-${index}`} className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-white">{exercicio.nome}</p>
                            {exercicio.biblioteca_tem_demonstracao ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                Guia visual
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-zinc-500">{exercicio.observacoes || 'Sem observacoes adicionais.'}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Series</p><p className="mt-2 text-lg font-bold text-white">{exercicio.series}</p></div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Repeticoes</p><p className="mt-2 text-lg font-bold text-white">{exercicio.repeticoes}</p></div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Carga</p><p className="mt-2 text-lg font-bold text-white">{exercicio.carga || '-'}</p></div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Descanso</p><p className="mt-2 text-lg font-bold text-white">{exercicio.descanso || '-'}</p></div>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            void openExercisePreviewByName(
                              exercicio.nome,
                              exercicio.biblioteca_referencia || exercicio.biblioteca_titulo || null,
                              `${selectedTreino.id}-${index}`,
                            )
                          }
                          disabled={exercisePreviewLoadingName === `${selectedTreino.id}-${index}`}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {exercisePreviewLoadingName === `${selectedTreino.id}-${index}` ? 'Buscando...' : 'Como executar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedStudentView && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedStudentView(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-5xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[94vh] overflow-y-auto md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Ficha da aluna" title={selectedStudentView.name} description={selectedStudentView.email || 'Abra um treino abaixo para acompanhar a execucao exercicio por exercicio.'} />
                <CloseModalButton onClick={() => setSelectedStudentView(null)} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Treinos vinculados</p>
                  <p className="mt-2 text-2xl font-bold text-white">{selectedStudentTreinos.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Mensalidade atual</p>
                  <p className="mt-2 text-lg font-bold text-white">{selectedStudentView.plan_name || 'Sem mensalidade'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Status</p>
                  <p className="mt-2 text-lg font-bold text-white">{selectedStudentView.status || 'ativo'}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <SectionTitle eyebrow="Treinos da aluna" title="Lista operacional" description="Abra os detalhes do treino ou registre a execucao completa exercicio por exercicio." />
                {selectedStudentTreinos.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
                    Nenhum treino vinculado a esta aluna no momento.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70">
                    {selectedStudentTreinos.map((treino) => {
                      const assignedStudent = (treino.assigned_students || []).find((student) => student.id === selectedStudentView.id);

                      return (
                        <div key={`${selectedStudentView.id}-${treino.id}`} className="grid gap-4 border-b border-zinc-800 px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto] lg:items-center lg:px-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-base font-bold text-white">{treino.nome}</p>
                              {treino.training_plan?.name ? (
                                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-300">
                                  {treino.training_plan.name}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                              {treino.split_label ? (
                                <span className="rounded-full border border-orange-500/20 px-2.5 py-1 text-orange-300">
                                  {getSplitDisplayLabel(treino.split_label)}
                                </span>
                              ) : null}
                              {treino.day_of_week != null ? (
                                <span className="rounded-full border border-zinc-800 px-2.5 py-1">
                                  {formatTrainingDay(treino.day_of_week)}
                                </span>
                              ) : null}
                              {assignedStudent?.completed_today ? (
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                                  Concluido hoje
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-zinc-500">
                              {treino.descricao || treino.objetivo || 'Sem resumo adicional para este treino.'}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Exercicios</p>
                              <p className="mt-2 text-lg font-bold text-white">{treino.exercicios?.length || 0}</p>
                            </div>
                            <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Objetivo</p>
                              <p className="mt-2 text-sm font-bold text-white">{treino.objetivo || '-'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 lg:justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentView(null);
                                viewTreino(treino);
                              }}
                              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700"
                            >
                              Ver treino
                            </button>
                            <button
                              type="button"
                              onClick={() => void openStudentExecution(selectedStudentView, treino)}
                              className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black"
                            >
                              Abrir execucao
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {operationalSession && operationalTreino && operationalStudent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeOperationalModal} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-6xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[94vh] overflow-y-auto md:p-8">
              <div className="flex items-start justify-between gap-4">
                <SectionTitle eyebrow="Execucao assistida" title={`${operationalStudent.name} - ${operationalTreino.nome}`} description="Registre a execucao exercicio por exercicio. O painel da aluna reflete essa mesma sessao." />
                <CloseModalButton onClick={closeOperationalModal} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Data da execucao</p>
                  <p className="mt-2 text-lg font-bold text-white">{formatDatePtBr(operationalSession.execution_date)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Status</p>
                  <p className="mt-2 text-lg font-bold text-white">{operationalSession.status === 'completed' ? 'Concluido' : 'Em andamento'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Exercicios</p>
                  <p className="mt-2 text-lg font-bold text-white">{operationalSession.items.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Rotina</p>
                  <p className="mt-2 text-sm font-bold text-white">{operationalTreino.training_plan?.name || 'Vinculo direto'}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <SectionTitle eyebrow="Exercicios" title="Acompanhamento detalhado" description="Atualize series, repeticoes, carga e observacoes conforme a execucao real da aluna." />
                <div className="space-y-4">
                  {operationalSession.items.map((item, index) => (
                    <div key={`${operationalSession.id}-${item.exercise_index}`} className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-white">{item.exercise_name}</p>
                            {operationalTreino.exercicios?.[index]?.biblioteca_tem_demonstracao ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                                Guia visual
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                            {item.planned_sets ? <span className="rounded-full border border-zinc-800 px-2.5 py-1">{item.planned_sets} series</span> : null}
                            {item.planned_reps ? <span className="rounded-full border border-zinc-800 px-2.5 py-1">{item.planned_reps}</span> : null}
                            {item.planned_load ? <span className="rounded-full border border-zinc-800 px-2.5 py-1">{item.planned_load}</span> : null}
                            {item.planned_rest ? <span className="rounded-full border border-zinc-800 px-2.5 py-1">{item.planned_rest}</span> : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateOperationalExecutionItem(index, 'completed', !item.completed)}
                          className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${item.completed ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black' : 'border border-zinc-800 bg-zinc-900 text-white hover:border-zinc-700'}`}
                        >
                          {item.completed ? 'Exercicio concluido' : 'Marcar exercicio'}
                        </button>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            void openExercisePreviewByName(
                              item.exercise_name,
                              operationalTreino.exercicios?.[index]?.biblioteca_referencia ||
                                operationalTreino.exercicios?.[index]?.biblioteca_titulo ||
                                null,
                              `${operationalSession.id}-${item.exercise_index}`,
                            )
                          }
                          disabled={exercisePreviewLoadingName === `${operationalSession.id}-${item.exercise_index}`}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {exercisePreviewLoadingName === `${operationalSession.id}-${item.exercise_index}` ? 'Buscando...' : 'Como executar'}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                        <input
                          type="number"
                          min="0"
                          value={item.performed_sets ?? ''}
                          onChange={(e) => updateOperationalExecutionItem(index, 'performed_sets', e.target.value === '' ? null : Number(e.target.value))}
                          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                          placeholder="Series feitas"
                        />
                        <input
                          value={item.performed_reps ?? ''}
                          onChange={(e) => updateOperationalExecutionItem(index, 'performed_reps', e.target.value)}
                          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                          placeholder="Repeticoes feitas"
                        />
                        <input
                          value={item.performed_load ?? ''}
                          onChange={(e) => updateOperationalExecutionItem(index, 'performed_load', e.target.value)}
                          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                          placeholder="Carga usada"
                        />
                        <input
                          value={item.notes ?? ''}
                          onChange={(e) => updateOperationalExecutionItem(index, 'notes', e.target.value)}
                          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 xl:col-span-1"
                          placeholder="Observacoes do exercicio"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <textarea
                  rows={3}
                  value={operationalSession.notes || ''}
                  onChange={(e) =>
                    setOperationalSession((current) =>
                      current ? { ...current, notes: e.target.value } : current,
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  placeholder="Observacoes gerais da execucao"
                />
                <FieldHint>Use este campo para registrar como a sessao aconteceu no dia.</FieldHint>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={closeOperationalModal} className="flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700">Fechar</button>
                <button type="button" disabled={operationalSaving} onClick={() => void saveOperationalExecution(false)} className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 font-bold text-white transition-all hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {operationalSaving ? 'Salvando...' : 'Salvar progresso'}
                </button>
                <button type="button" disabled={operationalSaving} onClick={() => void saveOperationalExecution(true)} className="flex-1 rounded-2xl bg-sky-500 px-4 py-4 font-bold text-black transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                  {operationalSaving ? 'Finalizando...' : 'Concluir treino'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toast notification={notification} onClose={clearNotification} />
    </div>
  );
}
