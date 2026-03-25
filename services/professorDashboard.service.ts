import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';

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
  students?: { nome: string };
}

export interface ProfessorDashboardData {
  stats: ProfessorDashboardStats;
  ultimasAvaliacoes: ProfessorDashboardRecentEvaluation[];
}

export async function fetchProfessorDashboardData(): Promise<ProfessorDashboardData> {
  const now = new Date();
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since30dStr = since30d.toISOString().split('T')[0]; // avaliacoes.data é DATE

  const [
    totalAlunosRes,
    ativosRes,
    inativosRes,
    treinosAtivosRes,
    avaliacoesRecentesRes,
    ultimasAvaliacoesRes,
  ] = await Promise.all([
    supabase.from(TABLES.STUDENTS).select('*', { count: 'exact', head: true }),
    supabase.from(TABLES.STUDENTS).select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from(TABLES.STUDENTS).select('*', { count: 'exact', head: true }).eq('status', 'inativo'),
    supabase.from(TABLES.TREINOS).select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase
      .from(TABLES.AVALIACOES)
      .select('*', { count: 'exact', head: true })
      .gte('data', since30dStr),
    supabase
      .from(TABLES.AVALIACOES)
      .select('id, data, peso, percentual_gordura, students(nome: name)')
      .order('data', { ascending: false })
      .limit(5),
  ]);

  const totalAlunos = totalAlunosRes.count || 0;
  const alunosAtivos = ativosRes.count || 0;
  const alunosInativos = inativosRes.count || 0;
  const treinosAtivos = treinosAtivosRes.count || 0;
  const avaliacoesRecentes30d = avaliacoesRecentesRes.count || 0;

  const ultimasAvaliacoes = (ultimasAvaliacoesRes.data || []).map((a: any) => {
    const studentsRaw = a.students;
    const studentsObj = Array.isArray(studentsRaw) ? studentsRaw[0] : studentsRaw;
    return {
      id: a.id,
      data: a.data,
      peso: a.peso ?? null,
      percentual_gordura: a.percentual_gordura ?? null,
      students: studentsObj ? { nome: studentsObj.nome || studentsObj.name || '' } : undefined,
    } as ProfessorDashboardRecentEvaluation;
  });

  return {
    stats: {
      totalAlunos,
      alunosAtivos,
      alunosInativos,
      treinosAtivos,
      avaliacoesRecentes30d,
    },
    ultimasAvaliacoes,
  };
}

