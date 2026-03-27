import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { getLocalDateInputValue } from '@/lib/date';
import { mapStudentToListItem } from '@/lib/mappers';
import { findStudentIdByLinkedAuthUserId } from '@/lib/student-access';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';
import type { StudentListItem } from '@/types/common';
import type {
  StudentMonthlyTrainingProgress,
  TrainingPlan,
  TrainingPlanVersion,
  Treino,
  TreinoAssignedStudent,
  TreinoCompletionLog,
  TreinoExecutionItem,
  TreinoExecutionSession,
  TreinoFormData,
} from '@/types/treino';

type TrainingPlanPayload = {
  name: string;
  weekly_frequency: number;
  description?: string | null;
  active?: boolean;
  objective?: string | null;
  level?: string | null;
  duration_weeks?: number | null;
  coach_notes?: string | null;
};

type RawStudent = {
  id: string;
  name?: string | null;
  linked_auth_user_id?: string | null;
};

type RawTrainingPlan = {
  id: string;
  name: string;
  weekly_frequency: number;
  description?: string | null;
  active?: boolean | null;
  created_at: string;
};

type RawTrainingPlanVersion = {
  id: string;
  training_plan_id: string;
  version_number: number;
  objective?: string | null;
  level?: string | null;
  duration_weeks?: number | null;
  coach_notes?: string | null;
  is_active?: boolean | null;
  created_at: string;
};

function monthBounds(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  const today = new Date();
  const effectiveEnd =
    today.getFullYear() === referenceDate.getFullYear() &&
    today.getMonth() === referenceDate.getMonth() &&
    today.getDate() < end.getDate()
      ? today
      : end;

  return {
    start: getLocalDateInputValue(start),
    end: getLocalDateInputValue(end),
    effectiveEnd,
    totalDaysInMonth: end.getDate(),
  };
}

function weekBounds(referenceDate = new Date()) {
  const current = new Date(referenceDate);
  const day = current.getDay();
  const start = new Date(current);
  start.setDate(current.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: getLocalDateInputValue(start),
    end: getLocalDateInputValue(end),
  };
}

function isoDate(value: Date) {
  return getLocalDateInputValue(value);
}

function assertNoTreinoError(label: string, error: { message?: string } | null) {
  if (error) {
    throw new Error(`${label}: ${error.message || 'erro desconhecido'}`);
  }
}

function normalizeTrainingPlanVersion(
  row: RawTrainingPlanVersion | null | undefined,
): TrainingPlanVersion | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    training_plan_id: row.training_plan_id,
    version_number: row.version_number,
    objective: row.objective ?? null,
    level: row.level ?? null,
    duration_weeks: row.duration_weeks ?? null,
    coach_notes: row.coach_notes ?? null,
    is_active: row.is_active !== false,
    created_at: row.created_at,
  };
}

function normalizeTrainingPlan(row: RawTrainingPlan | null | undefined): TrainingPlan | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    weekly_frequency: row.weekly_frequency,
    description: row.description ?? null,
    active: row.active !== false,
    created_at: row.created_at,
  };
}

function mapTrainingPlanWithVersion(
  row: RawTrainingPlan,
  activeVersion?: RawTrainingPlanVersion | TrainingPlanVersion | null,
): TrainingPlan {
  return {
    ...normalizeTrainingPlan(row)!,
    active_version: normalizeTrainingPlanVersion(activeVersion as RawTrainingPlanVersion | null),
  };
}

function normalizeAssignedStudent(
  row: RawStudent | null | undefined,
  assignmentSource: TreinoAssignedStudent['assignment_source']
): TreinoAssignedStudent | null {
  if (!row?.id) {
    return null;
  }

  return {
    id: row.id,
    name: row.name || 'Aluno',
    linked_auth_user_id: row.linked_auth_user_id ?? null,
    assignment_source: assignmentSource,
  };
}

function mergeAssignedStudents(
  legacyStudent: TreinoAssignedStudent | null,
  directStudents: TreinoAssignedStudent[],
  planStudents: TreinoAssignedStudent[],
  completionsTodayKeys: Set<string>,
): TreinoAssignedStudent[] {
  const map = new Map<string, TreinoAssignedStudent>();

  const register = (student: TreinoAssignedStudent | null) => {
    if (!student?.id) {
      return;
    }

    const existing = map.get(student.id);
    if (!existing) {
      map.set(student.id, student);
      return;
    }

    if (existing.assignment_source === 'plan' && student.assignment_source !== 'plan') {
      map.set(student.id, student);
      return;
    }

    if (existing.assignment_source === 'legacy' && student.assignment_source === 'direct') {
      map.set(student.id, student);
    }
  };

  register(legacyStudent);
  directStudents.forEach(register);
  planStudents.forEach(register);

  return Array.from(map.values()).map((student) => ({
    ...student,
    completed_today: completionsTodayKeys.has(`${student.id}`),
  }));
}

function normalizeExecutionItem(row: any, fallbackIndex: number): TreinoExecutionItem {
  return {
    id: row?.id,
    session_id: row?.session_id,
    exercise_index: row?.exercise_index ?? fallbackIndex,
    exercise_name: row?.exercise_name || 'Exercicio',
    planned_sets: row?.planned_sets ?? null,
    planned_reps: row?.planned_reps ?? null,
    planned_load: row?.planned_load ?? null,
    planned_rest: row?.planned_rest ?? null,
    performed_sets: row?.performed_sets ?? null,
    performed_reps: row?.performed_reps ?? null,
    performed_load: row?.performed_load ?? null,
    completed: row?.completed === true,
    notes: row?.notes ?? null,
  };
}

function normalizeExecutionSession(row: any): TreinoExecutionSession | null {
  if (!row?.id) {
    return null;
  }

  const items = Array.isArray(row.items)
    ? row.items
        .slice()
        .sort((a: any, b: any) => (a.exercise_index ?? 0) - (b.exercise_index ?? 0))
        .map((item: any, index: number) => normalizeExecutionItem(item, index))
    : [];

  return {
    id: row.id,
    treino_id: row.treino_id,
    student_id: row.student_id,
    execution_date: row.execution_date,
    status: row.status,
    started_at: row.started_at,
    completed_at: row.completed_at ?? null,
    last_activity_at: row.last_activity_at ?? null,
    started_by_auth_user_id: row.started_by_auth_user_id ?? null,
    completed_by_auth_user_id: row.completed_by_auth_user_id ?? null,
    completion_source: row.completion_source === 'staff' ? 'staff' : 'student',
    notes: row.notes ?? null,
    items,
  };
}

function buildExecutionItemsFromTreino(treino: Pick<Treino, 'exercicios'>): TreinoExecutionItem[] {
  return (treino.exercicios || []).map((exercise, index) => ({
    exercise_index: index,
    exercise_name: exercise.nome || `Exercicio ${index + 1}`,
    planned_sets: exercise.series ?? null,
    planned_reps: exercise.repeticoes ?? null,
    planned_load: exercise.carga ?? null,
    planned_rest: exercise.descanso ?? null,
    performed_sets: exercise.series ?? null,
    performed_reps: exercise.repeticoes ?? null,
    performed_load: exercise.carga ?? null,
    completed: false,
    notes: exercise.observacoes ?? null,
  }));
}

function mapTreinoRow(
  item: any,
  options?: {
    legacyStudent?: TreinoAssignedStudent | null;
    directStudents?: TreinoAssignedStudent[];
    planStudents?: TreinoAssignedStudent[];
    completionLogs?: TreinoCompletionLog[];
    currentExecution?: TreinoExecutionSession | null;
  },
): Treino {
  const todayKey = getLocalDateInputValue();
  const completionLogs = options?.completionLogs || [];
  const completionsTodayKeys = new Set(
    completionLogs
      .filter((log) => log.completed_on === todayKey)
      .map((log) => log.student_id),
  );

  return {
    id: item.id,
    student_id: item.student_id ?? null,
    training_plan_id: item.training_plan_id ?? null,
    training_plan_version_id: item.training_plan_version_id ?? null,
    created_by_auth_user_id: item.created_by_auth_user_id ?? null,
    nome: item.nome,
    objetivo: item.objetivo ?? '',
    nivel: item.nivel ?? '',
    duracao_minutos: item.duracao_minutos ?? undefined,
    descricao: item.descricao ?? '',
    exercicios: Array.isArray(item.exercicios) ? item.exercicios : [],
    ativo: item.ativo !== false,
    sort_order: item.sort_order ?? 0,
    split_label: item.split_label ?? null,
    day_of_week: item.day_of_week ?? null,
    coach_notes: item.coach_notes ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at ?? item.created_at,
    students: item.legacy_student
      ? {
          id: item.legacy_student.id,
          linked_auth_user_id: item.legacy_student.linked_auth_user_id ?? null,
          name: item.legacy_student.name || 'Aluno',
        }
      : undefined,
    training_plan: normalizeTrainingPlan(item.training_plan),
    training_plan_version: normalizeTrainingPlanVersion(item.training_plan_version),
    assigned_students: mergeAssignedStudents(
      options?.legacyStudent ?? null,
      options?.directStudents || [],
      options?.planStudents || [],
      completionsTodayKeys,
    ),
    completion_logs: completionLogs,
    completed_today: completionLogs.some(
      (log) => log.completed_on === todayKey,
    ),
    completions_this_month: completionLogs.length,
    current_execution: options?.currentExecution ?? null,
  };
}

async function fetchTrainingPlanAssignments() {
  const { data, error } = await supabase
    .from(TABLES.STUDENT_TRAINING_PLANS)
    .select(`
      id,
      student_id,
      training_plan_id,
      active,
      start_date,
      end_date,
      notes,
      created_at,
      student:students(id, name, linked_auth_user_id)
    `)
    .eq('active', true);

  assertNoTreinoError('Treinos.planoAssignments', error);
  return data || [];
}

async function fetchActiveTrainingPlanVersions(planIds?: string[]) {
  let query = supabase
    .from(TABLES.TRAINING_PLAN_VERSIONS)
    .select(
      'id, training_plan_id, version_number, objective, level, duration_weeks, coach_notes, is_active, created_at',
    )
    .eq('is_active', true);

  if (planIds?.length) {
    query = query.in('training_plan_id', planIds);
  }

  const { data, error } = await query;
  assertNoTreinoError('Treinos.trainingPlanVersions', error);

  const map = new Map<string, TrainingPlanVersion>();
  (data || []).forEach((row: RawTrainingPlanVersion) => {
    const normalized = normalizeTrainingPlanVersion(row);
    if (normalized) {
      map.set(normalized.training_plan_id, normalized);
    }
  });

  return map;
}

async function resolveTrainingPlanVersionId(
  trainingPlanId?: string | null,
  requestedVersionId?: string | null,
) {
  const normalizedPlanId = trainingPlanId?.trim() || '';
  const normalizedVersionId = requestedVersionId?.trim() || '';

  if (!normalizedPlanId) {
    return null;
  }

  if (normalizedVersionId) {
    const { data, error } = await supabase
      .from(TABLES.TRAINING_PLAN_VERSIONS)
      .select('id, training_plan_id, is_active')
      .eq('id', normalizedVersionId)
      .limit(1);

    assertNoTreinoError('Treinos.requestedPlanVersion', error);

    const versionRow = (data || [])[0] as
      | { id: string; training_plan_id: string; is_active: boolean | null }
      | undefined;

    if (
      versionRow?.id &&
      versionRow.training_plan_id === normalizedPlanId &&
      versionRow.is_active !== false
    ) {
      return versionRow.id;
    }
  }

  const versionMap = await fetchActiveTrainingPlanVersions([normalizedPlanId]);
  return versionMap.get(normalizedPlanId)?.id || null;
}

async function fetchCompletionLogsForMonth(studentId?: string) {
  const bounds = monthBounds();
  let query = supabase
    .from(TABLES.TREINO_COMPLETION_LOGS)
    .select(
      'id, treino_id, student_id, completed_on, completed_at, completed_by_auth_user_id, completion_source, notes',
    )
    .gte('completed_on', bounds.start)
    .lte('completed_on', bounds.end);

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;
  assertNoTreinoError('Treinos.completionLogs', error);

  return (data || []) as TreinoCompletionLog[];
}

async function fetchExecutionSessionsForMonth(studentId?: string) {
  const bounds = monthBounds();
  let query = supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .select(
      `
        id,
        treino_id,
        student_id,
        execution_date,
        status,
        started_at,
        completed_at,
        last_activity_at,
        started_by_auth_user_id,
        completed_by_auth_user_id,
        completion_source,
        notes,
        items:treino_execution_items(
          id,
          session_id,
          exercise_index,
          exercise_name,
          planned_sets,
          planned_reps,
          planned_load,
          planned_rest,
          performed_sets,
          performed_reps,
          performed_load,
          completed,
          notes
        )
      `,
    )
    .gte('execution_date', bounds.start)
    .lte('execution_date', bounds.end)
    .order('execution_date', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;
  assertNoTreinoError('Treinos.executionSessions', error);

  return (data || [])
    .map(normalizeExecutionSession)
    .filter(Boolean) as TreinoExecutionSession[];
}

async function fetchTreinosForStudent(linkedAuthUserId: string): Promise<Treino[]> {
  const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
  if (!studentId) {
    return [];
  }

  const { data: studentRows, error: studentError } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, name, linked_auth_user_id')
    .eq('id', studentId)
    .limit(1);

  assertNoTreinoError('Treinos.studentIdentity', studentError);
  const studentRow = (studentRows || [])[0] as RawStudent | undefined;
  const studentName = studentRow?.name || 'Aluno';

  const treinoSelect = `
    id,
    student_id,
    training_plan_id,
    training_plan_version_id,
    created_by_auth_user_id,
    nome,
    objetivo,
    nivel,
    duracao_minutos,
    descricao,
    exercicios,
    ativo,
    sort_order,
    split_label,
    day_of_week,
    coach_notes,
    created_at,
    updated_at,
    training_plan:training_plans(id, name, weekly_frequency, description, active, created_at),
    training_plan_version:training_plan_versions(
      id,
      training_plan_id,
      version_number,
      objective,
      level,
      duration_weeks,
      coach_notes,
      is_active,
      created_at
    ),
    legacy_student:students(id, name, linked_auth_user_id)
  `;

  const [planAssignments, directAssignments, completionLogs, executionSessions] = await Promise.all([
    supabase
      .from(TABLES.STUDENT_TRAINING_PLANS)
      .select('training_plan_id')
      .eq('student_id', studentId)
      .eq('active', true),
    supabase
      .from(TABLES.TREINO_STUDENT_ASSIGNMENTS)
      .select('treino_id')
      .eq('student_id', studentId)
      .eq('active', true),
    fetchCompletionLogsForMonth(studentId),
    fetchExecutionSessionsForMonth(studentId),
  ]);

  assertNoTreinoError('Treinos.studentPlanAssignments', planAssignments.error);
  assertNoTreinoError('Treinos.directAssignments', directAssignments.error);

  const planIds = (planAssignments.data || [])
    .map((row: any) => row.training_plan_id)
    .filter(Boolean);
  const directTreinoIds = (directAssignments.data || [])
    .map((row: any) => row.treino_id)
    .filter(Boolean);

  const queries = [
    supabase
      .from(TABLES.TREINOS)
      .select(treinoSelect)
      .eq('student_id', studentId),
  ];

  if (planIds.length > 0) {
    queries.push(
      supabase
        .from(TABLES.TREINOS)
        .select(treinoSelect)
        .in('training_plan_id', planIds),
    );
  }

  if (directTreinoIds.length > 0) {
    queries.push(
      supabase
        .from(TABLES.TREINOS)
        .select(treinoSelect)
        .in('id', directTreinoIds),
    );
  }

  const results = await Promise.all(queries);
  results.forEach((result, index) => {
    assertNoTreinoError(`Treinos.studentQuery.${index}`, result.error);
  });

  const merged = new Map<string, any>();
  results.forEach((result) => {
    (result.data || []).forEach((item: any) => {
      if (item.ativo === false) {
        return;
      }

      merged.set(item.id, item);
    });
  });

  const completionLogsByTreino = new Map<string, TreinoCompletionLog[]>();
  completionLogs.forEach((log) => {
    const current = completionLogsByTreino.get(log.treino_id) || [];
    current.push(log);
    completionLogsByTreino.set(log.treino_id, current);
  });

  const todayKey = isoDate(new Date());
  const todayExecutionByTreino = new Map<string, TreinoExecutionSession>();
  executionSessions.forEach((session) => {
    if (session.execution_date === todayKey && session.status !== 'cancelled') {
      todayExecutionByTreino.set(session.treino_id, session);
    }
  });

  return Array.from(merged.values())
    .sort((a, b) => {
      const aSort = a.sort_order ?? 0;
      const bSort = b.sort_order ?? 0;
      if (aSort !== bSort) {
        return aSort - bSort;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map((item) =>
      mapTreinoRow(item, {
        legacyStudent: item.legacy_student
          ? normalizeAssignedStudent(item.legacy_student, 'legacy')
          : null,
        directStudents: [
          {
            id: studentId,
            name: item.legacy_student?.name || studentName,
            linked_auth_user_id: linkedAuthUserId,
            assignment_source:
              directTreinoIds.includes(item.id) || item.student_id === studentId ? 'direct' : 'plan',
          },
        ],
        planStudents: [],
        completionLogs: completionLogsByTreino.get(item.id) || [],
        currentExecution: todayExecutionByTreino.get(item.id) || null,
      }),
    );
}

async function fetchTreinosForStaff(): Promise<Treino[]> {
  const treinoSelect = `
    id,
    student_id,
    training_plan_id,
    training_plan_version_id,
    created_by_auth_user_id,
    nome,
    objetivo,
    nivel,
    duracao_minutos,
    descricao,
    exercicios,
    ativo,
    sort_order,
    split_label,
    day_of_week,
    coach_notes,
    created_at,
    updated_at,
    training_plan:training_plans(id, name, weekly_frequency, description, active, created_at),
    training_plan_version:training_plan_versions(
      id,
      training_plan_id,
      version_number,
      objective,
      level,
      duration_weeks,
      coach_notes,
      is_active,
      created_at
    ),
    legacy_student:students(id, name, linked_auth_user_id)
  `;

  const [treinoRows, directAssignments, planAssignments, completionLogs] = await Promise.all([
    supabase
      .from(TABLES.TREINOS)
      .select(treinoSelect)
      .order('created_at', { ascending: false }),
    supabase
      .from(TABLES.TREINO_STUDENT_ASSIGNMENTS)
      .select('treino_id, student:students(id, name, linked_auth_user_id)')
      .eq('active', true),
    fetchTrainingPlanAssignments(),
    fetchCompletionLogsForMonth(),
  ]);

  assertNoTreinoError('Treinos.staffRows', treinoRows.error);
  assertNoTreinoError('Treinos.staffDirectAssignments', directAssignments.error);

  const directByTreino = new Map<string, TreinoAssignedStudent[]>();
  (directAssignments.data || []).forEach((row: any) => {
    const studentRaw = Array.isArray(row.student) ? row.student[0] : row.student;
    const student = normalizeAssignedStudent(studentRaw, 'direct');
    if (!student) {
      return;
    }

    const current = directByTreino.get(row.treino_id) || [];
    current.push(student);
    directByTreino.set(row.treino_id, current);
  });

  const planStudentsByPlanId = new Map<string, TreinoAssignedStudent[]>();
  planAssignments.forEach((row: any) => {
    const studentRaw = Array.isArray(row.student) ? row.student[0] : row.student;
    const student = normalizeAssignedStudent(studentRaw, 'plan');
    if (!student) {
      return;
    }

    const current = planStudentsByPlanId.get(row.training_plan_id) || [];
    current.push(student);
    planStudentsByPlanId.set(row.training_plan_id, current);
  });

  const completionLogsByTreino = new Map<string, TreinoCompletionLog[]>();
  completionLogs.forEach((log) => {
    const current = completionLogsByTreino.get(log.treino_id) || [];
    current.push(log);
    completionLogsByTreino.set(log.treino_id, current);
  });

  return (treinoRows.data || []).map((item: any) =>
    mapTreinoRow(item, {
      legacyStudent: item.legacy_student
        ? normalizeAssignedStudent(item.legacy_student, 'legacy')
        : null,
      directStudents: directByTreino.get(item.id) || [],
      planStudents: item.training_plan_id ? planStudentsByPlanId.get(item.training_plan_id) || [] : [],
      completionLogs: completionLogsByTreino.get(item.id) || [],
    }),
  );
}

export async function fetchTreinos(linkedAuthUserId?: string): Promise<Treino[]> {
  if (linkedAuthUserId) {
    return fetchTreinosForStudent(linkedAuthUserId);
  }

  return fetchTreinosForStaff();
}

export async function fetchAlunosParaTreino(linkedAuthUserId?: string): Promise<StudentListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('id, name, linked_auth_user_id')
    .order('name', { ascending: true });

  if (linkedAuthUserId) {
    query = query.eq('linked_auth_user_id', linkedAuthUserId);
  }

  const { data, error } = await query;
  assertNoTreinoError('Treinos.alunosParaTreino', error);

  return (data || []).map(mapStudentToListItem);
}

export async function fetchTrainingPlans(): Promise<TrainingPlan[]> {
  const [plansRes, assignmentsRes, treinosRes, versionsMap] = await Promise.all([
    supabase
      .from(TABLES.TRAINING_PLANS)
      .select('id, name, weekly_frequency, description, active, created_at')
      .order('weekly_frequency', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from(TABLES.STUDENT_TRAINING_PLANS)
      .select('training_plan_id')
      .eq('active', true),
    supabase
      .from(TABLES.TREINOS)
      .select('training_plan_id')
      .eq('ativo', true),
    fetchActiveTrainingPlanVersions(),
  ]);

  assertNoTreinoError('Treinos.trainingPlans', plansRes.error);
  assertNoTreinoError('Treinos.trainingPlanAssignments', assignmentsRes.error);
  assertNoTreinoError('Treinos.trainingPlanTreinos', treinosRes.error);

  const studentCounts = new Map<string, number>();
  (assignmentsRes.data || []).forEach((row: any) => {
    studentCounts.set(row.training_plan_id, (studentCounts.get(row.training_plan_id) || 0) + 1);
  });

  const treinoCounts = new Map<string, number>();
  (treinosRes.data || []).forEach((row: any) => {
    if (!row.training_plan_id) {
      return;
    }
    treinoCounts.set(row.training_plan_id, (treinoCounts.get(row.training_plan_id) || 0) + 1);
  });

  return (plansRes.data || []).map((row: RawTrainingPlan) => ({
    ...mapTrainingPlanWithVersion(row, versionsMap.get(row.id)),
    students_count: studentCounts.get(row.id) || 0,
    treinos_count: treinoCounts.get(row.id) || 0,
  }));
}

export async function fetchStudentIdsForTrainingPlan(trainingPlanId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENT_TRAINING_PLANS)
    .select('student_id')
    .eq('training_plan_id', trainingPlanId)
    .eq('active', true);

  assertNoTreinoError('Treinos.trainingPlanStudents', error);
  return (data || []).map((row: any) => row.student_id).filter(Boolean);
}

export async function fetchActiveTrainingPlanForStudent(
  linkedAuthUserId: string,
): Promise<TrainingPlan | null> {
  const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
  if (!studentId) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.STUDENT_TRAINING_PLANS)
    .select('training_plan:training_plans(id, name, weekly_frequency, description, active, created_at)')
    .eq('student_id', studentId)
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  assertNoTreinoError('Treinos.activeTrainingPlan', error);
  const plan = normalizeTrainingPlan((data as any)?.training_plan);
  if (!plan) {
    return null;
  }

  const versionMap = await fetchActiveTrainingPlanVersions([plan.id]);
  return {
    ...plan,
    active_version: versionMap.get(plan.id) || null,
  };
}

async function createTrainingPlanVersion(params: {
  trainingPlanId: string;
  createdByAuthUserId: string;
  objective?: string | null;
  level?: string | null;
  durationWeeks?: number | null;
  coachNotes?: string | null;
}): Promise<void> {
  const { data: currentVersions, error: currentVersionsError } = await supabase
    .from(TABLES.TRAINING_PLAN_VERSIONS)
    .select('id, version_number')
    .eq('training_plan_id', params.trainingPlanId)
    .eq('is_active', true)
    .order('version_number', { ascending: false })
    .limit(1);

  assertNoTreinoError('Treinos.fetchCurrentPlanVersion', currentVersionsError);

  const currentVersion = (currentVersions || [])[0] as
    | { id: string; version_number: number }
    | undefined;

  if (currentVersion?.id) {
    const { error: deactivateError } = await supabase
      .from(TABLES.TRAINING_PLAN_VERSIONS)
      .update({ is_active: false })
      .eq('id', currentVersion.id);

    assertNoTreinoError('Treinos.deactivateCurrentPlanVersion', deactivateError);
  }

  const nextVersionNumber = (currentVersion?.version_number || 0) + 1;

  const { error: insertError } = await supabase.from(TABLES.TRAINING_PLAN_VERSIONS).insert([
    {
      training_plan_id: params.trainingPlanId,
      version_number: nextVersionNumber,
      objective: params.objective?.trim() || null,
      level: params.level?.trim() || null,
      duration_weeks: params.durationWeeks || null,
      coach_notes: params.coachNotes?.trim() || null,
      is_active: true,
      published_at: new Date().toISOString(),
      created_by_auth_user_id: params.createdByAuthUserId,
    },
  ]);

  assertNoTreinoError('Treinos.insertPlanVersion', insertError);
}

export async function createTrainingPlan(payload: TrainingPlanPayload): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const name = payload.name?.trim();
  if (!name) {
    throw new Error('O nome do plano de treino e obrigatorio.');
  }

  const weeklyFrequency = Number(payload.weekly_frequency);
  if (!Number.isFinite(weeklyFrequency) || weeklyFrequency < 1 || weeklyFrequency > 7) {
    throw new Error('A frequencia semanal deve ficar entre 1 e 7.');
  }

  const { data, error } = await supabase
    .from(TABLES.TRAINING_PLANS)
    .insert([
      {
        name,
        weekly_frequency: weeklyFrequency,
        description: payload.description?.trim() || null,
        active: payload.active !== false,
        created_by_auth_user_id: user.id,
      },
    ])
    .select('id')
    .single();

  assertNoTreinoError('Treinos.createTrainingPlan', error);

  if (!data?.id) {
    throw new Error('Nao foi possivel identificar o plano salvo.');
  }

  await createTrainingPlanVersion({
    trainingPlanId: data.id,
    createdByAuthUserId: user.id,
    objective: payload.objective,
    level: payload.level,
    durationWeeks: payload.duration_weeks,
    coachNotes: payload.coach_notes,
  });
}

export async function updateTrainingPlan(
  planId: string,
  payload: TrainingPlanPayload,
): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const { error } = await supabase
    .from(TABLES.TRAINING_PLANS)
    .update({
      name: payload.name?.trim(),
      weekly_frequency: Number(payload.weekly_frequency),
      description: payload.description?.trim() || null,
      active: payload.active !== false,
    })
    .eq('id', planId);

  assertNoTreinoError('Treinos.updateTrainingPlan', error);

  await createTrainingPlanVersion({
    trainingPlanId: planId,
    createdByAuthUserId: user.id,
    objective: payload.objective,
    level: payload.level,
    durationWeeks: payload.duration_weeks,
    coachNotes: payload.coach_notes,
  });
}

export async function syncStudentsToTrainingPlan(
  trainingPlanId: string,
  studentIds: string[],
): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);
  const todayKey = getLocalDateInputValue();

  const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

  const { error: deactivateError } = await supabase
    .from(TABLES.STUDENT_TRAINING_PLANS)
    .update({ active: false, end_date: todayKey })
    .eq('training_plan_id', trainingPlanId)
    .eq('active', true);

  assertNoTreinoError('Treinos.deactivatePlanStudents', deactivateError);

  for (const studentId of uniqueStudentIds) {
    const { error: clearCurrentError } = await supabase
      .from(TABLES.STUDENT_TRAINING_PLANS)
      .update({ active: false, end_date: todayKey })
      .eq('student_id', studentId)
      .eq('active', true);

    assertNoTreinoError('Treinos.clearCurrentStudentPlan', clearCurrentError);

    const { error: insertError } = await supabase
      .from(TABLES.STUDENT_TRAINING_PLANS)
      .insert([
        {
          student_id: studentId,
          training_plan_id: trainingPlanId,
          active: true,
          start_date: todayKey,
          created_by_auth_user_id: user.id,
        },
      ]);

    assertNoTreinoError('Treinos.insertStudentPlan', insertError);
  }
}

export async function saveTreino(treinoData: TreinoFormData, editingId?: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const nome = treinoData.nome?.trim();
  if (!nome) {
    throw new Error('O nome do treino e obrigatorio.');
  }

  const assignedStudentIds = Array.from(
    new Set((treinoData.assigned_student_ids || []).filter(Boolean)),
  );

  const trainingPlanId = treinoData.training_plan_id?.trim() || null;
  const trainingPlanVersionId = await resolveTrainingPlanVersionId(
    trainingPlanId,
    treinoData.training_plan_version_id || null,
  );
  const payload = {
    nome,
    objetivo: treinoData.objetivo?.trim() || null,
    nivel: treinoData.nivel?.trim() || null,
    duracao_minutos: treinoData.duracao_minutos || null,
    descricao: treinoData.descricao?.trim() || null,
    exercicios: Array.isArray(treinoData.exercicios) ? treinoData.exercicios : [],
    ativo: treinoData.ativo !== false,
    training_plan_id: trainingPlanId,
    training_plan_version_id: trainingPlanVersionId,
    created_by_auth_user_id: user.id,
    sort_order: treinoData.sort_order || 0,
    split_label: treinoData.split_label?.trim() || null,
    day_of_week:
      treinoData.day_of_week == null
        ? null
        : Number(treinoData.day_of_week),
    coach_notes: treinoData.coach_notes?.trim() || null,
    student_id: null,
  };

  let treinoId = editingId || treinoData.id;

  if (treinoId) {
    const { error } = await supabase.from(TABLES.TREINOS).update(payload).eq('id', treinoId);
    assertNoTreinoError('Treinos.updateTreino', error);
  } else {
    const { data, error } = await supabase
      .from(TABLES.TREINOS)
      .insert([payload])
      .select('id')
      .single();

    assertNoTreinoError('Treinos.createTreino', error);
    treinoId = data?.id;
  }

  if (!treinoId) {
    throw new Error('Nao foi possivel identificar o treino salvo.');
  }

  const { error: deleteAssignmentsError } = await supabase
    .from(TABLES.TREINO_STUDENT_ASSIGNMENTS)
    .delete()
    .eq('treino_id', treinoId);

  assertNoTreinoError('Treinos.clearAssignments', deleteAssignmentsError);

  if (assignedStudentIds.length > 0) {
    const { error: insertAssignmentsError } = await supabase
      .from(TABLES.TREINO_STUDENT_ASSIGNMENTS)
      .insert(
        assignedStudentIds.map((studentId) => ({
          treino_id: treinoId,
          student_id: studentId,
          active: true,
          assigned_by_auth_user_id: user.id,
        })),
      );

    assertNoTreinoError('Treinos.insertAssignments', insertAssignmentsError);
  }
}

export async function startTreinoExecution(params: {
  treinoId: string;
  studentId?: string;
}): Promise<TreinoExecutionSession> {
  const user = await getAuthenticatedUser();
  const ownStudentId = await findStudentIdByLinkedAuthUserId(user.id);
  const effectiveStudentId = params.studentId || ownStudentId;

  if (!effectiveStudentId) {
    throw new Error('Aluno vinculado nao encontrado.');
  }

  const executionDate = isoDate(new Date());

  const { data: existingRows, error: existingError } = await supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .select(
      `
        id,
        treino_id,
        student_id,
        execution_date,
        status,
        started_at,
        completed_at,
        last_activity_at,
        started_by_auth_user_id,
        completed_by_auth_user_id,
        completion_source,
        notes,
        items:treino_execution_items(
          id,
          session_id,
          exercise_index,
          exercise_name,
          planned_sets,
          planned_reps,
          planned_load,
          planned_rest,
          performed_sets,
          performed_reps,
          performed_load,
          completed,
          notes
        )
      `,
    )
    .eq('treino_id', params.treinoId)
    .eq('student_id', effectiveStudentId)
    .eq('execution_date', executionDate)
    .limit(1);

  assertNoTreinoError('Treinos.fetchExecutionSession', existingError);

  const existingSession = normalizeExecutionSession((existingRows || [])[0]);
  if (existingSession) {
    return existingSession;
  }

  const treinos = await fetchTreinos(user.id);
  const treino = treinos.find((item) => item.id === params.treinoId);
  if (!treino) {
    throw new Error('Treino nao encontrado para iniciar execucao.');
  }

  const completionSource = ownStudentId === effectiveStudentId ? 'student' : 'staff';

  const { data: sessionRow, error: sessionError } = await supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .insert([
      {
        treino_id: params.treinoId,
        student_id: effectiveStudentId,
        execution_date: executionDate,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        started_by_auth_user_id: user.id,
        completion_source: completionSource,
      },
    ])
    .select(
      `
        id,
        treino_id,
        student_id,
        execution_date,
        status,
        started_at,
        completed_at,
        last_activity_at,
        started_by_auth_user_id,
        completed_by_auth_user_id,
        completion_source,
        notes
      `,
    )
    .single();

  assertNoTreinoError('Treinos.insertExecutionSession', sessionError);

  const sessionId = sessionRow?.id;
  if (!sessionId) {
    throw new Error('Nao foi possivel abrir a execucao do treino.');
  }

  const defaultItems = buildExecutionItemsFromTreino(treino);
  if (defaultItems.length > 0) {
    const { error: itemsError } = await supabase.from(TABLES.TREINO_EXECUTION_ITEMS).insert(
      defaultItems.map((item) => ({
        session_id: sessionId,
        exercise_index: item.exercise_index,
        exercise_name: item.exercise_name,
        planned_sets: item.planned_sets,
        planned_reps: item.planned_reps,
        planned_load: item.planned_load,
        planned_rest: item.planned_rest,
        performed_sets: item.performed_sets,
        performed_reps: item.performed_reps,
        performed_load: item.performed_load,
        completed: item.completed,
        notes: item.notes,
      })),
    );

    assertNoTreinoError('Treinos.insertExecutionItems', itemsError);
  }

  return {
    ...normalizeExecutionSession({
      ...sessionRow,
      items: defaultItems,
    })!,
  };
}

export async function saveTreinoExecution(params: {
  sessionId: string;
  items: TreinoExecutionItem[];
  notes?: string;
  markCompleted?: boolean;
}): Promise<TreinoExecutionSession> {
  const user = await getAuthenticatedUser();

  const { data: sessionRows, error: sessionFetchError } = await supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .select('id, treino_id, student_id, execution_date, status')
    .eq('id', params.sessionId)
    .limit(1);

  assertNoTreinoError('Treinos.loadExecutionBeforeSave', sessionFetchError);

  const sessionRow = (sessionRows || [])[0] as
    | { id: string; treino_id: string; student_id: string; execution_date: string; status: string }
    | undefined;

  if (!sessionRow?.id) {
    throw new Error('Execucao de treino nao encontrada.');
  }

  const sanitizedItems = params.items
    .slice()
    .sort((a, b) => a.exercise_index - b.exercise_index)
    .map((item, index) => ({
      session_id: params.sessionId,
      exercise_index: item.exercise_index ?? index,
      exercise_name: item.exercise_name?.trim() || `Exercicio ${index + 1}`,
      planned_sets: item.planned_sets ?? null,
      planned_reps: item.planned_reps ?? null,
      planned_load: item.planned_load ?? null,
      planned_rest: item.planned_rest ?? null,
      performed_sets: item.performed_sets ?? null,
      performed_reps: item.performed_reps ?? null,
      performed_load: item.performed_load ?? null,
      completed: item.completed === true,
      notes: item.notes?.trim() || null,
    }));

  if (sanitizedItems.length > 0) {
    const { error: itemsError } = await supabase
      .from(TABLES.TREINO_EXECUTION_ITEMS)
      .upsert(sanitizedItems, { onConflict: 'session_id,exercise_index' });

    assertNoTreinoError('Treinos.upsertExecutionItems', itemsError);
  }

  const allCompleted = sanitizedItems.length > 0 && sanitizedItems.every((item) => item.completed);
  const nextStatus = params.markCompleted || allCompleted ? 'completed' : 'in_progress';

  const { error: sessionUpdateError } = await supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .update({
      status: nextStatus,
      notes: params.notes?.trim() || null,
      last_activity_at: new Date().toISOString(),
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
      completed_by_auth_user_id: nextStatus === 'completed' ? user.id : null,
    })
    .eq('id', params.sessionId);

  assertNoTreinoError('Treinos.updateExecutionSession', sessionUpdateError);

  if (nextStatus === 'completed') {
    await setTreinoCompletion({
      treinoId: sessionRow.treino_id,
      studentId: sessionRow.student_id,
      completed: true,
      completedOn: sessionRow.execution_date,
      notes: params.notes,
    });
  }

  const { data: refreshedRows, error: refreshedError } = await supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .select(
      `
        id,
        treino_id,
        student_id,
        execution_date,
        status,
        started_at,
        completed_at,
        last_activity_at,
        started_by_auth_user_id,
        completed_by_auth_user_id,
        completion_source,
        notes,
        items:treino_execution_items(
          id,
          session_id,
          exercise_index,
          exercise_name,
          planned_sets,
          planned_reps,
          planned_load,
          planned_rest,
          performed_sets,
          performed_reps,
          performed_load,
          completed,
          notes
        )
      `,
    )
    .eq('id', params.sessionId)
    .limit(1);

  assertNoTreinoError('Treinos.reloadExecutionSession', refreshedError);

  const refreshed = normalizeExecutionSession((refreshedRows || [])[0]);
  if (!refreshed) {
    throw new Error('Nao foi possivel atualizar a execucao do treino.');
  }

  return refreshed;
}

export async function setTreinoCompletion(params: {
  treinoId: string;
  studentId?: string;
  completed: boolean;
  completedOn?: string;
  notes?: string;
}): Promise<void> {
  const user = await getAuthenticatedUser();
  const isOwnStudent = await findStudentIdByLinkedAuthUserId(user.id);
  const effectiveStudentId = params.studentId || isOwnStudent;

  if (!effectiveStudentId) {
    throw new Error('Aluno vinculado nao encontrado.');
  }

  const completedOn = params.completedOn || getLocalDateInputValue();

  if (params.completed) {
    const completionSource = isOwnStudent === effectiveStudentId ? 'student' : 'staff';

    const { data: sessionRows, error: sessionLookupError } = await supabase
      .from(TABLES.TREINO_EXECUTION_SESSIONS)
      .select('id')
      .eq('treino_id', params.treinoId)
      .eq('student_id', effectiveStudentId)
      .eq('execution_date', completedOn)
      .limit(1);

    assertNoTreinoError('Treinos.lookupExecutionBeforeComplete', sessionLookupError);

    const existingSessionId = (sessionRows || [])[0]?.id as string | undefined;

    if (existingSessionId) {
      const { error: sessionUpdateError } = await supabase
        .from(TABLES.TREINO_EXECUTION_SESSIONS)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by_auth_user_id: user.id,
          completion_source: completionSource,
          notes: params.notes?.trim() || null,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', existingSessionId);

      assertNoTreinoError('Treinos.syncExecutionComplete', sessionUpdateError);
    } else {
      const { error: sessionInsertError } = await supabase
        .from(TABLES.TREINO_EXECUTION_SESSIONS)
        .insert([
          {
            treino_id: params.treinoId,
            student_id: effectiveStudentId,
            execution_date: completedOn,
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            started_by_auth_user_id: user.id,
            completed_by_auth_user_id: user.id,
            completion_source: completionSource,
            notes: params.notes?.trim() || null,
          },
        ]);

      assertNoTreinoError('Treinos.insertExecutionFromCompletion', sessionInsertError);
    }

    const { error } = await supabase.from(TABLES.TREINO_COMPLETION_LOGS).upsert(
      [
        {
          treino_id: params.treinoId,
          student_id: effectiveStudentId,
          completed_on: completedOn,
          completed_at: new Date().toISOString(),
          completed_by_auth_user_id: user.id,
          completion_source: completionSource,
          notes: params.notes?.trim() || null,
        },
      ],
      { onConflict: 'treino_id,student_id,completed_on' },
    );

    assertNoTreinoError('Treinos.complete', error);
    return;
  }

  const { error } = await supabase
    .from(TABLES.TREINO_COMPLETION_LOGS)
    .delete()
    .eq('treino_id', params.treinoId)
    .eq('student_id', effectiveStudentId)
    .eq('completed_on', completedOn);

  assertNoTreinoError('Treinos.uncomplete', error);

  const { error: sessionResetError } = await supabase
    .from(TABLES.TREINO_EXECUTION_SESSIONS)
    .update({
      status: 'cancelled',
      completed_at: null,
      completed_by_auth_user_id: null,
      last_activity_at: new Date().toISOString(),
    })
    .eq('treino_id', params.treinoId)
    .eq('student_id', effectiveStudentId)
    .eq('execution_date', completedOn);

  assertNoTreinoError('Treinos.uncompleteSession', sessionResetError);
}

export async function fetchStudentMonthlyProgress(
  linkedAuthUserId: string,
): Promise<StudentMonthlyTrainingProgress | null> {
  const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
  if (!studentId) {
    return null;
  }

  const bounds = monthBounds();
  const currentWeek = weekBounds();
  const [planAssignments, completionLogs, treinos] = await Promise.all([
    supabase
      .from(TABLES.STUDENT_TRAINING_PLANS)
      .select('training_plan:training_plans(id, name, weekly_frequency)')
      .eq('student_id', studentId)
      .eq('active', true)
      .limit(1),
    fetchCompletionLogsForMonth(studentId),
    fetchTreinos(linkedAuthUserId),
  ]);

  assertNoTreinoError('Treinos.progressPlan', planAssignments.error);

  const trainingPlan = normalizeTrainingPlan(
    ((planAssignments.data || [])[0] as any)?.training_plan,
  );

  const trainedDays = new Set(completionLogs.map((log) => log.completed_on)).size;
  const trainedDaysKeys = new Set(completionLogs.map((log) => log.completed_on));
  const completedWorkouts = completionLogs
    .map((log) => {
      const treino = treinos.find((item) => item.id === log.treino_id);
      return treino
        ? {
            treino_id: treino.id,
            treino_nome: treino.nome,
            completed_on: log.completed_on,
          }
        : null;
    })
    .filter(Boolean) as StudentMonthlyTrainingProgress['completed_workouts'];

  const elapsedDays = bounds.effectiveEnd.getDate();
  const expectedDays = trainingPlan
    ? Math.max(0, Math.ceil((trainingPlan.weekly_frequency * elapsedDays) / 7))
    : 0;
  const missedDays = Math.max(expectedDays - trainedDays, 0);
  const completionRate =
    expectedDays > 0 ? Math.min(100, Math.round((trainedDays / expectedDays) * 100)) : 0;
  const thisWeekTrainedDays = completionLogs.filter(
    (log) => log.completed_on >= currentWeek.start && log.completed_on <= currentWeek.end,
  );

  let currentStreak = 0;
  let cursor = new Date();
  while (true) {
    const dateKey = isoDate(cursor);
    if (!trainedDaysKeys.has(dateKey)) {
      break;
    }
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    student_id: studentId,
    month_key: `${bounds.start.slice(0, 7)}`,
    expected_days: expectedDays,
    trained_days: trainedDays,
    missed_days: missedDays,
    completed_workouts_count: completionLogs.length,
    completion_rate: completionRate,
    current_streak: currentStreak,
    this_week_trained_days: new Set(thisWeekTrainedDays.map((log) => log.completed_on)).size,
    completed_workouts: completedWorkouts,
  };
}
