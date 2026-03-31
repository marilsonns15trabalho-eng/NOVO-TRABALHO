import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { extractDateOnly } from '@/lib/date';
import { mapStudentToAlunoListItem, normalizeStudentRelation } from '@/lib/mappers';
import { findStudentIdByLinkedAuthUserId, resolveStudentIdForWrite } from '@/lib/student-access';
import type { Anamnese, AnamneseFormData, AnamneseStudentContext } from '@/types/anamnese';
import type { AlunoListItem } from '@/types/common';
import { assertCanManageStudentDataForUserId } from '@/lib/authz';
import { emitAnamneseCreatedNotification } from '@/services/app-notifications.service';

function mapAnamneseRow(item: any): Anamnese {
  const student = normalizeStudentRelation(item.student ?? item.students);

  return {
    ...item,
    students: student,
  };
}

/** Busca todas as anamneses com join do aluno */
export async function fetchAnamneses(linkedAuthUserId?: string): Promise<Anamnese[]> {
  let query = supabase
    .from(TABLES.ANAMNESES)
    .select(`*, student:students(id, linked_auth_user_id, name, email, birth_date, gender, plan_name)`)
    .order('data', { ascending: false });

  if (linkedAuthUserId) query = query.eq('student.linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar anamneses:', error.message);
    return [];
  }

  return (data || []).map(mapAnamneseRow);
}

/** Busca lista de alunos para o select de anamnese */
export async function fetchAlunosParaAnamnese(linkedAuthUserId?: string): Promise<AlunoListItem[]> {
  let query = supabase
    .from(TABLES.STUDENTS)
    .select('id, name, linked_auth_user_id, email, birth_date, gender, plan_name, status')
    .order('name', { ascending: true });

  if (linkedAuthUserId) query = query.eq('linked_auth_user_id', linkedAuthUserId);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []).map(mapStudentToAlunoListItem);
}

function sanitizeOptionalNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildAnamnesePayload(data: AnamneseFormData, studentId: string) {
  const payloadKeys: Array<keyof AnamneseFormData> = [
    'data',
    'peso',
    'altura',
    'objetivo_nutricional',
    'restricoes_alimentares',
    'alergias',
    'medicamentos',
    'historico_familiar',
    'habitos_alimentares',
    'consumo_agua',
    'atividade_fisica',
    'observacoes',
    'circunferencia_abdominal',
    'circunferencia_quadril',
    'medidas_corpo',
    'doencas_cronicas',
    'problemas_saude',
    'cirurgias',
    'condicoes_hormonais',
    'acompanhamento_psicologico',
    'disturbios_alimentares',
    'gravida_amamentando',
    'acompanhamento_previo',
    'frequencia_refeicoes',
    'horarios_refeicoes',
    'consumo_fastfood',
    'consumo_doces',
    'consumo_bebidas_acucaradas',
    'consumo_alcool',
    'gosta_cozinhar',
    'preferencia_alimentos',
    'consumo_cafe',
    'uso_suplementos',
    'frequencia_atividade_fisica',
    'objetivos_treino',
    'rotina_sono',
    'nivel_estresse',
    'tempo_sentado',
    'dificuldade_dietas',
    'lanches_fora',
    'come_emocional',
    'beliscar',
    'compulsao_alimentar',
    'fome_fora_horario',
    'estrategias_controle_peso',
    'alimentos_preferidos',
    'alimentos_evitados',
    'meta_peso_medidas',
    'disposicao_mudancas',
    'preferencia_dietas',
    'expectativas',
  ];

  return {
    ...Object.fromEntries(
      payloadKeys.map((key) => [
        key,
        key === 'peso' || key === 'altura'
          ? sanitizeOptionalNumber(data[key])
          : key === 'data'
            ? extractDateOnly(String(data[key] || '')) || data[key]
            : sanitizeOptionalText(data[key]),
      ]),
    ),
    student_id: studentId,
    data: extractDateOnly(String(data.data || '')) || data.data,
  };
}

export async function fetchStudentAnamneseContext(studentId: string): Promise<AnamneseStudentContext | null> {
  const [{ data: studentRows, error: studentError }, { data: avaliacaoRows, error: avaliacaoError }] =
    await Promise.all([
      supabase
        .from(TABLES.STUDENTS)
        .select('id, name, email, birth_date, gender, plan_name')
        .eq('id', studentId)
        .limit(1),
      supabase
        .from(TABLES.AVALIACOES)
        .select('data, peso, altura')
        .eq('student_id', studentId)
        .order('data', { ascending: false })
        .limit(1),
    ]);

  if (studentError) {
    throw studentError;
  }

  if (avaliacaoError) {
    throw avaliacaoError;
  }

  const student = normalizeStudentRelation((studentRows || [])[0]);
  if (!student?.id) {
    return null;
  }

  const latestAvaliacao = (avaliacaoRows || [])[0] as
    | { data?: string | null; peso?: number | null; altura?: number | null }
    | undefined;

  return {
    student_id: student.id,
    student_name: student.nome || student.name || 'Aluno',
    email: (studentRows || [])[0]?.email || null,
    birth_date: student.birth_date || null,
    gender: student.gender || null,
    plan_name: (studentRows || [])[0]?.plan_name || null,
    latest_avaliacao_date: latestAvaliacao?.data || null,
    latest_peso: latestAvaliacao?.peso ?? null,
    latest_altura: latestAvaliacao?.altura ?? null,
  };
}

/** Cria uma nova anamnese */
export async function createAnamnese(
  data: AnamneseFormData,
): Promise<{ id: string; student_id: string }> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);
  const studentId = await resolveStudentIdForWrite(
    typeof data.student_id === 'string' ? data.student_id : undefined,
    user.id
  );

  const payload = buildAnamnesePayload(data, studentId);
  const { error } = await supabase
    .from(TABLES.ANAMNESES)
    .insert([payload]);

  if (error) {
    throw error;
  }

  const { data: latestRow, error: latestError } = await supabase
    .from(TABLES.ANAMNESES)
    .select('id, student_id')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError || !latestRow?.id) {
    return {
      id: '',
      student_id: studentId,
    };
  }

  await emitAnamneseCreatedNotification({
    actorUserId: user.id,
    anamneseId: latestRow.id,
    studentId,
  });

  return {
    id: latestRow.id,
    student_id: latestRow.student_id,
  };
}

export async function updateAnamnese(id: string, data: AnamneseFormData): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertCanManageStudentDataForUserId(user.id);
  const studentId = await resolveStudentIdForWrite(
    typeof data.student_id === 'string' ? data.student_id : undefined,
    user.id
  );

  const payload = buildAnamnesePayload(data, studentId);
  const { error } = await supabase
    .from(TABLES.ANAMNESES)
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}
