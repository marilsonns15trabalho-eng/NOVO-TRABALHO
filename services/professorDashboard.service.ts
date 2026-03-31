import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import { getLocalDateInputValue } from '@/lib/date';
import {
  attachStudentAvatar,
  collectLinkedAuthUserIds,
  fetchStudentAvatarMap,
} from '@/services/student-avatars.service';

export interface ProfessorDashboardStats {
  totalAlunos: number;
  alunosAtivos: number;
  alunosInativos: number;
  treinosAtivos: number;
  avaliacoesRecentes30d: number;
}

export interface ProfessorDashboardRecentEvaluation {
  id: string;
  data: string;
  peso: number | null;
  percentual_gordura: number | null;
  students?: {
    nome: string;
    linked_auth_user_id?: string | null;
    avatar_url?: string | null;
    avatar_path?: string | null;
    avatar_updated_at?: string | null;
  };
}

export interface ProfessorDashboardData {
  stats: ProfessorDashboardStats;
  ultimasAvaliacoes: ProfessorDashboardRecentEvaluation[];
}

function assertNoProfessorQueryError(label: string, error: { message?: string } | null) {
  if (error) {
    throw new Error(`${label}: ${error.message || 'erro desconhecido'}`);
  }
}

export async function fetchProfessorDashboardData(): Promise<ProfessorDashboardData> {
  const now = new Date();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since30dStr = getLocalDateInputValue(since30d);

  const [
    totalAlunosRes,
    ativosRes,
    inativosRes,
    treinosAtivosRes,
    avaliacoesRecentesRes,
    ultimasAvaliacoesRes,
  ] = await Promise.all([
    supabase.from(TABLES.STUDENTS).select('id', { count: 'exact', head: true }),
    supabase.from(TABLES.STUDENTS).select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from(TABLES.STUDENTS).select('id', { count: 'exact', head: true }).eq('status', 'inativo'),
    supabase.from(TABLES.TREINOS).select('id', { count: 'exact', head: true }).eq('ativo', true),
    supabase
      .from(TABLES.AVALIACOES)
      .select('id', { count: 'exact', head: true })
      .gte('data', since30dStr),
    supabase
      .from(TABLES.AVALIACOES)
      .select('id, data, peso, percentual_gordura, students(name, linked_auth_user_id)')
      .order('data', { ascending: false })
      .limit(5),
  ]);

  assertNoProfessorQueryError('ProfessorDashboard.totalAlunos', totalAlunosRes.error);
  assertNoProfessorQueryError('ProfessorDashboard.alunosAtivos', ativosRes.error);
  assertNoProfessorQueryError('ProfessorDashboard.alunosInativos', inativosRes.error);
  assertNoProfessorQueryError('ProfessorDashboard.treinosAtivos', treinosAtivosRes.error);
  assertNoProfessorQueryError('ProfessorDashboard.avaliacoesRecentes', avaliacoesRecentesRes.error);
  assertNoProfessorQueryError('ProfessorDashboard.ultimasAvaliacoes', ultimasAvaliacoesRes.error);

  const avatarMap = await fetchStudentAvatarMap(
    collectLinkedAuthUserIds(
      (ultimasAvaliacoesRes.data || []).map((row: any) => {
        const studentsRaw = row.students;
        return Array.isArray(studentsRaw) ? studentsRaw[0] : studentsRaw;
      }),
    ),
  );

  const ultimasAvaliacoes = (ultimasAvaliacoesRes.data || []).map((a: any) => {
    const studentsRaw = a.students;
    const studentsObj = attachStudentAvatar(
      (Array.isArray(studentsRaw) ? studentsRaw[0] : studentsRaw) || {},
      avatarMap,
    );

    return {
      id: a.id,
      data: a.data,
      peso: a.peso ?? null,
      percentual_gordura: a.percentual_gordura ?? null,
      students: studentsObj?.name
        ? {
            nome: studentsObj.name || '',
            linked_auth_user_id: studentsObj.linked_auth_user_id ?? null,
            avatar_url: studentsObj.avatar_url ?? null,
            avatar_path: studentsObj.avatar_path ?? null,
            avatar_updated_at: studentsObj.avatar_updated_at ?? null,
          }
        : undefined,
    } as ProfessorDashboardRecentEvaluation;
  });

  return {
    stats: {
      totalAlunos: totalAlunosRes.count || 0,
      alunosAtivos: ativosRes.count || 0,
      alunosInativos: inativosRes.count || 0,
      treinosAtivos: treinosAtivosRes.count || 0,
      avaliacoesRecentes30d: avaliacoesRecentesRes.count || 0,
    },
    ultimasAvaliacoes,
  };
}
