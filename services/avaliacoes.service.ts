import { optimizeAssessmentPhotoFile } from '@/lib/assessmentPhotos';
import { calcularBiometria, calcularRcq, getBiometriaValidationMessage } from '@/lib/biometrics';
import { STORAGE_BUCKETS, TABLES } from '@/lib/constants';
import { normalizeStudentRelation } from '@/lib/mappers';
import { getAuthenticatedUser, supabase } from '@/lib/supabase';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';
import { emitAvaliacaoCreatedNotifications } from '@/services/app-notifications.service';
import {
  findStudentIdByLinkedAuthUserId,
  resolveStudentIdForWrite,
} from '@/lib/student-access';
import {
  attachStudentAvatar,
  collectLinkedAuthUserIds,
  fetchStudentAvatarMap,
  type StudentAvatarPayload,
} from '@/services/student-avatars.service';
import type {
  Avaliacao,
  AvaliacaoAlunoItem,
  AvaliacaoFormData,
  AvaliacaoPhoto,
  AvaliacaoPhotoDraftMap,
} from '@/types/avaliacao';

function n(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function logSupabaseError(context: string, error: unknown) {
  const currentError = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  console.error(context, {
    message: currentError?.message,
    code: currentError?.code,
    details: currentError?.details,
    hint: currentError?.hint,
    raw: String(error),
  });
}

function buildAvaliacaoSelect(includePhotos = false) {
  const baseSelect =
    '*, student:students(id, linked_auth_user_id, name, gender, birth_date)';

  if (!includePhotos) {
    return baseSelect;
  }

  return `${baseSelect}, photos:${TABLES.AVALIACAO_PHOTOS}(id, avaliacao_id, student_id, position, storage_path, file_name, content_type, size_bytes, created_at, updated_at)`;
}

function mapPhotoRow(item: any): AvaliacaoPhoto {
  return {
    id: item.id,
    avaliacao_id: item.avaliacao_id,
    student_id: item.student_id,
    position: item.position,
    storage_path: item.storage_path,
    file_name: item.file_name ?? null,
    content_type: item.content_type ?? null,
    size_bytes: item.size_bytes ?? null,
    signed_url: item.signed_url ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function mapAvaliacaoRow(
  item: any,
  avatarMap?: Map<string, StudentAvatarPayload>,
): Avaliacao {
  const student = normalizeStudentRelation(item.student ?? item.students);
  const photos = Array.isArray(item.photos) ? item.photos.map(mapPhotoRow) : [];

  return {
    ...item,
    students: student ? attachStudentAvatar(student, avatarMap || new Map()) : undefined,
    photos,
    pescoco: item.pescoco ?? item.medidas?.pescoco,
    ombro: item.ombro ?? item.medidas?.ombro,
    torax: item.torax ?? item.medidas?.torax,
    cintura: item.cintura ?? item.medidas?.cintura,
    abdome: item.abdome ?? item.medidas?.abdome,
    quadril: item.quadril ?? item.medidas?.quadril,
    braco_direito: item.braco_direito ?? item.medidas?.braco_direito,
    braco_esquerdo: item.braco_esquerdo ?? item.medidas?.braco_esquerdo,
    coxa_direita: item.coxa_direita ?? item.medidas?.coxa_direita,
    coxa_esquerda: item.coxa_esquerda ?? item.medidas?.coxa_esquerda,
    panturrilha_direita:
      item.panturrilha_direita ?? item.medidas?.panturrilha_direita,
    panturrilha_esquerda:
      item.panturrilha_esquerda ?? item.medidas?.panturrilha_esquerda,
    tricipital: item.tricipital ?? item.dobras?.tricipital,
    subescapular: item.subescapular ?? item.dobras?.subescapular,
    supra_iliaca: item.supra_iliaca ?? item.dobras?.supra_iliaca,
    abdominal: item.abdominal ?? item.dobras?.abdominal,
    soma_dobras: item.soma_dobras ?? item.dobras?.soma_dobras,
    percentual_gordura: item.percentual_gordura ?? item.gordura_corporal,
    rcq:
      item.rcq ??
      item.medidas?.rcq ??
      calcularRcq(item.cintura ?? item.medidas?.cintura, item.quadril ?? item.medidas?.quadril),
    massa_gorda:
      item.massa_gorda ??
      (item.peso && item.massa_magra
        ? parseFloat((item.peso - item.massa_magra).toFixed(2))
        : undefined),
  };
}

async function attachSignedPhotoUrls(avaliacoes: Avaliacao[]): Promise<Avaliacao[]> {
  const uniquePaths = Array.from(
    new Set(
      avaliacoes.flatMap((avaliacao) =>
        (avaliacao.photos ?? [])
          .map((photo) => photo.storage_path)
          .filter(Boolean),
      ),
    ),
  );

  if (!uniquePaths.length) {
    return avaliacoes;
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.AVALIACAO_PHOTOS)
    .createSignedUrls(uniquePaths, 60 * 60);

  if (error) {
    logSupabaseError('Erro ao assinar fotos de avaliacao:', error);
    return avaliacoes;
  }

  const signedUrlMap = new Map<string, string | null>();
  (data || []).forEach((item) => {
    if (item.path) {
      signedUrlMap.set(item.path, item.signedUrl ?? null);
    }
  });

  return avaliacoes.map((avaliacao) => ({
    ...avaliacao,
    photos: (avaliacao.photos ?? []).map((photo) => ({
      ...photo,
      signed_url: signedUrlMap.get(photo.storage_path) ?? null,
    })),
  }));
}

export async function fetchAvaliacoes(
  linkedAuthUserId?: string,
  includePhotos = false,
): Promise<Avaliacao[]> {
  let query = supabase
    .from(TABLES.AVALIACOES)
    .select(buildAvaliacaoSelect(includePhotos))
    .order('data', { ascending: false });

  if (linkedAuthUserId) {
    query = query.eq('student.linked_auth_user_id', linkedAuthUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar avaliacoes:', error.message);
    return [];
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds(
      rows.map((item: any) => normalizeStudentRelation(item.student ?? item.students)),
    ),
  );
  const avaliacoes = rows.map((item) => mapAvaliacaoRow(item, avatarMap));
  return includePhotos ? attachSignedPhotoUrls(avaliacoes) : avaliacoes;
}

export async function fetchAlunosParaAvaliacao(
  linkedAuthUserId?: string,
): Promise<AvaliacaoAlunoItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('id, name, gender, birth_date, linked_auth_user_id')
    .order('name', { ascending: true });

  if (linkedAuthUserId) {
    query = query.eq('linked_auth_user_id', linkedAuthUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar alunos:', error.message);
    return [];
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(collectLinkedAuthUserIds(rows));

  return rows.map((row: any) => {
    const student = normalizeStudentRelation(attachStudentAvatar(row, avatarMap));

    return {
      id: student?.id || row.id,
      nome: student?.nome || '',
      linked_auth_user_id: student?.linked_auth_user_id ?? null,
      sexo: student?.sexo,
      data_nascimento: student?.data_nascimento,
      gender: student?.gender ?? null,
      birth_date: student?.birth_date ?? null,
      avatar_url: student?.avatar_url ?? null,
      avatar_path: student?.avatar_path ?? null,
      avatar_updated_at: student?.avatar_updated_at ?? null,
    };
  });
}

export async function fetchHistoricoAluno(
  studentId: string,
  linkedAuthUserId?: string,
): Promise<Avaliacao[]> {
  if (linkedAuthUserId) {
    const allowedStudentId = await findStudentIdByLinkedAuthUserId(linkedAuthUserId);
    if (!allowedStudentId || allowedStudentId !== studentId) {
      return [];
    }
  }

  const { data, error } = await supabase
    .from(TABLES.AVALIACOES)
    .select(buildAvaliacaoSelect(true))
    .eq('student_id', studentId)
    .order('data', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = data || [];
  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds(
      rows.map((item: any) => normalizeStudentRelation(item.student ?? item.students)),
    ),
  );

  return attachSignedPhotoUrls(rows.map((item) => mapAvaliacaoRow(item, avatarMap)));
}

export async function salvarAvaliacao(
  avaliacaoData: AvaliacaoFormData,
  editingId?: string,
): Promise<Avaliacao> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const studentId = await resolveStudentIdForWrite(
    typeof avaliacaoData.student_id === 'string' ? avaliacaoData.student_id : undefined,
    user.id,
  );
  let studentContext: { gender?: string | null; birth_date?: string | null } | null = null;

  if (avaliacaoData.protocolo === 'navy' || !avaliacaoData.student_gender) {
    const { data: studentRow } = await supabase
      .from(TABLES.STUDENTS)
      .select('gender, birth_date')
      .eq('id', studentId)
      .maybeSingle();

    studentContext = studentRow || null;
  }

  const biometricInput = {
    ...avaliacaoData,
    student_gender:
      avaliacaoData.student_gender ??
      studentContext?.gender ??
      null,
    student_birth_date:
      avaliacaoData.student_birth_date ??
      studentContext?.birth_date ??
      null,
  };

  const dadosCalculados = calcularBiometria(biometricInput as Record<string, unknown>);
  const data = { ...avaliacaoData, ...biometricInput, ...dadosCalculados };
  const peso = n(data.peso);
  const altura = n(data.altura);

  const rawDate =
    data.data != null && String(data.data).trim() !== ''
      ? String(data.data).trim()
      : '';
  const dataAvaliacao = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;

  if (!dataAvaliacao) {
    throw new Error('Informe a data da avaliacao.');
  }

  if (peso === null || peso <= 0) {
    throw new Error('Informe um peso valido para a avaliacao.');
  }

  if (altura === null || altura <= 0) {
    throw new Error('Informe uma altura valida para a avaliacao.');
  }

  const biometriaValidationMessage = getBiometriaValidationMessage(
    biometricInput as Record<string, unknown>,
  );

  if (biometriaValidationMessage) {
    throw new Error(biometriaValidationMessage);
  }

  const rowId =
    editingId ??
    (typeof avaliacaoData.id === 'string' ? avaliacaoData.id : undefined);

  const payload: Record<string, any> = {
    student_id: studentId,
    data: dataAvaliacao,
    peso,
    altura,
    imc: n(data.imc),
    percentual_gordura: n(data.percentual_gordura),
    gordura_corporal: n(data.percentual_gordura),
    massa_magra: n(data.massa_magra),
    massa_gorda: n(data.massa_gorda),
    soma_dobras: n(data.soma_dobras),
    protocolo: data.protocolo || 'navy',
    observacoes: data.observacoes || null,
    ombro: n(data.ombro),
    torax: n(data.torax),
    cintura: n(data.cintura),
    abdome: n(data.abdome),
    quadril: n(data.quadril),
    braco_direito: n(data.braco_direito),
    braco_esquerdo: n(data.braco_esquerdo),
    coxa_direita: n(data.coxa_direita),
    coxa_esquerda: n(data.coxa_esquerda),
    panturrilha_direita: n(data.panturrilha_direita),
    panturrilha_esquerda: n(data.panturrilha_esquerda),
    tricipital: n(data.tricipital),
    subescapular: n(data.subescapular),
    supra_iliaca: n(data.supra_iliaca),
    abdominal: n(data.abdominal),
    medidas: {
      pescoco: n(data.pescoco),
      ombro: n(data.ombro),
      torax: n(data.torax),
      cintura: n(data.cintura),
      abdome: n(data.abdome),
      quadril: n(data.quadril),
      braco_direito: n(data.braco_direito),
      braco_esquerdo: n(data.braco_esquerdo),
      coxa_direita: n(data.coxa_direita),
      coxa_esquerda: n(data.coxa_esquerda),
      panturrilha_direita: n(data.panturrilha_direita),
      panturrilha_esquerda: n(data.panturrilha_esquerda),
      rcq: n(data.rcq),
    },
    dobras: {
      tricipital: n(data.tricipital),
      subescapular: n(data.subescapular),
      supra_iliaca: n(data.supra_iliaca),
      abdominal: n(data.abdominal),
      soma_dobras: n(data.soma_dobras),
    },
  };

  if (rowId) {
    const { data: updatedRow, error } = await supabase
      .from(TABLES.AVALIACOES)
      .update(payload)
      .eq('id', rowId)
      .select(buildAvaliacaoSelect())
      .single();

    if (error) {
      logSupabaseError('Erro ao atualizar avaliacao:', error);
      throw new Error(error.message || 'Nao foi possivel atualizar a avaliacao.');
    }

    return mapAvaliacaoRow(updatedRow);
  }

  const { data: insertedRow, error } = await supabase
    .from(TABLES.AVALIACOES)
    .insert([payload])
    .select(buildAvaliacaoSelect())
    .single();

  if (error) {
    logSupabaseError('Erro ao inserir avaliacao:', error);
    throw new Error(error.message || 'Nao foi possivel salvar a avaliacao.');
  }

  const mappedRow = mapAvaliacaoRow(insertedRow);

  const { data: previousRows, error: previousError } = await supabase
    .from(TABLES.AVALIACOES)
    .select('id, percentual_gordura, massa_magra, cintura, data')
    .eq('student_id', studentId)
    .lt('data', dataAvaliacao)
    .order('data', { ascending: false })
    .limit(1);

  if (!previousError) {
    await emitAvaliacaoCreatedNotifications({
      actorUserId: user.id,
      avaliacaoId: mappedRow.id,
      studentId,
      currentAvaliacao: mappedRow,
      previousAvaliacao: (previousRows || [])[0] || null,
    });
  }

  return mappedRow;
}

export async function syncAvaliacaoPhotos(params: {
  avaliacaoId: string;
  studentId: string;
  drafts: AvaliacaoPhotoDraftMap;
}) {
  const { avaliacaoId, studentId, drafts } = params;
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);

  const bucket = supabase.storage.from(STORAGE_BUCKETS.AVALIACAO_PHOTOS);

  for (const [position, draft] of Object.entries(drafts) as Array<
    [keyof AvaliacaoPhotoDraftMap, AvaliacaoPhotoDraftMap[keyof AvaliacaoPhotoDraftMap]]
  >) {
    const existing = draft.existing ?? null;

    if (draft.remove && existing?.storage_path) {
      const { error: storageDeleteError } = await bucket.remove([existing.storage_path]);
      if (storageDeleteError) {
        logSupabaseError('Erro ao remover foto antiga de avaliacao:', storageDeleteError);
      }

      const { error: rowDeleteError } = await supabase
        .from(TABLES.AVALIACAO_PHOTOS)
        .delete()
        .eq('avaliacao_id', avaliacaoId)
        .eq('position', position);

      if (rowDeleteError) {
        logSupabaseError('Erro ao remover metadado da foto de avaliacao:', rowDeleteError);
        throw new Error('Nao foi possivel remover uma das fotos da avaliacao.');
      }

      continue;
    }

    if (!draft.file) {
      continue;
    }

    const optimizedFile = await optimizeAssessmentPhotoFile(draft.file);
    const storagePath = `${studentId}/${avaliacaoId}/${position}.jpg`;

    const { error: uploadError } = await bucket.upload(storagePath, optimizedFile, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (uploadError) {
      logSupabaseError('Erro ao enviar foto da avaliacao:', uploadError);
      throw new Error('Nao foi possivel enviar uma das fotos da avaliacao.');
    }

    const { error: upsertError } = await supabase
      .from(TABLES.AVALIACAO_PHOTOS)
      .upsert(
        [
          {
            avaliacao_id: avaliacaoId,
            student_id: studentId,
            position,
            storage_path: storagePath,
            file_name: optimizedFile.name,
            content_type: optimizedFile.type,
            size_bytes: optimizedFile.size,
            created_by_auth_user_id: user.id,
          },
        ],
        { onConflict: 'avaliacao_id,position' },
      );

    if (upsertError) {
      logSupabaseError('Erro ao salvar metadado da foto de avaliacao:', upsertError);
      throw new Error('Nao foi possivel salvar uma das fotos da avaliacao.');
    }

    if (existing?.storage_path && existing.storage_path !== storagePath) {
      const { error: staleDeleteError } = await bucket.remove([existing.storage_path]);
      if (staleDeleteError) {
        logSupabaseError('Erro ao limpar foto antiga de avaliacao:', staleDeleteError);
      }
    }
  }
}
