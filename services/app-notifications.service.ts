import { TABLES } from '@/lib/constants';
import { describeAvaliacaoEvolution } from '@/lib/avaliacao-evolution';
import { supabase } from '@/lib/supabase';
import type { Avaliacao } from '@/types/avaliacao';

export type PersistedNotificationType =
  | 'training_update'
  | 'workout_completion'
  | 'new_anamnese'
  | 'new_avaliacao'
  | 'avaliacao_evolution';

export interface PersistedNotificationItem {
  id: string;
  type: PersistedNotificationType;
  title: string;
  description: string;
  route: string;
  occurred_at: string;
  read_at?: string | null;
  payload?: Record<string, unknown>;
}

interface NotificationInsertPayload {
  recipient_user_id: string;
  actor_user_id: string;
  type: PersistedNotificationType;
  title: string;
  description: string;
  route: string;
  event_key?: string | null;
  student_id?: string | null;
  treino_id?: string | null;
  avaliacao_id?: string | null;
  anamnese_id?: string | null;
  payload?: Record<string, unknown>;
}

function normalizeStoredNotification(row: any): PersistedNotificationItem | null {
  if (!row?.id || !row?.type || !row?.title || !row?.description) {
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    route: row.route || '/dashboard',
    occurred_at: row.created_at,
    read_at: row.read_at ?? null,
    payload: row.payload || {},
  };
}

async function loadStudentRecipients(studentIds: string[]) {
  const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));
  if (uniqueStudentIds.length === 0) {
    return new Map<string, { userId: string; name: string }>();
  }

  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, name, linked_auth_user_id')
    .in('id', uniqueStudentIds);

  if (error) {
    throw new Error(`AppNotifications.studentRecipients: ${error.message}`);
  }

  return new Map(
    (data || [])
      .filter((row: any) => row?.id && row?.linked_auth_user_id)
      .map((row: any) => [
        row.id,
        {
          userId: row.linked_auth_user_id,
          name: row.name || 'Aluno',
        },
      ]),
  );
}

async function loadStaffRecipients() {
  const { data, error } = await supabase.rpc('notification_staff_users');

  if (error) {
    throw new Error(`AppNotifications.staffRecipients: ${error.message}`);
  }

  return (data || [])
    .filter((row: any) => row?.id)
    .map((row: any) => ({
      userId: row.id as string,
      role: row.role as 'admin' | 'professor',
      displayName: row.display_name || null,
    }));
}

async function insertNotifications(rows: NotificationInsertPayload[]) {
  const payload = rows
    .filter((row) => row.recipient_user_id && row.actor_user_id)
    .map((row) => ({
      recipient_user_id: row.recipient_user_id,
      actor_user_id: row.actor_user_id,
      type: row.type,
      title: row.title,
      description: row.description,
      route: row.route,
      event_key: row.event_key || null,
      student_id: row.student_id || null,
      treino_id: row.treino_id || null,
      avaliacao_id: row.avaliacao_id || null,
      anamnese_id: row.anamnese_id || null,
      payload: row.payload || {},
    }));

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase.from(TABLES.APP_NOTIFICATIONS).insert(payload);
  if (error && error.code !== '23505') {
    throw new Error(`AppNotifications.insert: ${error.message}`);
  }
}

export async function fetchPersistedNotifications(
  userId: string,
  limit = 20,
): Promise<PersistedNotificationItem[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.APP_NOTIFICATIONS)
    .select('id, type, title, description, route, payload, read_at, created_at')
    .eq('recipient_user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`AppNotifications.fetch: ${error.message}`);
  }

  return (data || []).map(normalizeStoredNotification).filter(Boolean) as PersistedNotificationItem[];
}

export async function markPersistedNotificationsAsRead(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  const ids = Array.from(new Set(notificationIds.filter(Boolean)));
  if (!userId || ids.length === 0) {
    return;
  }

  const { error } = await supabase
    .from(TABLES.APP_NOTIFICATIONS)
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_user_id', userId)
    .in('id', ids)
    .is('read_at', null);

  if (error) {
    throw new Error(`AppNotifications.markRead: ${error.message}`);
  }
}

export function subscribeToPersistedNotifications(
  userId: string,
  callback: () => void,
  onInsert?: (item: PersistedNotificationItem) => void,
) {
  const channel = supabase.channel(
    `app_notifications_${userId}_${Math.random().toString(36).slice(2)}`,
  );

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: TABLES.APP_NOTIFICATIONS,
      filter: `recipient_user_id=eq.${userId}`,
    },
    (payload) => {
      if (payload.eventType === 'INSERT' && onInsert) {
        const item = normalizeStoredNotification(payload.new);
        if (item) {
          onInsert(item);
        }
      }

      callback();
    },
  );

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function emitTreinoUpdatedNotifications(params: {
  actorUserId: string;
  treinoId: string;
  treinoName: string;
  studentIds: string[];
}) {
  const recipients = await loadStudentRecipients(params.studentIds);
  const rows = Array.from(recipients.entries()).map(([studentId, recipient]) => ({
    recipient_user_id: recipient.userId,
    actor_user_id: params.actorUserId,
    type: 'training_update' as const,
      title: 'Treino atualizado',
      description: `Seu treino ${params.treinoName} foi atualizado. Confira as orientacoes antes de iniciar.`,
      route: '/aluno?section=treinos',
    student_id: studentId,
    treino_id: params.treinoId,
    payload: {
      treinoName: params.treinoName,
    },
  }));

  await insertNotifications(rows);
}

export async function emitTreinoCompletionNotifications(params: {
  actorUserId: string;
  treinoId: string;
  treinoName: string;
  studentId: string;
  completedOn: string;
  completionSource: 'student' | 'staff';
}) {
  const [studentRecipients, staffRecipients] = await Promise.all([
    loadStudentRecipients([params.studentId]),
    loadStaffRecipients(),
  ]);

  const student = studentRecipients.get(params.studentId);
  const rows: NotificationInsertPayload[] = [];

  if (student?.userId) {
    rows.push({
      recipient_user_id: student.userId,
      actor_user_id: params.actorUserId,
      type: 'workout_completion',
      title: params.completionSource === 'student' ? 'Treino concluido' : 'Treino confirmado pela equipe',
      description:
        params.completionSource === 'student'
          ? `Parabens! Voce concluiu ${params.treinoName}.`
          : `A equipe marcou ${params.treinoName} como concluido para voce.`,
      route: '/aluno?section=treinos',
      event_key: `workout-completion-${params.treinoId}-${params.studentId}-${params.completedOn}-${student.userId}`,
      student_id: params.studentId,
      treino_id: params.treinoId,
      payload: {
        treinoName: params.treinoName,
        completedOn: params.completedOn,
      },
    });
  }

  staffRecipients.forEach((staff: { userId: string; role: 'admin' | 'professor'; displayName: string | null }) => {
    rows.push({
      recipient_user_id: staff.userId,
      actor_user_id: params.actorUserId,
      type: 'workout_completion',
      title: 'Treino concluido',
      description:
        params.completionSource === 'student'
          ? `${student?.name || 'A aluna'} concluiu ${params.treinoName}.`
          : `${student?.name || 'A aluna'} teve ${params.treinoName} concluido pela equipe.`,
      route: '/dashboard/treinos',
      event_key: `workout-completion-${params.treinoId}-${params.studentId}-${params.completedOn}-${staff.userId}`,
      student_id: params.studentId,
      treino_id: params.treinoId,
      payload: {
        treinoName: params.treinoName,
        completedOn: params.completedOn,
        completionSource: params.completionSource,
      },
    });
  });

  await insertNotifications(rows);
}

export async function emitAnamneseCreatedNotification(params: {
  actorUserId: string;
  anamneseId: string;
  studentId: string;
}) {
  const recipients = await loadStudentRecipients([params.studentId]);
  const student = recipients.get(params.studentId);

  if (!student?.userId) {
    return;
  }

  await insertNotifications([
    {
      recipient_user_id: student.userId,
      actor_user_id: params.actorUserId,
      type: 'new_anamnese',
      title: 'Nova anamnese registrada',
      description: 'Sua nova anamnese ja foi registrada pela equipe.',
      route: '/aluno',
      event_key: `new-anamnese-${params.anamneseId}-${student.userId}`,
      student_id: params.studentId,
      anamnese_id: params.anamneseId,
    },
  ]);
}

export async function emitAvaliacaoCreatedNotifications(params: {
  actorUserId: string;
  avaliacaoId: string;
  studentId: string;
  currentAvaliacao: Pick<Avaliacao, 'percentual_gordura' | 'massa_magra' | 'cintura'>;
  previousAvaliacao?: Pick<Avaliacao, 'percentual_gordura' | 'massa_magra' | 'cintura'> | null;
}) {
  const recipients = await loadStudentRecipients([params.studentId]);
  const student = recipients.get(params.studentId);

  if (!student?.userId) {
    return;
  }

  const rows: NotificationInsertPayload[] = [
    {
      recipient_user_id: student.userId,
      actor_user_id: params.actorUserId,
      type: 'new_avaliacao',
      title: 'Nova avaliacao registrada',
      description: 'Sua nova avaliacao fisica ja esta disponivel no app.',
      route: '/aluno?section=avaliacoes',
      event_key: `new-avaliacao-${params.avaliacaoId}-${student.userId}`,
      student_id: params.studentId,
      avaliacao_id: params.avaliacaoId,
    },
  ];

  const evolutionDescription = describeAvaliacaoEvolution(
    params.currentAvaliacao,
    params.previousAvaliacao,
  );

  if (evolutionDescription) {
    rows.push({
      recipient_user_id: student.userId,
      actor_user_id: params.actorUserId,
      type: 'avaliacao_evolution',
      title: 'Evolucao da avaliacao',
      description: evolutionDescription,
      route: '/aluno?section=avaliacoes',
      event_key: `avaliacao-evolution-${params.avaliacaoId}-${student.userId}`,
      student_id: params.studentId,
      avaliacao_id: params.avaliacaoId,
    });
  }

  await insertNotifications(rows);
}
