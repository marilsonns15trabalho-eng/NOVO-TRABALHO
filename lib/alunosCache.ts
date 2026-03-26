import type { Aluno } from '@/types/aluno';

const ALUNOS_CACHE_KEY = (userId: string) => `alunos_cache_${userId}`;

export function saveAlunosCache(userId: string, alunos: Aluno[]) {
  try {
    localStorage.setItem(ALUNOS_CACHE_KEY(userId), JSON.stringify({
      data: alunos,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Erro ao salvar cache de alunos', e);
  }
}

export function getAlunosCache(userId: string): Aluno[] | null {
  try {
    const raw = localStorage.getItem(ALUNOS_CACHE_KEY(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const valid = Date.now() - parsed.timestamp < 1000 * 60 * 5; // 5 minutos

    return valid ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearAlunosCache(userId: string) {
  try {
    localStorage.removeItem(ALUNOS_CACHE_KEY(userId));
  } catch (e) {}
}
