'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  Eye,
  Layers3,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTreinos } from '@/hooks/useTreinos';
import { useUserRole } from '@/hooks/useUserRole';
import { Toast } from '@/components/ui';
import { formatDatePtBr } from '@/lib/date';
import { formatTrainingDay } from '@/lib/training';
import type { TrainingPlan, Treino } from '@/types/treino';

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
          {plan.active_version?.objective || plan.description || 'Plano de treino sem objetivo detalhado.'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Versao</p>
        <p className="mt-1 text-sm font-bold text-white">
          {plan.active_version?.version_number ? `v${plan.active_version.version_number}` : '-'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Alunos</p>
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
          Vincular
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
              Direto
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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Alunos</p>
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
  const [selectedTrainingPlanView, setSelectedTrainingPlanView] = useState<TrainingPlan | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentPlanFilter, setStudentPlanFilter] = useState('');
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
    }
  }, [showAddModal]);

  const studentPlanOptions = useMemo(() => {
    return Array.from(
      new Set(
        alunos
          .map((aluno) => aluno.plan_name?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [alunos]);

  const filteredStudentsForAssignment = useMemo(() => {
    const needle = studentSearchTerm.trim().toLowerCase();
    const selectedIds = new Set(newTreino.assigned_student_ids || []);

    return alunos
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
  }, [alunos, newTreino.assigned_student_ids, studentPlanFilter, studentSearchTerm]);

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
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300"><Sparkles size={14} />Sistema de treinos</div>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-white md:text-5xl">Planos reutilizaveis, vinculos claros e progresso mensal</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">Crie treinos manualmente, vincule por plano ou por aluno e acompanhe conclusoes sem geracao automatica.</p>
          </div>
          {canManageRecords && (
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
              <HeroButton filled onClick={openNewTrainingPlanModal} title="Novo plano de treino" description="Organize frequencia semanal e alunos vinculados." icon={<Layers3 size={18} />} />
              <HeroButton onClick={openNewTreinoModal} title="Novo treino" description="Crie e distribua por plano ou por alunos diretos." icon={<Plus size={18} />} />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <MetricCard label="Treinos ativos" value={String(metrics.totalTreinos)} description="Biblioteca atual de treinos visiveis." accent="bg-gradient-to-r from-sky-500/90 via-sky-400/70 to-transparent" icon={<Dumbbell size={22} />} />
        <MetricCard label="Planos de treino" value={String(metrics.totalPlans)} description="Planos organizados por frequencia semanal." accent="bg-gradient-to-r from-violet-500/90 via-violet-400/70 to-transparent" icon={<Layers3 size={22} />} />
        <MetricCard label="Vinculos" value={String(metrics.assignments)} description="Alunos ligados aos treinos neste momento." accent="bg-gradient-to-r from-orange-500/90 via-orange-400/70 to-transparent" icon={<Users size={22} />} />
        <MetricCard label="Concluidos no mes" value={String(metrics.completions)} description="Marcacoes registradas no mes atual." accent="bg-gradient-to-r from-emerald-500/90 via-emerald-400/70 to-transparent" icon={<CheckCircle2 size={22} />} />
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-sky-400" size={20} />
        <input type="text" placeholder="Buscar treino, aluno ou plano..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-12 py-3 text-white transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
      </div>

      {canManageRecords && (
        <section className="space-y-5">
          <SectionTitle eyebrow="Planos" title="Planos de treino por frequencia" description="Monte planos 2x, 3x, 5x por semana e vincule varios alunos ao mesmo conjunto de treinos." />
          {trainingPlans.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-zinc-800 bg-black/25 px-6 py-7 text-sm text-zinc-500">
              Nenhum plano de treino criado ainda.
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

      <section className="space-y-5">
        <SectionTitle eyebrow="Treinos" title="Biblioteca e distribuicao" description="Cada treino pode ser individual, compartilhado por plano ou vinculado diretamente a varios alunos." />
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
      <AnimatePresence>
        {showTrainingPlanModal && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeTrainingPlanModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-2xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
              <SectionTitle eyebrow={editingTrainingPlan ? 'Editar plano' : 'Novo plano'} title={editingTrainingPlan ? editingTrainingPlan.name : 'Plano de treino'} description="Defina nome, frequencia semanal e proposta do plano." />
              <form onSubmit={(e) => { e.preventDefault(); void handleSaveTrainingPlan(); }} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={newTrainingPlan.name} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, name: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Nome do plano" />
                  <input type="number" min="1" max="7" value={newTrainingPlan.weekly_frequency} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, weekly_frequency: Number(e.target.value) || 1 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Frequencia semanal" />
                  <input value={newTrainingPlan.objective} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, objective: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Objetivo do plano" />
                  <select value={newTrainingPlan.level} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, level: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediario</option>
                    <option value="avancado">Avancado</option>
                  </select>
                  <input type="number" min="1" max="52" value={newTrainingPlan.duration_weeks} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, duration_weeks: Number(e.target.value) || 1 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Duracao em semanas" />
                </div>
                <textarea rows={4} value={newTrainingPlan.description} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, description: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Descricao do plano" />
                <textarea rows={3} value={newTrainingPlan.coach_notes} onChange={(e) => setNewTrainingPlan((c) => ({ ...c, coach_notes: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Orientacoes do treinador" />
                <div className="flex gap-3">
                  <button type="button" onClick={closeTrainingPlanModal} className="flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700">Cancelar</button>
                  <button type="submit" className="flex-1 rounded-2xl bg-sky-500 px-4 py-4 font-bold text-black transition-all hover:bg-sky-400">{editingTrainingPlan ? 'Salvar alteracoes' : 'Salvar plano'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedTrainingPlanView && canManageRecords && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTrainingPlanView(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-3xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
              <SectionTitle
                eyebrow="Detalhes do plano"
                title={selectedTrainingPlanView.name}
                description={selectedTrainingPlanView.description || 'Plano por frequencia semanal sem geracao automatica de treino.'}
              />

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Frequencia</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.weekly_frequency}x/semana</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Versao</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.active_version?.version_number ? `v${selectedTrainingPlanView.active_version.version_number}` : '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Alunos</p><p className="mt-2 text-lg font-bold text-white">{selectedTrainingPlanView.students_count || 0}</p></div>
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
                  Editar plano
                </button>
                <button onClick={() => { setSelectedTrainingPlanView(null); openPlanStudentsModal(selectedTrainingPlanView); }} className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black">
                  Vincular alunos
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
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-3xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
              <SectionTitle eyebrow="Vinculacao" title={selectedPlanForStudents.name} description="Escolha os alunos que participam deste plano de treino." />
              <div className="mt-6 grid max-h-[420px] gap-3 overflow-y-auto pr-2">
                {alunos.map((aluno) => {
                  const checked = selectedPlanStudentIds.includes(aluno.id);
                  return (
                    <button key={aluno.id} type="button" onClick={() => togglePlanStudent(aluno.id)} className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all ${checked ? 'border-sky-500/20 bg-sky-500/10 text-white' : 'border-zinc-800 bg-black/25 text-zinc-300 hover:border-zinc-700'}`}>
                      <div>
                        <p className="font-bold">{aluno.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">aluno do plano</p>
                      </div>
                      {checked ? <CheckCircle2 size={18} className="text-sky-300" /> : <UserCheck size={18} className="text-zinc-500" />}
                    </button>
                  );
                })}
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
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-5xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
              <SectionTitle eyebrow="Treino" title={selectedTreino ? 'Editar treino' : 'Novo treino'} description="Monte o treino manualmente e vincule por plano ou por alunos diretos." />
              <form onSubmit={(e) => { e.preventDefault(); void handleSave(); }} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={newTreino.nome || ''} onChange={(e) => setNewTreino((c) => ({ ...c, nome: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Nome do treino" />
                  <select value={newTreino.training_plan_id || ''} onChange={(e) => setNewTreino((c) => ({ ...c, training_plan_id: e.target.value, training_plan_version_id: '' }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                    <option value="">Sem plano especifico</option>
                    {trainingPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.weekly_frequency}x/semana)</option>)}
                  </select>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Split pronto</p>
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
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Entrada livre</p>
                    <input
                      value={newTreino.split_label || ''}
                      onChange={(e) => setNewTreino((c) => ({ ...c, split_label: e.target.value }))}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                      placeholder="Ex.: superiores / inferiores"
                    />
                  </div>
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
                  <input value={newTreino.objetivo || ''} onChange={(e) => setNewTreino((c) => ({ ...c, objetivo: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Objetivo" />
                  <select value={newTreino.nivel || 'iniciante'} onChange={(e) => setNewTreino((c) => ({ ...c, nivel: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediario</option>
                    <option value="avancado">Avancado</option>
                  </select>
                  <input type="number" min="1" value={newTreino.duracao_minutos || 60} onChange={(e) => setNewTreino((c) => ({ ...c, duracao_minutos: Number(e.target.value) || 60 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Duracao em minutos" />
                  <input type="number" min="0" value={newTreino.sort_order || 0} onChange={(e) => setNewTreino((c) => ({ ...c, sort_order: Number(e.target.value) || 0 }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Ordem no plano" />
                </div>

                <textarea rows={4} value={newTreino.descricao || ''} onChange={(e) => setNewTreino((c) => ({ ...c, descricao: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Descricao do treino" />
                <textarea rows={3} value={newTreino.coach_notes || ''} onChange={(e) => setNewTreino((c) => ({ ...c, coach_notes: e.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30" placeholder="Orientacoes do treinador" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Alunos vinculados diretamente</p>
                      <p className="mt-1 text-sm text-zinc-500">Opcional. Pesquise por nome ou filtre por plano para selecionar mais rapido.</p>
                    </div>
                    <div className="rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{(newTreino.assigned_student_ids || []).length} selecionados</div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_220px]">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                      <input
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-800 bg-black px-11 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                        placeholder="Pesquisar aluno por nome ou e-mail"
                      />
                    </div>

                    <select
                      value={studentPlanFilter}
                      onChange={(e) => setStudentPlanFilter(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    >
                      <option value="">Todos os planos</option>
                      <option value="__sem_plano__">Sem plano</option>
                      {studentPlanOptions.map((planName) => (
                        <option key={planName} value={planName}>
                          {planName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
                    <span>{filteredStudentsForAssignment.length} aluno(s) encontrados</span>
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
                      return (
                        <button key={aluno.id} type="button" onClick={() => toggleAssignedStudent(aluno.id)} className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${checked ? 'border-sky-500/20 bg-sky-500/10 text-white' : 'border-zinc-800 bg-black/25 text-zinc-300 hover:border-zinc-700'}`}>
                          <div className="min-w-0">
                            <span className="block truncate font-bold">{aluno.name}</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                {aluno.plan_name || 'Sem plano'}
                              </span>
                              {aluno.status ? (
                                <span className="rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                  {aluno.status}
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
                        Nenhum aluno encontrado com os filtros atuais.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-zinc-800 bg-black/20 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Alunos pelo plano
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {newTreino.training_plan_id
                        ? 'Esses alunos receberao o treino automaticamente por estarem no plano selecionado.'
                        : 'Selecione um plano de treino para enxergar os alunos vinculados automaticamente.'}
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
                          Nenhum aluno ativo encontrado neste plano.
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
                          Pelo plano
                        </p>
                        <p className="mt-2 text-xl font-bold text-white">{planLinkedStudentsPreview.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Direto
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
                      <p className="mt-1 text-sm text-zinc-500">Monte a estrutura manual do treino.</p>
                    </div>
                    <button type="button" onClick={addExercicio} className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-300 transition-all hover:bg-sky-500 hover:text-black"><Plus size={16} />Adicionar</button>
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
        {showViewModal && selectedTreino && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowViewModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 20 }} className="relative w-full max-w-4xl rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
              <SectionTitle eyebrow="Detalhes do treino" title={selectedTreino.nome} description={selectedTreino.training_plan?.name ? `Plano: ${selectedTreino.training_plan.name}` : 'Treino com distribuicao direta para alunos especificos.'} />
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Objetivo</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.objetivo || '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Nivel</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.nivel || '-'}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duracao</p><p className="mt-2 text-lg font-bold text-white">{selectedTreino.duracao_minutos || 0} min</p></div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black/25 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Split</p><p className="mt-2 text-lg font-bold text-white">{getSplitDisplayLabel(selectedTreino.split_label)}</p></div>
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
                <SectionTitle eyebrow="Alunos ligados" title="Distribuicao atual" description="Cada aluno pode concluir o treino por conta propria ou a equipe pode registrar a conclusao." />
                {(selectedTreino.assigned_students || []).length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">Este treino ainda nao foi vinculado a nenhum aluno nem a um plano com alunos ativos.</div>
                ) : (
                  <div className="grid gap-3">
                    {(selectedTreino.assigned_students || []).map((student) => (
                      <div key={`${selectedTreino.id}-${student.id}`} className="flex flex-col gap-4 rounded-[24px] border border-zinc-800 bg-black/25 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">origem: {student.assignment_source === 'plan' ? 'plano' : student.assignment_source === 'direct' ? 'direto' : 'legado'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {student.completed_today ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300"><CheckCircle2 size={14} />Concluido hoje</span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500"><Calendar size={14} />Ainda nao concluido</span>
                          )}
                          {canManageRecords && (
                            <button onClick={() => void handleCompletionToggle(selectedTreino.id, student.id, !student.completed_today)} className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${student.completed_today ? 'border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-black' : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black'}`}>
                              {student.completed_today ? 'Remover conclusao' : 'Marcar concluido'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <SectionTitle eyebrow="Estrutura" title="Exercicios do treino" description="Sequencia montada manualmente para execucao do aluno." />
                <div className="grid gap-4">
                  {(selectedTreino.exercicios || []).map((exercicio, index) => (
                    <div key={`${selectedTreino.id}-${index}`} className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-lg font-bold text-white">{exercicio.nome}</p>
                          <p className="mt-2 text-sm text-zinc-500">{exercicio.observacoes || 'Sem observacoes adicionais.'}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Series</p><p className="mt-2 text-lg font-bold text-white">{exercicio.series}</p></div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Repeticoes</p><p className="mt-2 text-lg font-bold text-white">{exercicio.repeticoes}</p></div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Carga</p><p className="mt-2 text-lg font-bold text-white">{exercicio.carga || '-'}</p></div>
                          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Descanso</p><p className="mt-2 text-lg font-bold text-white">{exercicio.descanso || '-'}</p></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toast notification={notification} onClose={clearNotification} />
    </div>
  );
}
