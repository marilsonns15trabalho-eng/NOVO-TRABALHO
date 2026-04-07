import { getLocalDateInputValue } from '@/lib/date';
import { TABLES } from '@/lib/constants';
import { normalizeStudentRelation } from '@/lib/mappers';
import { supabase } from '@/lib/supabase';
import {
  attachStudentAvatar,
  collectLinkedAuthUserIds,
  fetchStudentAvatarMap,
} from '@/services/student-avatars.service';

type ReviewAlertType = 'check_completion' | 'adapt_workout';

interface ReviewStudent {
  id: string;
  name: string;
  linked_auth_user_id?: string | null;
  status?: string | null;
}

interface PendingTreino {
  treino_id: string;
  treino_name: string;
  occurred_at: string;
}

interface ReviewAlertState {
  student: ReviewStudent;
  confirmTreinos: PendingTreino[];
  adaptTreinos: PendingTreino[];
}

export interface TrainingReviewAlert {
  id: string;
  type: ReviewAlertType;
  student_id: string;
  student_name: string;
  linked_auth_user_id?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
  treino_id: string;
  treino_name: string;
  title: string;
  description: string;
  occurred_at: string;
  priority: number;
}

const STALE_EXECUTION_HOURS = 3;
const MISSED_WORKOUT_REVIEW_HOUR = 18;
const MAX_REVIEW_ALERTS = 8;

function unwrapJoinedRow<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] || null : value;
}

function normalizeReviewStudent(value: any): ReviewStudent | null {
  const student = normalizeStudentRelation(unwrapJoinedRow(value));
  if (!student?.id) {
    return null;
  }

  return {
    id: student.id,
    name: student.name || student.nome || 'Aluna',
    linked_auth_user_id: student.linked_auth_user_id ?? null,
    status: student.status ?? null,
  };
}

function hoursSince(value: string | null | undefined, referenceTime: number) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) {
    return null;
  }

  return (referenceTime - parsed) / 3600000;
}

function pickLatestOccurredAt(items: PendingTreino[]) {
  return items.reduce((latest, item) => {
    if (!latest) {
      return item.occurred_at;
    }

    return new Date(item.occurred_at).getTime() > new Date(latest).getTime() ? item.occurred_at : latest;
  }, '');
}

function buildTreinoSummary(items: PendingTreino[]) {
  if (items.length <= 1) {
    return items[0]?.treino_name || 'o treino de hoje';
  }

  return `${items[0]?.treino_name || 'o treino de hoje'} + ${items.length - 1} treino(s)`;
}

function registerAlertState(
  map: Map<string, ReviewAlertState>,
  student: ReviewStudent,
  field: 'confirmTreinos' | 'adaptTreinos',
  treino: PendingTreino,
) {
  if (!student.id || student.status === 'inativo') {
    return;
  }

  const current = map.get(student.id) || {
    student,
    confirmTreinos: [],
    adaptTreinos: [],
  };

  const alreadyRegistered = current[field].some((item) => item.treino_id === treino.treino_id);
  if (!alreadyRegistered) {
    current[field].push(treino);
  }

  map.set(student.id, current);
}

export async function fetchTrainingReviewAlerts(): Promise<TrainingReviewAlert[]> {
  try {
    const now = new Date();
    const referenceTime = now.getTime();
    const currentHour = now.getHours();
    const todayKey = getLocalDateInputValue(now);
    const todayDayOfWeek = now.getDay();

    const { data: treinoRows, error: treinosError } = await supabase
      .from(TABLES.TREINOS)
      .select('id, nome, training_plan_id, student:students(id, name, linked_auth_user_id, status)')
      .eq('ativo', true)
      .eq('day_of_week', todayDayOfWeek);

    if (treinosError) {
      throw new Error(treinosError.message || 'Nao foi possivel carregar os treinos agendados.');
    }

    const activeTreinos = (treinoRows || []).filter((row: any) => row?.id);
    if (!activeTreinos.length) {
      return [];
    }

    const treinoIds = activeTreinos.map((row: any) => row.id);
    const planIds = Array.from(
      new Set(activeTreinos.map((row: any) => row.training_plan_id).filter(Boolean)),
    );

    const [directAssignmentsRes, planAssignmentsRes, completionLogsRes, executionSessionsRes] =
      await Promise.all([
        supabase
          .from(TABLES.TREINO_STUDENT_ASSIGNMENTS)
          .select('treino_id, student:students(id, name, linked_auth_user_id, status)')
          .eq('active', true)
          .in('treino_id', treinoIds),
        planIds.length > 0
          ? supabase
              .from(TABLES.STUDENT_TRAINING_PLANS)
              .select('training_plan_id, student:students(id, name, linked_auth_user_id, status)')
              .eq('active', true)
              .in('training_plan_id', planIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from(TABLES.TREINO_COMPLETION_LOGS)
          .select('treino_id, student_id, completed_on')
          .eq('completed_on', todayKey)
          .in('treino_id', treinoIds),
        supabase
          .from(TABLES.TREINO_EXECUTION_SESSIONS)
          .select('treino_id, student_id, status, started_at, last_activity_at, completed_at')
          .eq('execution_date', todayKey)
          .in('treino_id', treinoIds)
          .neq('status', 'cancelled'),
      ]);

    if (directAssignmentsRes.error) {
      throw new Error(directAssignmentsRes.error.message || 'Nao foi possivel carregar os vinculos diretos.');
    }

    if (planAssignmentsRes.error) {
      throw new Error(planAssignmentsRes.error.message || 'Nao foi possivel carregar os vinculos dos planos.');
    }

    if (completionLogsRes.error) {
      throw new Error(completionLogsRes.error.message || 'Nao foi possivel carregar as confirmacoes de treino.');
    }

    if (executionSessionsRes.error) {
      throw new Error(executionSessionsRes.error.message || 'Nao foi possivel carregar as execucoes dos treinos.');
    }

    const directByTreino = new Map<string, ReviewStudent[]>();
    (directAssignmentsRes.data || []).forEach((row: any) => {
      const student = normalizeReviewStudent(row.student);
      if (!student) {
        return;
      }

      const current = directByTreino.get(row.treino_id) || [];
      current.push(student);
      directByTreino.set(row.treino_id, current);
    });

    const planStudentsByPlanId = new Map<string, ReviewStudent[]>();
    (planAssignmentsRes.data || []).forEach((row: any) => {
      const student = normalizeReviewStudent(row.student);
      if (!student) {
        return;
      }

      const current = planStudentsByPlanId.get(row.training_plan_id) || [];
      current.push(student);
      planStudentsByPlanId.set(row.training_plan_id, current);
    });

    const completionKeys = new Set(
      (completionLogsRes.data || []).map((row: any) => `${row.treino_id}:${row.student_id}`),
    );

    const executionMap = new Map<string, any>();
    (executionSessionsRes.data || []).forEach((row: any) => {
      executionMap.set(`${row.treino_id}:${row.student_id}`, row);
    });

    const states = new Map<string, ReviewAlertState>();

    activeTreinos.forEach((treino: any) => {
      const assignedStudentsMap = new Map<string, ReviewStudent>();

      const register = (student: ReviewStudent | null) => {
        if (!student?.id) {
          return;
        }
        assignedStudentsMap.set(student.id, student);
      };

      register(normalizeReviewStudent(treino.student));
      (directByTreino.get(treino.id) || []).forEach(register);
      (planStudentsByPlanId.get(treino.training_plan_id) || []).forEach(register);

      assignedStudentsMap.forEach((student) => {
        const key = `${treino.id}:${student.id}`;
        if (completionKeys.has(key)) {
          return;
        }

        const execution = executionMap.get(key);
        if (execution?.status === 'completed') {
          return;
        }

        if (execution?.status === 'in_progress') {
          const staleHours = hoursSince(
            execution.last_activity_at || execution.started_at || null,
            referenceTime,
          );

          if (staleHours != null && staleHours >= STALE_EXECUTION_HOURS) {
            registerAlertState(states, student, 'confirmTreinos', {
              treino_id: treino.id,
              treino_name: treino.nome || 'Treino',
              occurred_at:
                execution.last_activity_at || execution.started_at || new Date(referenceTime).toISOString(),
            });
          }
          return;
        }

        if (currentHour >= MISSED_WORKOUT_REVIEW_HOUR) {
          registerAlertState(states, student, 'adaptTreinos', {
            treino_id: treino.id,
            treino_name: treino.nome || 'Treino',
            occurred_at: new Date(referenceTime).toISOString(),
          });
        }
      });
    });

    const avatarMap = await fetchStudentAvatarMap(
      collectLinkedAuthUserIds(Array.from(states.values()).map((item) => item.student)),
    );

    return Array.from(states.values())
      .map((state) => {
        const studentWithAvatar = attachStudentAvatar(state.student, avatarMap);
        const confirmTreinos = state.confirmTreinos;
        const adaptTreinos = state.adaptTreinos;

        if (confirmTreinos.length > 0) {
          const primaryTreino = confirmTreinos[0];
          return {
            id: `training-review-confirm-${studentWithAvatar.id}`,
            type: 'check_completion' as const,
            student_id: studentWithAvatar.id,
            student_name: studentWithAvatar.name,
            linked_auth_user_id: studentWithAvatar.linked_auth_user_id ?? null,
            avatar_url: studentWithAvatar.avatar_url ?? null,
            avatar_path: studentWithAvatar.avatar_path ?? null,
            avatar_updated_at: studentWithAvatar.avatar_updated_at ?? null,
            treino_id: primaryTreino.treino_id,
            treino_name: primaryTreino.treino_name,
            title: 'Verificar confirmacao do treino',
            description: `${studentWithAvatar.name} iniciou ${buildTreinoSummary(confirmTreinos)} e pode ter esquecido de concluir.`,
            occurred_at: pickLatestOccurredAt(confirmTreinos),
            priority: 3,
          };
        }

        const primaryTreino = adaptTreinos[0];
        return {
          id: `training-review-adapt-${studentWithAvatar.id}`,
          type: 'adapt_workout' as const,
          student_id: studentWithAvatar.id,
          student_name: studentWithAvatar.name,
          linked_auth_user_id: studentWithAvatar.linked_auth_user_id ?? null,
          avatar_url: studentWithAvatar.avatar_url ?? null,
          avatar_path: studentWithAvatar.avatar_path ?? null,
          avatar_updated_at: studentWithAvatar.avatar_updated_at ?? null,
          treino_id: primaryTreino.treino_id,
          treino_name: primaryTreino.treino_name,
          title: 'Revisar treino de hoje',
          description: `${studentWithAvatar.name} ainda nao confirmou ${buildTreinoSummary(adaptTreinos)}. Se faltou, considere adaptar o treino.`,
          occurred_at: pickLatestOccurredAt(adaptTreinos),
          priority: 2,
        };
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }

        return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
      })
      .slice(0, MAX_REVIEW_ALERTS);
  } catch (error) {
    console.error('Erro ao carregar avisos de revisao de treino:', error);
    return [];
  }
}
