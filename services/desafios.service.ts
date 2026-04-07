import { assertAdmin } from '@/lib/authz';
import { getAppDateInputValue } from '@/lib/date';
import { downloadFile, openExternalUrl, type FileDownloadResult } from '@/lib/external-links';
import { deriveFoodProtocolTitle, sanitizeFoodProtocolFileName } from '@/lib/food-protocols';
import { STORAGE_BUCKETS, TABLES } from '@/lib/constants';
import { normalizeStudentRelation } from '@/lib/mappers';
import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import {
  attachStudentAvatar,
  collectLinkedAuthUserIds,
  fetchStudentAvatarMap,
  type StudentAvatarPayload,
} from '@/services/student-avatars.service';
import type {
  ChallengeDay,
  ChallengeDayUpsertInput,
  ChallengeParticipant,
  ChallengeStudent,
  ChallengeSummary,
  ChallengeUpsertInput,
  StudentChallengeHub,
} from '@/types/desafio';

const MAX_CHALLENGE_DAY_PDF_BYTES = 15 * 1024 * 1024;
const CHALLENGE_DAY_SIGNED_URL_EXPIRES_IN = 60 * 60;

function mapChallengeRow(row: any): ChallengeSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    created_by_auth_user_id: row.created_by_auth_user_id ?? null,
    updated_by_auth_user_id: row.updated_by_auth_user_id ?? null,
    participant_count: typeof row.participant_count === 'number' ? row.participant_count : 0,
  };
}

function mapChallengeDayRow(row: any): ChallengeDay {
  return {
    id: row.id,
    challenge_id: row.challenge_id,
    challenge_date: row.challenge_date,
    title: row.title ?? null,
    training_guidance: row.training_guidance ?? null,
    nutrition_guidance: row.nutrition_guidance ?? null,
    notes: row.notes ?? null,
    linked_training_plan_id: row.linked_training_plan_id ?? null,
    linked_food_protocol_id: row.linked_food_protocol_id ?? null,
    storage_path: row.storage_path ?? null,
    file_name: row.file_name ?? null,
    content_type: row.content_type ?? null,
    size_bytes: row.size_bytes ?? null,
    signed_url: row.signed_url ?? null,
    updated_by_auth_user_id: row.updated_by_auth_user_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

function mapChallengeStudent(
  row: Record<string, any> | null | undefined,
  avatarMap: Map<string, StudentAvatarPayload>,
): ChallengeStudent | undefined {
  const student = normalizeStudentRelation(row);
  if (!student?.id) {
    return undefined;
  }

  const withAvatar = attachStudentAvatar(student, avatarMap);

  return {
    id: withAvatar.id,
    nome: withAvatar.nome || withAvatar.name || 'Aluna',
    email: withAvatar.email ?? null,
    linked_auth_user_id: withAvatar.linked_auth_user_id ?? null,
    avatar_url: withAvatar.avatar_url ?? null,
    avatar_path: withAvatar.avatar_path ?? null,
    avatar_updated_at: withAvatar.avatar_updated_at ?? null,
  };
}

function mapChallengeParticipantRow(
  row: any,
  avatarMap: Map<string, StudentAvatarPayload>,
): ChallengeParticipant {
  return {
    id: row.id,
    challenge_id: row.challenge_id,
    student_id: row.student_id,
    assigned_at: row.assigned_at,
    removed_at: row.removed_at ?? null,
    notes: row.notes ?? null,
    students: mapChallengeStudent(row.student ?? row.students, avatarMap),
  };
}

function isChallengeAccessibleForStudent(challenge: ChallengeSummary) {
  return challenge.status !== 'archived';
}

function isChallengeCurrentOnDate(challenge: ChallengeSummary, dateKey: string) {
  if (!isChallengeAccessibleForStudent(challenge)) {
    return false;
  }

  if (challenge.start_date && challenge.start_date > dateKey) {
    return false;
  }

  if (challenge.end_date && challenge.end_date < dateKey) {
    return false;
  }

  return true;
}

function buildChallengeDaySelect() {
  return 'id, challenge_id, challenge_date, title, training_guidance, nutrition_guidance, notes, linked_training_plan_id, linked_food_protocol_id, storage_path, file_name, content_type, size_bytes, updated_by_auth_user_id, created_at, updated_at';
}

async function getChallengeDaySignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.CHALLENGE_DAY_PDFS)
    .createSignedUrl(storagePath, CHALLENGE_DAY_SIGNED_URL_EXPIRES_IN);

  if (error || !data?.signedUrl) {
    throw new Error('Nao foi possivel abrir o PDF do desafio agora.');
  }

  return data.signedUrl;
}

async function buildParticipantCountMap(challengeIds: string[]) {
  if (!challengeIds.length) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from(TABLES.DESAFIO_PARTICIPANTES)
    .select('challenge_id')
    .in('challenge_id', challengeIds)
    .is('removed_at', null);

  if (error) {
    console.warn('Erro ao contar participantes dos desafios:', error.message);
    return new Map<string, number>();
  }

  const countMap = new Map<string, number>();
  (data || []).forEach((row: any) => {
    if (!row?.challenge_id) {
      return;
    }

    countMap.set(row.challenge_id, (countMap.get(row.challenge_id) || 0) + 1);
  });

  return countMap;
}

export async function fetchChallengeStudents(): Promise<ChallengeStudent[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, name, email, linked_auth_user_id')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao carregar alunas para desafios:', error);
    return [];
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(collectLinkedAuthUserIds(rows));

  return rows
    .map((row: any) => mapChallengeStudent(row, avatarMap))
    .filter(Boolean) as ChallengeStudent[];
}

export async function fetchChallengeSummaries(): Promise<ChallengeSummary[]> {
  const { data, error } = await supabase
    .from(TABLES.DESAFIOS)
    .select('id, title, description, status, start_date, end_date, created_at, updated_at, created_by_auth_user_id, updated_by_auth_user_id')
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) {
    console.error('Erro ao carregar desafios:', error);
    return [];
  }

  const rows = data || [];
  const countMap = await buildParticipantCountMap(rows.map((row: any) => row.id).filter(Boolean));

  return rows.map((row: any) =>
    mapChallengeRow({
      ...row,
      participant_count: countMap.get(row.id) || 0,
    }),
  );
}

export async function fetchChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
  if (!challengeId) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.DESAFIO_PARTICIPANTES)
    .select('id, challenge_id, student_id, assigned_at, removed_at, notes, student:students(id, name, email, linked_auth_user_id)')
    .eq('challenge_id', challengeId)
    .is('removed_at', null)
    .order('assigned_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar participantes do desafio:', error);
    return [];
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds(rows.map((row: any) => normalizeStudentRelation(row.student ?? row.students))),
  );

  return rows.map((row: any) => mapChallengeParticipantRow(row, avatarMap));
}

export async function fetchChallengeDays(challengeId: string): Promise<ChallengeDay[]> {
  if (!challengeId) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.DESAFIO_DIAS)
    .select(buildChallengeDaySelect())
    .eq('challenge_id', challengeId)
    .order('challenge_date', { ascending: false })
    .limit(60);

  if (error) {
    console.error('Erro ao carregar dias do desafio:', error);
    return [];
  }

  return (data || []).map(mapChallengeDayRow);
}

export async function createChallenge(input: ChallengeUpsertInput): Promise<ChallengeSummary> {
  const user = await getAuthenticatedUser();
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    created_by_auth_user_id: user.id,
    updated_by_auth_user_id: user.id,
  };

  const { data, error } = await supabase
    .from(TABLES.DESAFIOS)
    .insert([payload])
    .select('id, title, description, status, start_date, end_date, created_at, updated_at, created_by_auth_user_id, updated_by_auth_user_id')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Nao foi possivel criar o desafio.');
  }

  return mapChallengeRow(data);
}

export async function updateChallenge(challengeId: string, input: ChallengeUpsertInput): Promise<ChallengeSummary> {
  const user = await getAuthenticatedUser();
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    updated_by_auth_user_id: user.id,
  };

  const { data, error } = await supabase
    .from(TABLES.DESAFIOS)
    .update(payload)
    .eq('id', challengeId)
    .select('id, title, description, status, start_date, end_date, created_at, updated_at, created_by_auth_user_id, updated_by_auth_user_id')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Nao foi possivel atualizar o desafio.');
  }

  return mapChallengeRow(data);
}

export async function deleteChallenge(challengeId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.DESAFIOS)
    .delete()
    .eq('id', challengeId);

  if (error) {
    throw new Error(error.message || 'Nao foi possivel excluir o desafio.');
  }
}

export async function assignStudentToChallenge(
  challengeId: string,
  studentId: string,
  notes?: string | null,
): Promise<ChallengeParticipant> {
  await assertAdmin();
  const user = await getAuthenticatedUser();
  const payload = {
    challenge_id: challengeId,
    student_id: studentId,
    notes: notes?.trim() || null,
    assigned_by_auth_user_id: user.id,
    assigned_at: new Date().toISOString(),
    removed_at: null,
  };

  const { data, error } = await supabase
    .from(TABLES.DESAFIO_PARTICIPANTES)
    .upsert([payload], { onConflict: 'challenge_id,student_id' })
    .select('id, challenge_id, student_id, assigned_at, removed_at, notes, student:students(id, name, email, linked_auth_user_id)')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Nao foi possivel adicionar a aluna ao desafio.');
  }

  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds([normalizeStudentRelation(data.student ?? data.students)]),
  );

  return mapChallengeParticipantRow(data, avatarMap);
}

export async function removeStudentFromChallenge(challengeId: string, studentId: string): Promise<void> {
  await assertAdmin();
  const { error } = await supabase
    .from(TABLES.DESAFIO_PARTICIPANTES)
    .update({ removed_at: new Date().toISOString() })
    .eq('challenge_id', challengeId)
    .eq('student_id', studentId)
    .is('removed_at', null);

  if (error) {
    throw new Error(error.message || 'Nao foi possivel remover a aluna do desafio.');
  }
}

export async function saveChallengeDay(input: ChallengeDayUpsertInput): Promise<ChallengeDay> {
  const user = await getAuthenticatedUser();
  let nextStoragePath: string | null = null;
  let nextFileName: string | null = null;
  let nextContentType: string | null = null;
  let nextSizeBytes: number | null = null;
  let previousStoragePath: string | null = null;

  if (input.file) {
    const lowerName = input.file.name.toLowerCase();
    const isPdf = input.file.type === 'application/pdf' || lowerName.endsWith('.pdf');

    if (!isPdf) {
      throw new Error('Envie apenas PDF no desafio diario.');
    }

    if (input.file.size <= 0 || input.file.size > MAX_CHALLENGE_DAY_PDF_BYTES) {
      throw new Error('O PDF do desafio deve ter ate 15 MB.');
    }

    const { data: existingDay, error: existingDayError } = await supabase
      .from(TABLES.DESAFIO_DIAS)
      .select('id, storage_path')
      .eq('challenge_id', input.challenge_id)
      .eq('challenge_date', input.challenge_date)
      .maybeSingle();

    if (existingDayError) {
      throw new Error(existingDayError.message || 'Nao foi possivel preparar o PDF do desafio.');
    }

    previousStoragePath = existingDay?.storage_path ?? null;

    const safeFileName = sanitizeFoodProtocolFileName(
      input.file.name,
      input.title?.trim() || deriveFoodProtocolTitle(input.file.name),
    );
    nextStoragePath = `${input.challenge_id}/${input.challenge_date}/${Date.now()}-${safeFileName}`;
    nextFileName = safeFileName;
    nextContentType = 'application/pdf';
    nextSizeBytes = input.file.size;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.CHALLENGE_DAY_PDFS)
      .upload(nextStoragePath, input.file, {
        contentType: 'application/pdf',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || 'Nao foi possivel enviar o PDF do desafio.');
    }
  }

  const payload = {
    challenge_id: input.challenge_id,
    challenge_date: input.challenge_date,
    title: input.title?.trim() || (input.file ? deriveFoodProtocolTitle(input.file.name) : null),
    training_guidance: input.training_guidance?.trim() || null,
    nutrition_guidance: input.nutrition_guidance?.trim() || null,
    notes: input.notes?.trim() || null,
    linked_training_plan_id: input.linked_training_plan_id || null,
    linked_food_protocol_id: input.linked_food_protocol_id || null,
    updated_by_auth_user_id: user.id,
    ...(input.file
      ? {
          storage_path: nextStoragePath,
          file_name: nextFileName,
          content_type: nextContentType,
          size_bytes: nextSizeBytes,
        }
      : {}),
  };

  const { data, error } = await supabase
    .from(TABLES.DESAFIO_DIAS)
    .upsert([payload], { onConflict: 'challenge_id,challenge_date' })
    .select(buildChallengeDaySelect())
    .single();

  if (error || !data) {
    if (nextStoragePath) {
      await supabase.storage.from(STORAGE_BUCKETS.CHALLENGE_DAY_PDFS).remove([nextStoragePath]).catch(() => undefined);
    }
    throw new Error(error?.message || 'Nao foi possivel salvar o dia do desafio.');
  }

  if (nextStoragePath && previousStoragePath && previousStoragePath !== nextStoragePath) {
    await supabase.storage
      .from(STORAGE_BUCKETS.CHALLENGE_DAY_PDFS)
      .remove([previousStoragePath])
      .catch(() => undefined);
  }

  return mapChallengeDayRow(data);
}

export async function fetchMyChallengeHub(linkedAuthUserId?: string | null): Promise<StudentChallengeHub> {
  const normalizedUserId = linkedAuthUserId?.trim() || '';
  if (!normalizedUserId) {
    return {
      student_id: null,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const { data: studentRow, error: studentError } = await supabase
    .from(TABLES.STUDENTS)
    .select('id')
    .eq('linked_auth_user_id', normalizedUserId)
    .maybeSingle();

  if (studentError) {
    console.error('Erro ao resolver aluna do desafio:', studentError);
    return {
      student_id: null,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const studentId = studentRow?.id ?? null;
  if (!studentId) {
    return {
      student_id: null,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const { data: participantRows, error: participantsError } = await supabase
    .from(TABLES.DESAFIO_PARTICIPANTES)
    .select('challenge_id')
    .eq('student_id', studentId)
    .is('removed_at', null);

  if (participantsError) {
    console.error('Erro ao carregar participacoes do desafio:', participantsError);
    return {
      student_id: studentId,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const challengeIds = Array.from(
    new Set((participantRows || []).map((row: any) => row.challenge_id).filter(Boolean)),
  );

  if (!challengeIds.length) {
    return {
      student_id: studentId,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const { data: challengeRows, error: challengesError } = await supabase
    .from(TABLES.DESAFIOS)
    .select('id, title, description, status, start_date, end_date, created_at, updated_at, created_by_auth_user_id, updated_by_auth_user_id')
    .in('id', challengeIds)
    .order('updated_at', { ascending: false });

  if (challengesError) {
    console.error('Erro ao carregar desafios da aluna:', challengesError);
    return {
      student_id: studentId,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const todayKey = getAppDateInputValue();
  const accessibleChallenges = (challengeRows || [])
    .map(mapChallengeRow)
    .filter(isChallengeAccessibleForStudent);

  if (!accessibleChallenges.length) {
    return {
      student_id: studentId,
      active_challenges: [],
      today_entries: [],
      has_visible_challenges: false,
    };
  }

  const currentChallengeIds = accessibleChallenges
    .filter((challenge) => isChallengeCurrentOnDate(challenge, todayKey))
    .map((challenge) => challenge.id);

  let dayRows: any[] = [];
  if (currentChallengeIds.length) {
    const { data, error: dayError } = await supabase
      .from(TABLES.DESAFIO_DIAS)
      .select(buildChallengeDaySelect())
      .in('challenge_id', currentChallengeIds)
      .eq('challenge_date', todayKey)
      .order('challenge_date', { ascending: false });

    if (dayError) {
      console.warn('Erro ao carregar atualizacao diaria dos desafios:', dayError.message);
    } else {
      dayRows = data || [];
    }
  }

  return {
    student_id: studentId,
    active_challenges: accessibleChallenges,
    today_entries: (dayRows || []).map(mapChallengeDayRow),
    has_visible_challenges: accessibleChallenges.length > 0,
  };
}

export async function openChallengeDayPdf(day: ChallengeDay) {
  if (!day.storage_path) {
    throw new Error('Este dia do desafio ainda nao possui PDF.');
  }

  const url = day.signed_url || (await getChallengeDaySignedUrl(day.storage_path));
  await openExternalUrl(url, { preferSystemBrowser: true });
}

export async function downloadChallengeDayPdf(day: ChallengeDay): Promise<FileDownloadResult | null> {
  if (!day.storage_path) {
    throw new Error('Este dia do desafio ainda nao possui PDF.');
  }

  const url = day.signed_url || (await getChallengeDaySignedUrl(day.storage_path));
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Nao foi possivel baixar o PDF do desafio.');
  }

  const blob = await response.blob();
  const fileName =
    day.file_name ||
    sanitizeFoodProtocolFileName(`${day.title || `desafio-${day.challenge_date}`}.pdf`, `desafio-${day.challenge_date}`);
  const file = new File([blob], fileName, {
    type: day.content_type || 'application/pdf',
  });

  return downloadFile(file, fileName);
}
