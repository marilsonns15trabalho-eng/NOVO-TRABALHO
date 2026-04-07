'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Target,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import {
  ModuleEmptyState,
  ModuleHero,
  ModuleHeroAction,
  ModuleSectionHeading,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
} from '@/components/dashboard/ModulePrimitives';
import { ConfirmDialog, Toast } from '@/components/ui';
import { useNotification } from '@/hooks/useNotification';
import { formatDatePtBr, getAppDateInputValue } from '@/lib/date';
import {
  assignStudentToChallenge,
  createChallenge,
  deleteChallenge,
  fetchChallengeDays,
  fetchChallengeParticipants,
  fetchChallengeStudents,
  fetchChallengeSummaries,
  removeStudentFromChallenge,
  saveChallengeDay,
  updateChallenge,
} from '@/services/desafios.service';
import type {
  ChallengeDay,
  ChallengeParticipant,
  ChallengeStatus,
  ChallengeStudent,
  ChallengeSummary,
} from '@/types/desafio';

type ChallengeFormState = {
  title: string;
  description: string;
  status: ChallengeStatus;
  start_date: string;
  end_date: string;
};

type ChallengeDayFormState = {
  challenge_date: string;
  title: string;
  training_guidance: string;
  nutrition_guidance: string;
  notes: string;
};

const EMPTY_CHALLENGE_FORM: ChallengeFormState = {
  title: '',
  description: '',
  status: 'draft',
  start_date: '',
  end_date: '',
};

const createEmptyDayForm = (): ChallengeDayFormState => ({
  challenge_date: getAppDateInputValue(),
  title: '',
  training_guidance: '',
  nutrition_guidance: '',
  notes: '',
});

function getStatusLabel(status: ChallengeStatus) {
  if (status === 'active') {
    return 'Ativo';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  return 'Rascunho';
}

function getStatusClassName(status: ChallengeStatus) {
  if (status === 'active') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (status === 'archived') {
    return 'border-zinc-700 bg-zinc-900 text-zinc-400';
  }

  return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
}

function mapChallengeToForm(challenge: ChallengeSummary | null): ChallengeFormState {
  if (!challenge) {
    return { ...EMPTY_CHALLENGE_FORM };
  }

  return {
    title: challenge.title || '',
    description: challenge.description || '',
    status: challenge.status,
    start_date: challenge.start_date || '',
    end_date: challenge.end_date || '',
  };
}

function mapDayToForm(day: ChallengeDay | null): ChallengeDayFormState {
  if (!day) {
    return createEmptyDayForm();
  }

  return {
    challenge_date: day.challenge_date,
    title: day.title || '',
    training_guidance: day.training_guidance || '',
    nutrition_guidance: day.nutrition_guidance || '',
    notes: day.notes || '',
  };
}

export default function DesafioModule() {
  const { notification, showNotification, clearNotification } = useNotification();

  const [students, setStudents] = useState<ChallengeStudent[]>([]);
  const [challengeSummaries, setChallengeSummaries] = useState<ChallengeSummary[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [challengeDays, setChallengeDays] = useState<ChallengeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [deletingChallengeId, setDeletingChallengeId] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [challengeForm, setChallengeForm] = useState<ChallengeFormState>({ ...EMPTY_CHALLENGE_FORM });
  const [dayForm, setDayForm] = useState<ChallengeDayFormState>(createEmptyDayForm());
  const [deleteTarget, setDeleteTarget] = useState<ChallengeSummary | null>(null);
  const selectedChallengeIdRef = useRef<string | null>(null);

  const selectedChallenge = useMemo(
    () => challengeSummaries.find((challenge) => challenge.id === selectedChallengeId) ?? null,
    [challengeSummaries, selectedChallengeId],
  );

  const activeParticipantStudentIds = useMemo(
    () => new Set(participants.map((participant) => participant.student_id)),
    [participants],
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    return students.filter((student) => {
      if (activeParticipantStudentIds.has(student.id)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${student.nome} ${student.email || ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [activeParticipantStudentIds, studentSearch, students]);

  const activeChallengesCount = challengeSummaries.filter((challenge) => challenge.status === 'active').length;

  useEffect(() => {
    selectedChallengeIdRef.current = selectedChallengeId;
  }, [selectedChallengeId]);

  const loadBaseData = useCallback(async (nextChallengeId?: string | null) => {
    try {
      setLoading(true);
      const [studentRows, challengeRows] = await Promise.all([
        fetchChallengeStudents(),
        fetchChallengeSummaries(),
      ]);

      setStudents(studentRows);
      setChallengeSummaries(challengeRows);

      const preferredChallengeId =
        nextChallengeId === undefined
          ? selectedChallengeIdRef.current
          : nextChallengeId;

      if (preferredChallengeId && challengeRows.some((challenge) => challenge.id === preferredChallengeId)) {
        setSelectedChallengeId(preferredChallengeId);
        return;
      }

      const firstChallengeId = challengeRows[0]?.id ?? null;
      setSelectedChallengeId(firstChallengeId);
      if (!firstChallengeId) {
        setChallengeForm({ ...EMPTY_CHALLENGE_FORM });
        setParticipants([]);
        setChallengeDays([]);
      }
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
      showNotification('Nao foi possivel carregar os desafios.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadChallengeDetails = useCallback(async (challengeId: string) => {
    try {
      setDetailsLoading(true);
      const [participantRows, dayRows] = await Promise.all([
        fetchChallengeParticipants(challengeId),
        fetchChallengeDays(challengeId),
      ]);

      setParticipants(participantRows);
      setChallengeDays(dayRows);
    } catch (error) {
      console.error('Erro ao carregar detalhes do desafio:', error);
      showNotification('Nao foi possivel carregar os detalhes do desafio.', 'error');
      setParticipants([]);
      setChallengeDays([]);
    } finally {
      setDetailsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    setChallengeForm(mapChallengeToForm(selectedChallenge));

    if (!selectedChallengeId) {
      setParticipants([]);
      setChallengeDays([]);
      setDayForm(createEmptyDayForm());
      return;
    }

    void loadChallengeDetails(selectedChallengeId);
  }, [loadChallengeDetails, selectedChallenge, selectedChallengeId]);

  useEffect(() => {
    const matchingDay =
      challengeDays.find((day) => day.challenge_date === dayForm.challenge_date) ?? null;

    if (matchingDay) {
      setDayForm(mapDayToForm(matchingDay));
      return;
    }

    setDayForm((current) => ({
      ...current,
      title: '',
      training_guidance: '',
      nutrition_guidance: '',
      notes: '',
    }));
  }, [challengeDays, dayForm.challenge_date]);

  const handleStartNewChallenge = () => {
    setSelectedChallengeId(null);
    setChallengeForm({ ...EMPTY_CHALLENGE_FORM });
    setParticipants([]);
    setChallengeDays([]);
    setDayForm(createEmptyDayForm());
  };

  const handleSaveChallenge = async () => {
    const title = challengeForm.title.trim();
    if (!title) {
      showNotification('Informe o titulo do desafio.', 'error');
      return;
    }

    try {
      setSavingChallenge(true);

      if (selectedChallengeId) {
        const updated = await updateChallenge(selectedChallengeId, challengeForm);
        await loadBaseData(updated.id);
        showNotification('Desafio atualizado com sucesso.', 'success');
      } else {
        const created = await createChallenge(challengeForm);
        await loadBaseData(created.id);
        showNotification('Desafio criado com sucesso.', 'success');
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel salvar o desafio.',
        'error',
      );
    } finally {
      setSavingChallenge(false);
    }
  };

  const handleDeleteChallenge = async (challenge: ChallengeSummary) => {
    try {
      setDeletingChallengeId(challenge.id);
      await deleteChallenge(challenge.id);
      await loadBaseData(
        selectedChallengeId === challenge.id ? null : selectedChallengeId,
      );
      showNotification('Desafio excluido com sucesso.', 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel excluir o desafio.',
        'error',
      );
    } finally {
      setDeletingChallengeId(null);
      setDeleteTarget(null);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedChallengeId || !selectedStudentId) {
      showNotification('Selecione uma aluna para adicionar ao desafio.', 'error');
      return;
    }

    try {
      setAssigningStudent(true);
      const participant = await assignStudentToChallenge(selectedChallengeId, selectedStudentId);
      setParticipants((current) => [participant, ...current.filter((item) => item.student_id !== participant.student_id)]);
      setSelectedStudentId('');
      setStudentSearch('');
      await loadBaseData(selectedChallengeId);
      showNotification('Aluna adicionada ao desafio.', 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel adicionar a aluna.',
        'error',
      );
    } finally {
      setAssigningStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedChallengeId) {
      return;
    }

    try {
      setRemovingStudentId(studentId);
      await removeStudentFromChallenge(selectedChallengeId, studentId);
      setParticipants((current) => current.filter((participant) => participant.student_id !== studentId));
      await loadBaseData(selectedChallengeId);
      showNotification('Aluna removida do desafio.', 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel remover a aluna.',
        'error',
      );
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleSaveDay = async () => {
    if (!selectedChallengeId) {
      showNotification('Crie ou selecione um desafio antes de salvar o dia.', 'error');
      return;
    }

    if (!dayForm.challenge_date) {
      showNotification('Informe a data do dia do desafio.', 'error');
      return;
    }

    try {
      setSavingDay(true);
      const savedDay = await saveChallengeDay({
        challenge_id: selectedChallengeId,
        challenge_date: dayForm.challenge_date,
        title: dayForm.title,
        training_guidance: dayForm.training_guidance,
        nutrition_guidance: dayForm.nutrition_guidance,
        notes: dayForm.notes,
      });

      setChallengeDays((current) => {
        const next = current.filter(
          (day) =>
            !(day.challenge_id === savedDay.challenge_id && day.challenge_date === savedDay.challenge_date),
        );

        return [savedDay, ...next].sort((a, b) => b.challenge_date.localeCompare(a.challenge_date));
      });
      showNotification('Atualizacao diaria salva com sucesso.', 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel salvar o dia do desafio.',
        'error',
      );
    } finally {
      setSavingDay(false);
    }
  };

  const existingDayForForm =
    challengeDays.find((day) => day.challenge_date === dayForm.challenge_date) ?? null;

  return (
    <ModuleShell>
      <ModuleHero
        badge="Desafio"
        title="Desafios diarios com acesso controlado"
        description="Crie desafios, vincule alunas especificas e atualize o conteudo de treino e protocolo alimentar por dia, sem expor a aba para quem nao participa."
        accent="amber"
        chips={[
          { label: 'Desafios', value: String(challengeSummaries.length) },
          { label: 'Ativos', value: String(activeChallengesCount) },
          { label: 'Participantes', value: String(participants.length) },
          { label: 'Dia selecionado', value: dayForm.challenge_date || '-' },
        ]}
        actions={
          <>
            <ModuleHeroAction
              label="Novo desafio"
              subtitle="Abrir um desafio vazio para sua esposa configurar."
              icon={Plus}
              accent="amber"
              filled
              onClick={handleStartNewChallenge}
            />
            <ModuleHeroAction
              label="Salvar desafio"
              subtitle="Gravar titulo, status e periodo com leitura leve no banco."
              icon={Save}
              accent="amber"
              onClick={() => void handleSaveChallenge()}
              disabled={savingChallenge}
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Desafios ativos"
          value={String(activeChallengesCount)}
          detail="Quantidade atual de desafios liberados para leitura das alunas vinculadas."
          icon={Target}
          accent="amber"
        />
        <ModuleStatCard
          label="Alunas vinculadas"
          value={String(participants.length)}
          detail="Participantes do desafio selecionado agora, sem misturar com os demais."
          icon={Users}
          accent="amber"
        />
        <ModuleStatCard
          label="Dias atualizados"
          value={String(challengeDays.length)}
          detail="Historico recente de atualizacoes diarias carregado apenas quando o desafio e aberto."
          icon={CalendarDays}
          accent="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleSurface className="space-y-5">
          <ModuleSectionHeading
            eyebrow="Configuracao"
            title={selectedChallenge ? 'Editar desafio selecionado' : 'Criar novo desafio'}
            description="Defina titulo, periodo e status. O desafio so fica visivel para alunas vinculadas e quando estiver ativo."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Titulo
              </label>
              <input
                type="text"
                value={challengeForm.title}
                onChange={(event) =>
                  setChallengeForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ex.: Desafio de abril"
                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Descricao
              </label>
              <textarea
                rows={4}
                value={challengeForm.description}
                onChange={(event) =>
                  setChallengeForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Explique o objetivo geral do desafio."
                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Status
              </label>
              <select
                value={challengeForm.status}
                onChange={(event) =>
                  setChallengeForm((current) => ({
                    ...current,
                    status: event.target.value as ChallengeStatus,
                  }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="draft">Rascunho</option>
                <option value="active">Ativo</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Inicio
              </label>
              <input
                type="date"
                value={challengeForm.start_date}
                onChange={(event) =>
                  setChallengeForm((current) => ({ ...current, start_date: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                Fim
              </label>
              <input
                type="date"
                value={challengeForm.end_date}
                onChange={(event) =>
                  setChallengeForm((current) => ({ ...current, end_date: event.target.value }))
                }
                className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSaveChallenge()}
              disabled={savingChallenge}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingChallenge ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {selectedChallenge ? 'Atualizar desafio' : 'Criar desafio'}
            </button>

            {selectedChallenge ? (
              <button
                type="button"
                onClick={() => setDeleteTarget(selectedChallenge)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500 hover:text-white"
              >
                <Trash2 size={16} />
                Excluir desafio
              </button>
            ) : null}
          </div>
        </ModuleSurface>

        <ModuleSurface className="space-y-5">
          <ModuleSectionHeading
            eyebrow="Lista"
            title="Desafios cadastrados"
            description="Selecione um desafio para carregar participantes e atualizacoes diarias sem fazer consulta completa o tempo todo."
          />

          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 className="animate-spin text-amber-400" size={28} />
            </div>
          ) : challengeSummaries.length === 0 ? (
            <ModuleEmptyState
              icon={ShieldCheck}
              title="Nenhum desafio criado ainda"
              description="Crie o primeiro desafio para liberar a configuracao diaria e a inclusao das alunas."
            />
          ) : (
            <div className="space-y-3">
              {challengeSummaries.map((challenge) => (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => setSelectedChallengeId(challenge.id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                    selectedChallengeId === challenge.id
                      ? 'border-amber-500/20 bg-amber-500/10'
                      : 'border-zinc-800 bg-black/25 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-white">{challenge.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {challenge.description || 'Sem descricao adicional.'}
                      </p>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${getStatusClassName(challenge.status)}`}>
                      {getStatusLabel(challenge.status)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5">
                      participantes: {challenge.participant_count || 0}
                    </span>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5">
                      inicio: {challenge.start_date ? formatDatePtBr(challenge.start_date) : '-'}
                    </span>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5">
                      fim: {challenge.end_date ? formatDatePtBr(challenge.end_date) : '-'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ModuleSurface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ModuleSurface className="space-y-5">
          <ModuleSectionHeading
            eyebrow="Participantes"
            title={selectedChallenge ? 'Alunas do desafio selecionado' : 'Selecione um desafio'}
            description="A aluna so ve a aba de desafio quando estiver vinculada aqui."
          />

          {!selectedChallenge ? (
            <ModuleEmptyState
              icon={Users}
              title="Nenhum desafio selecionado"
              description="Escolha um desafio da lista para carregar as alunas vinculadas."
            />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Buscar aluna pelo nome ou e-mail..."
                  className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                />

                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Selecionar aluna</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nome}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => void handleAssignStudent()}
                  disabled={!selectedStudentId || assigningStudent}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-amber-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {assigningStudent ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Adicionar
                </button>
              </div>

              {detailsLoading ? (
                <div className="flex items-center justify-center py-10 text-zinc-400">
                  <Loader2 className="animate-spin text-amber-400" size={24} />
                </div>
              ) : participants.length === 0 ? (
                <ModuleEmptyState
                  icon={Users}
                  title="Nenhuma aluna vinculada"
                  description="Adicione as alunas que devem enxergar o desafio no painel."
                />
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex flex-col gap-3 rounded-[24px] border border-zinc-800 bg-black/25 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          displayName={participant.students?.nome || 'Aluna'}
                          avatarUrl={participant.students?.avatar_url}
                          className="h-12 w-12 rounded-2xl border border-zinc-800"
                          textClassName="text-sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {participant.students?.nome || 'Aluna'}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {participant.students?.email || 'Sem e-mail'}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                            vinculada em {formatDatePtBr(participant.assigned_at)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleRemoveStudent(participant.student_id)}
                        disabled={removingStudentId === participant.student_id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingStudentId === participant.student_id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </ModuleSurface>

        <ModuleSurface className="space-y-5">
          <ModuleSectionHeading
            eyebrow="Atualizacao diaria"
            title={selectedChallenge ? 'Conteudo do dia' : 'Selecione um desafio'}
            description="Sua esposa pode atualizar o treino e a orientacao alimentar de cada data sem sobrescrever o historico."
          />

          {!selectedChallenge ? (
            <ModuleEmptyState
              icon={CalendarDays}
              title="Nenhum desafio selecionado"
              description="Escolha um desafio para editar a atualizacao do dia."
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Data do desafio
                  </label>
                  <input
                    type="date"
                    value={dayForm.challenge_date}
                    onChange={(event) =>
                      setDayForm((current) => ({ ...current, challenge_date: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Titulo do dia
                  </label>
                  <input
                    type="text"
                    value={dayForm.title}
                    onChange={(event) =>
                      setDayForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Ex.: Dia 1 - Ajuste de rotina"
                    className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Orientacao de treino
                </label>
                <textarea
                  rows={5}
                  value={dayForm.training_guidance}
                  onChange={(event) =>
                    setDayForm((current) => ({ ...current, training_guidance: event.target.value }))
                  }
                  placeholder="Descreva o treino do dia."
                  className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Orientacao alimentar
                </label>
                <textarea
                  rows={5}
                  value={dayForm.nutrition_guidance}
                  onChange={(event) =>
                    setDayForm((current) => ({ ...current, nutrition_guidance: event.target.value }))
                  }
                  placeholder="Descreva a orientacao alimentar do dia."
                  className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Observacoes internas
                </label>
                <textarea
                  rows={3}
                  value={dayForm.notes}
                  onChange={(event) =>
                    setDayForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Observacoes extras para a equipe."
                  className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveDay()}
                  disabled={savingDay}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDay ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {existingDayForForm ? 'Atualizar dia' : 'Salvar dia'}
                </button>

                {existingDayForForm ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    Dia ja cadastrado
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Historico recente
                </p>

                {detailsLoading ? (
                  <div className="flex items-center justify-center py-8 text-zinc-400">
                    <Loader2 className="animate-spin text-amber-400" size={24} />
                  </div>
                ) : challengeDays.length === 0 ? (
                  <ModuleEmptyState
                    icon={CalendarDays}
                    title="Nenhum dia atualizado"
                    description="Salve a primeira orientacao diaria para comecar o historico do desafio."
                  />
                ) : (
                  <div className="space-y-3">
                    {challengeDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setDayForm(mapDayToForm(day))}
                        className={`w-full rounded-[22px] border p-4 text-left transition-all ${
                          day.challenge_date === dayForm.challenge_date
                            ? 'border-amber-500/20 bg-amber-500/10'
                            : 'border-zinc-800 bg-black/25 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">
                              {day.title || `Atualizacao ${formatDatePtBr(day.challenge_date)}`}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                              {formatDatePtBr(day.challenge_date)}
                            </p>
                          </div>
                          <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                            editar
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </ModuleSurface>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDeleteChallenge(deleteTarget)}
        title="Excluir desafio?"
        message={
          deleteTarget
            ? `Tem certeza que deseja excluir "${deleteTarget.title}"? Participantes e dias vinculados tambem serao removidos.`
            : 'Tem certeza que deseja excluir este desafio?'
        }
        confirmText="Excluir desafio"
        cancelText="Cancelar"
        variant="danger"
        loading={Boolean(deleteTarget && deletingChallengeId === deleteTarget.id)}
      />

      <Toast notification={notification} onClose={clearNotification} />
    </ModuleShell>
  );
}
