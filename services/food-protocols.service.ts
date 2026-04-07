import { downloadFile, openExternalUrl, type FileDownloadResult } from '@/lib/external-links';
import {
  deriveFoodProtocolTitle,
  sanitizeFoodProtocolFileName,
} from '@/lib/food-protocols';
import { STORAGE_BUCKETS, TABLES } from '@/lib/constants';
import { normalizeStudentRelation } from '@/lib/mappers';
import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';
import {
  attachStudentAvatar,
  collectLinkedAuthUserIds,
  fetchStudentAvatarMap,
  type StudentAvatarPayload,
} from '@/services/student-avatars.service';
import type { FoodProtocol, FoodProtocolStudent, FoodProtocolUploadInput } from '@/types/food-protocol';

const MAX_FOOD_PROTOCOL_BYTES = 15 * 1024 * 1024;
const FOOD_PROTOCOL_SIGNED_URL_EXPIRES_IN = 60 * 60;

async function syncActiveProtocolForStudent(studentId: string) {
  const { data, error } = await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .select('id')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao sincronizar protocolo alimentar principal:', error);
    return;
  }

  const rows = data || [];
  if (!rows.length) {
    return;
  }

  const activeId = rows[0]?.id;
  if (!activeId) {
    return;
  }

  await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .update({ is_active: false })
    .eq('student_id', studentId)
    .neq('id', activeId)
    .eq('is_active', true);

  await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .update({ is_active: true })
    .eq('id', activeId)
    .neq('is_active', true);
}

function mapFoodProtocolStudent(
  row: Record<string, any> | null | undefined,
  avatarMap: Map<string, StudentAvatarPayload>,
) {
  const student = normalizeStudentRelation(row);
  if (!student) {
    return undefined;
  }

  const studentWithAvatar = attachStudentAvatar(student, avatarMap);

  return {
    id: studentWithAvatar.id,
    nome: studentWithAvatar.nome,
    email: studentWithAvatar.email ?? null,
    linked_auth_user_id: studentWithAvatar.linked_auth_user_id ?? null,
    avatar_url: studentWithAvatar.avatar_url ?? null,
    avatar_path: studentWithAvatar.avatar_path ?? null,
    avatar_updated_at: studentWithAvatar.avatar_updated_at ?? null,
  };
}

function mapFoodProtocolRow(
  row: any,
  avatarMap: Map<string, StudentAvatarPayload> = new Map(),
): FoodProtocol {
  return {
    id: row.id,
    student_id: row.student_id,
    title: row.title,
    storage_path: row.storage_path,
    file_name: row.file_name ?? null,
    content_type: row.content_type ?? null,
    size_bytes: row.size_bytes ?? null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    uploaded_by_auth_user_id: row.uploaded_by_auth_user_id ?? null,
    signed_url: row.signed_url ?? null,
    students: mapFoodProtocolStudent(row.student ?? row.students, avatarMap),
  };
}

async function attachSignedUrls(protocols: FoodProtocol[]) {
  const uniquePaths = Array.from(
    new Set(protocols.map((protocol) => protocol.storage_path).filter(Boolean)),
  );

  if (!uniquePaths.length) {
    return protocols;
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.FOOD_PROTOCOLS)
    .createSignedUrls(uniquePaths, FOOD_PROTOCOL_SIGNED_URL_EXPIRES_IN);

  if (error) {
    console.error('Erro ao assinar protocolos alimentares:', error);
    return protocols;
  }

  const urlMap = new Map<string, string | null>();
  (data || []).forEach((item) => {
    if (item.path) {
      urlMap.set(item.path, item.signedUrl ?? null);
    }
  });

  return protocols.map((protocol) => ({
    ...protocol,
    signed_url: urlMap.get(protocol.storage_path) ?? null,
  }));
}

function buildFoodProtocolSelect() {
  return 'id, student_id, title, storage_path, file_name, content_type, size_bytes, is_active, created_at, updated_at, uploaded_by_auth_user_id, student:students(id, name, email, linked_auth_user_id)';
}

export async function fetchFoodProtocolStudents(): Promise<FoodProtocolStudent[]> {
  const { data, error } = await supabase
    .from(TABLES.STUDENTS)
    .select('id, name, email, linked_auth_user_id')
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao carregar alunas para protocolo alimentar:', error);
    return [];
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(collectLinkedAuthUserIds(rows));

  return rows.map((row: any) => mapFoodProtocolStudent(row, avatarMap)).filter(Boolean) as FoodProtocolStudent[];
}

export async function fetchFoodProtocols(options?: {
  linkedAuthUserId?: string;
  studentId?: string;
}): Promise<FoodProtocol[]> {
  let studentIdFilter = options?.studentId ?? null;

  if (!studentIdFilter && options?.linkedAuthUserId) {
    const { data: studentRow, error: studentError } = await supabase
      .from(TABLES.STUDENTS)
      .select('id')
      .eq('linked_auth_user_id', options.linkedAuthUserId)
      .maybeSingle();

    if (studentError) {
      console.error('Erro ao resolver aluna do protocolo alimentar:', studentError);
      return [];
    }

    studentIdFilter = studentRow?.id ?? null;
    if (!studentIdFilter) {
      return [];
    }
  }

  let query = supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .select(buildFoodProtocolSelect())
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  if (studentIdFilter) {
    query = query.eq('student_id', studentIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao carregar protocolos alimentares:', error);
    return [];
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds(
      rows.map((row: any) => normalizeStudentRelation(row.student ?? row.students)),
    ),
  );

  const mapped = rows.map((row: any) => mapFoodProtocolRow(row, avatarMap));
  return attachSignedUrls(mapped);
}

export async function uploadFoodProtocol(input: FoodProtocolUploadInput): Promise<FoodProtocol> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  if (!(input.file instanceof File)) {
    throw new Error('Selecione um PDF valido para enviar.');
  }

  const lowerName = input.file.name.toLowerCase();
  const isPdf =
    input.file.type === 'application/pdf' ||
    lowerName.endsWith('.pdf');

  if (!isPdf) {
    throw new Error('Envie apenas arquivos PDF para o protocolo alimentar.');
  }

  if (input.file.size <= 0 || input.file.size > MAX_FOOD_PROTOCOL_BYTES) {
    throw new Error('O PDF deve ter ate 15 MB.');
  }

  const title = (input.title || deriveFoodProtocolTitle(input.file.name)).trim() || 'Protocolo alimentar';
  const safeFileName = sanitizeFoodProtocolFileName(input.file.name, title);
  const storagePath = `${input.student_id}/${Date.now()}-${safeFileName}`;
  const bucket = supabase.storage.from(STORAGE_BUCKETS.FOOD_PROTOCOLS);

  const { error: uploadError } = await bucket.upload(storagePath, input.file, {
    contentType: 'application/pdf',
    cacheControl: '31536000',
    upsert: false,
  });

  if (uploadError) {
    throw new Error(uploadError.message || 'Nao foi possivel enviar o protocolo alimentar.');
  }

  const payload = {
    student_id: input.student_id,
    title,
    storage_path: storagePath,
    file_name: safeFileName,
    content_type: 'application/pdf',
    size_bytes: input.file.size,
    is_active: true,
    uploaded_by_auth_user_id: user.id,
  };

  const insertResult = await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .insert([payload])
    .select(buildFoodProtocolSelect())
    .single();

  const error = insertResult.error;
  if (error) {
    await bucket.remove([storagePath]).catch(() => undefined);
    throw new Error(error.message || 'Nao foi possivel registrar o protocolo alimentar.');
  }

  const data = insertResult.data as any;
  if (!data?.id) {
    await bucket.remove([storagePath]).catch(() => undefined);
    throw new Error('Nao foi possivel confirmar o protocolo alimentar enviado.');
  }

  await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .update({ is_active: false })
    .eq('student_id', input.student_id)
    .neq('id', data.id)
    .eq('is_active', true);

  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds([normalizeStudentRelation(data.student ?? data.students)]),
  );

  const [protocol] = await attachSignedUrls([mapFoodProtocolRow(data, avatarMap)]);
  return protocol;
}

export async function deleteFoodProtocol(protocolId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const { data, error } = await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .select('id, storage_path, student_id, is_active')
    .eq('id', protocolId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Nao foi possivel localizar o protocolo.');
  }

  if (!data?.id) {
    throw new Error('Protocolo alimentar nao encontrado.');
  }

  if (data.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.FOOD_PROTOCOLS)
      .remove([data.storage_path]);

    if (storageError) {
      console.error('Erro ao remover arquivo do protocolo alimentar:', storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .delete()
    .eq('id', protocolId);

  if (deleteError) {
    throw new Error(deleteError.message || 'Nao foi possivel excluir o protocolo alimentar.');
  }

  if (data.is_active && data.student_id) {
    await syncActiveProtocolForStudent(data.student_id);
  }
}

export async function activateFoodProtocol(protocolId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const { data, error } = await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .select('id, student_id')
    .eq('id', protocolId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Nao foi possivel localizar o protocolo.');
  }

  if (!data?.id || !data.student_id) {
    throw new Error('Protocolo alimentar nao encontrado.');
  }

  await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .update({ is_active: false })
    .eq('student_id', data.student_id)
    .neq('id', data.id)
    .eq('is_active', true);

  const { error: activateError } = await supabase
    .from(TABLES.FOOD_PROTOCOLS)
    .update({ is_active: true })
    .eq('id', data.id);

  if (activateError) {
    throw new Error(activateError.message || 'Nao foi possivel ativar o protocolo.');
  }
}

export async function getFoodProtocolSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.FOOD_PROTOCOLS)
    .createSignedUrl(storagePath, FOOD_PROTOCOL_SIGNED_URL_EXPIRES_IN);

  if (error || !data?.signedUrl) {
    throw new Error('Nao foi possivel abrir o protocolo alimentar agora.');
  }

  return data.signedUrl;
}

export async function openFoodProtocol(protocol: FoodProtocol) {
  const url = protocol.signed_url || (await getFoodProtocolSignedUrl(protocol.storage_path));
  await openExternalUrl(url, { preferSystemBrowser: true });
}

export async function downloadFoodProtocol(protocol: FoodProtocol): Promise<FileDownloadResult | null> {
  const url = protocol.signed_url || (await getFoodProtocolSignedUrl(protocol.storage_path));
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Nao foi possivel baixar o protocolo alimentar.');
  }

  const blob = await response.blob();
  const fileName = protocol.file_name || sanitizeFoodProtocolFileName(`${protocol.title}.pdf`);
  const file = new File([blob], fileName, {
    type: protocol.content_type || 'application/pdf',
  });

  return downloadFile(file, fileName);
}
