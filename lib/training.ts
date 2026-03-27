import type { Treino } from '@/types/treino';

export const TRAINING_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'] as const;

export function formatTrainingDay(dayOfWeek?: number | null): string {
  if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
    return 'Sem agenda';
  }

  return TRAINING_DAY_LABELS[dayOfWeek];
}

export function getTodayDayOfWeek(referenceDate = new Date()): number {
  return referenceDate.getDay();
}

export function isTreinoRecentlyUpdated(
  treino: Pick<Treino, 'created_at' | 'updated_at'>,
  referenceDate = new Date(),
  windowHours = 72,
): boolean {
  if (!treino.updated_at || !treino.created_at) {
    return false;
  }

  const updatedAt = new Date(treino.updated_at).getTime();
  const createdAt = new Date(treino.created_at).getTime();
  const referenceTime = referenceDate.getTime();

  if (Number.isNaN(updatedAt) || Number.isNaN(createdAt)) {
    return false;
  }

  if (updatedAt <= createdAt) {
    return false;
  }

  return referenceTime - updatedAt <= windowHours * 60 * 60 * 1000;
}

export function isTreinoScheduledForToday(
  treino: Pick<Treino, 'day_of_week'>,
  referenceDate = new Date(),
): boolean {
  if (treino.day_of_week == null) {
    return false;
  }

  return treino.day_of_week === getTodayDayOfWeek(referenceDate);
}

export function pickTodayWorkout(treinos: Treino[], referenceDate = new Date()): Treino | null {
  const scheduled = treinos
    .filter((treino) => treino.ativo !== false)
    .filter((treino) => isTreinoScheduledForToday(treino, referenceDate))
    .sort((a, b) => {
      const aInProgress = a.current_execution?.status === 'in_progress' ? 1 : 0;
      const bInProgress = b.current_execution?.status === 'in_progress' ? 1 : 0;
      if (aInProgress !== bInProgress) {
        return bInProgress - aInProgress;
      }

      const aCompleted = a.completed_today ? 1 : 0;
      const bCompleted = b.completed_today ? 1 : 0;
      if (aCompleted !== bCompleted) {
        return aCompleted - bCompleted;
      }

      const aSort = a.sort_order ?? 0;
      const bSort = b.sort_order ?? 0;
      if (aSort !== bSort) {
        return aSort - bSort;
      }

      return a.nome.localeCompare(b.nome);
    });

  return scheduled[0] ?? null;
}
