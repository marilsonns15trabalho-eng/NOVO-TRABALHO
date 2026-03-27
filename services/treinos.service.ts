import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { mapStudentToListItem } from '@/lib/mappers';
import { findStudentIdByLinkedAuthUserId } from '@/lib/student-access';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';
import type { StudentListItem } from '@/types/common';
import type {
  StudentMonthlyTrainingProgress,
  TrainingPlan,
  Treino,
  TreinoAssignedStudent,
  TreinoCompletionLog,
  TreinoFormData,
} from '@/types/treino';

type TrainingPlanPayload = {
  name: string;
  weekly_frequency: number;
  description?: string | null;
  active?: boolean;
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
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    effectiveEnd,
    totalDaysInMonth: end.getDate(),
  };
}

function assertNoTreinoError(label: string, error: { message?: string } | null) {
  if (error) {
    throw new Error(`${label}: ${error.message || 'erro desconhecido'}`);
  }
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

function mapTreinoRow(
  item: any,
  options?: {
    legacyStudent?: TreinoAssignedStudent | null;
    directStudents?: TreinoAssignedStudent[];
    planStudents?: TreinoAssignedStudent[];
    completionLogs?: TreinoCompletionLog[];
  },
): Treino {
  const completionLogs = options?.completionLogs || [];
  const completionsTodayKeys = new Set(
    completionLogs
      .filter((log) => log.completed_on === new Date().toISOString().split('T')[0])
      .map((log) => log.student_id),
  );

  return {
    id: item.id,
    student_id: item.student_id ?? null,
    training_plan_id: item.training_plan_id ?? null,
    created_by_auth_user_id: item.created_by_auth_user_id ?? null,
    nome: item.nome,
    objetivo: item.objetivo ?? '',
    nivel: item.nivel ?? '',
    duracao_minutos: item.duracao_minutos ?? undefined,
    descricao: item.descricao ?? '',
    exercicios: Array.isArray(item.exercicios) ? item.exercicios : [],
    ativo: item.ativo !== false,
    sort_order: item.sort_order ?? 0,
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
    assigned_students: mergeAssignedStudents(
      options?.legacyStudent ?? null,
      options?.directStudents || [],
      options?.planStudents || [],
      completionsTodayKeys,
    ),
    completion_logs: completionLogs,
    completed_today: completionLogs.some(
      (log) => log.completed_on === new Date().toISOString().split('T')[0],
    ),
    completions_this_month: completionLogs.length,
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

async function fetchTreinosForStudent(linkedAuthUserId: string): Promise<Treino[]> {
  const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
  if (!studentId) {
    return [];
  }

  const [planAssignments, directAssignments, completionLogs] = await Promise.all([
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
      .select(
        `
          id,
          student_id,
          training_plan_id,
          created_by_auth_user_id,
          nome,
          objetivo,
          nivel,
          duracao_minutos,
          descricao,
          exercicios,
          ativo,
          sort_order,
          created_at,
          updated_at,
          training_plan:training_plans(id, name, weekly_frequency, description, active, created_at),
          legacy_student:students(id, name, linked_auth_user_id)
        `,
      )
      .eq('student_id', studentId),
  ];

  if (planIds.length > 0) {
    queries.push(
      supabase
        .from(TABLES.TREINOS)
        .select(
          `
            id,
            student_id,
            training_plan_id,
            created_by_auth_user_id,
            nome,
            objetivo,
            nivel,
            duracao_minutos,
            descricao,
            exercicios,
            ativo,
            sort_order,
            created_at,
            updated_at,
            training_plan:training_plans(id, name, weekly_frequency, description, active, created_at),
            legacy_student:students(id, name, linked_auth_user_id)
          `,
        )
        .in('training_plan_id', planIds),
    );
  }

  if (directTreinoIds.length > 0) {
    queries.push(
      supabase
        .from(TABLES.TREINOS)
        .select(
          `
            id,
            student_id,
            training_plan_id,
            created_by_auth_user_id,
            nome,
            objetivo,
            nivel,
            duracao_minutos,
            descricao,
            exercicios,
            ativo,
            sort_order,
            created_at,
            updated_at,
            training_plan:training_plans(id, name, weekly_frequency, description, active, created_at),
            legacy_student:students(id, name, linked_auth_user_id)
          `,
        )
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
            name: item.legacy_student?.name || 'Aluno',
            linked_auth_user_id: linkedAuthUserId,
            assignment_source:
              directTreinoIds.includes(item.id) || item.student_id === studentId ? 'direct' : 'plan',
          },
        ],
        planStudents: [],
        completionLogs: completionLogsByTreino.get(item.id) || [],
      }),
    );
}

async function fetchTreinosForStaff(): Promise<Treino[]> {
  const [treinoRows, directAssignments, planAssignments, completionLogs] = await Promise.all([
    supabase
      .from(TABLES.TREINOS)
      .select(
        `
          id,
          student_id,
          training_plan_id,
          created_by_auth_user_id,
          nome,
          objetivo,
          nivel,
          duracao_minutos,
          descricao,
          exercicios,
          ativo,
          sort_order,
          created_at,
          updated_at,
          training_plan:training_plans(id, name, weekly_frequency, description, active, created_at),
          legacy_student:students(id, name, linked_auth_user_id)
        `,
      )
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
  const [plansRes, assignmentsRes, treinosRes] = await Promise.all([
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
    ...normalizeTrainingPlan(row)!,
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
  return normalizeTrainingPlan((data as any)?.training_plan);
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

  const { error } = await supabase.from(TABLES.TRAINING_PLANS).insert([
    {
      name,
      weekly_frequency: weeklyFrequency,
      description: payload.description?.trim() || null,
      active: payload.active !== false,
      created_by_auth_user_id: user.id,
    },
  ]);

  assertNoTreinoError('Treinos.createTrainingPlan', error);
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
}

export async function syncStudentsToTrainingPlan(
  trainingPlanId: string,
  studentIds: string[],
): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

  const { error: deactivateError } = await supabase
    .from(TABLES.STUDENT_TRAINING_PLANS)
    .update({ active: false, end_date: new Date().toISOString().split('T')[0] })
    .eq('training_plan_id', trainingPlanId)
    .eq('active', true);

  assertNoTreinoError('Treinos.deactivatePlanStudents', deactivateError);

  for (const studentId of uniqueStudentIds) {
    const { error: clearCurrentError } = await supabase
      .from(TABLES.STUDENT_TRAINING_PLANS)
      .update({ active: false, end_date: new Date().toISOString().split('T')[0] })
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
          start_date: new Date().toISOString().split('T')[0],
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

  const payload = {
    nome,
    objetivo: treinoData.objetivo?.trim() || null,
    nivel: treinoData.nivel?.trim() || null,
    duracao_minutos: treinoData.duracao_minutos || null,
    descricao: treinoData.descricao?.trim() || null,
    exercicios: Array.isArray(treinoData.exercicios) ? treinoData.exercicios : [],
    ativo: treinoData.ativo !== false,
    training_plan_id: treinoData.training_plan_id || null,
    created_by_auth_user_id: user.id,
    sort_order: treinoData.sort_order || 0,
    student_id:
      assignedStudentIds.length === 1 && !treinoData.training_plan_id ? assignedStudentIds[0] : null,
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

  const completedOn = params.completedOn || new Date().toISOString().split('T')[0];

  if (params.completed) {
    const completionSource = isOwnStudent === effectiveStudentId ? 'student' : 'staff';
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
}

export async function fetchStudentMonthlyProgress(
  linkedAuthUserId: string,
): Promise<StudentMonthlyTrainingProgress | null> {
  const studentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
  if (!studentId) {
    return null;
  }

  const bounds = monthBounds();
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

  return {
    student_id: studentId,
    month_key: `${bounds.start.slice(0, 7)}`,
    expected_days: expectedDays,
    trained_days: trainedDays,
    missed_days: missedDays,
    completed_workouts_count: completionLogs.length,
    completion_rate: completionRate,
    completed_workouts: completedWorkouts,
  };
}
