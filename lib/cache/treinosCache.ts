import type { Treino } from '@/types/treino';

const TREINOS_CACHE_KEY = (userId: string) => `treinos_cache_${userId}`;

export function saveTreinosCache(userId: string, treinos: Treino[]) {
  try {
    localStorage.setItem(TREINOS_CACHE_KEY(userId), JSON.stringify({
      data: treinos,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Erro ao salvar cache de treinos', e);
  }
}

export function getTreinosCache(userId: string): Treino[] | null {
  try {
    const raw = localStorage.getItem(TREINOS_CACHE_KEY(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const valid = Date.now() - parsed.timestamp < 1000 * 60 * 5; // 5 minutos

    return valid ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearTreinosCache(userId: string) {
  try {
    localStorage.removeItem(TREINOS_CACHE_KEY(userId));
  } catch (e) {}
}
