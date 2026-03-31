import type { Avaliacao } from '@/types/avaliacao';

export type AvaliacaoEvolutionTone = 'improved' | 'stable' | 'worsened';

export interface AvaliacaoEvolutionMetric {
  key: 'percentual_gordura' | 'massa_magra' | 'cintura';
  label: string;
  tone: AvaliacaoEvolutionTone;
  delta: number;
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function resolveTone(delta: number, threshold: number, betterWhen: 'higher' | 'lower'): AvaliacaoEvolutionTone {
  if (Math.abs(delta) < threshold) {
    return 'stable';
  }

  if (betterWhen === 'lower') {
    return delta < 0 ? 'improved' : 'worsened';
  }

  return delta > 0 ? 'improved' : 'worsened';
}

export function evaluateAvaliacaoMetric(
  currentValue: number | null | undefined,
  previousValue: number | null | undefined,
  options: {
    key: AvaliacaoEvolutionMetric['key'];
    label: string;
    betterWhen: 'higher' | 'lower';
    threshold: number;
  },
): AvaliacaoEvolutionMetric | null {
  const current = toNumber(currentValue);
  const previous = toNumber(previousValue);

  if (current === null || previous === null) {
    return null;
  }

  const delta = Number((current - previous).toFixed(2));
  return {
    key: options.key,
    label: options.label,
    delta,
    tone: resolveTone(delta, options.threshold, options.betterWhen),
  };
}

export function getAvaliacaoEvolutionMetrics(
  current: Pick<Avaliacao, 'percentual_gordura' | 'massa_magra' | 'cintura'> | null | undefined,
  previous: Pick<Avaliacao, 'percentual_gordura' | 'massa_magra' | 'cintura'> | null | undefined,
): AvaliacaoEvolutionMetric[] {
  if (!current || !previous) {
    return [];
  }

  return [
    evaluateAvaliacaoMetric(current.percentual_gordura, previous.percentual_gordura, {
      key: 'percentual_gordura',
      label: 'Gordura corporal',
      betterWhen: 'lower',
      threshold: 0.1,
    }),
    evaluateAvaliacaoMetric(current.massa_magra, previous.massa_magra, {
      key: 'massa_magra',
      label: 'Massa magra',
      betterWhen: 'higher',
      threshold: 0.1,
    }),
    evaluateAvaliacaoMetric(current.cintura, previous.cintura, {
      key: 'cintura',
      label: 'Cintura',
      betterWhen: 'lower',
      threshold: 0.3,
    }),
  ].filter(Boolean) as AvaliacaoEvolutionMetric[];
}

export function describeAvaliacaoEvolution(
  current: Pick<Avaliacao, 'percentual_gordura' | 'massa_magra' | 'cintura'> | null | undefined,
  previous: Pick<Avaliacao, 'percentual_gordura' | 'massa_magra' | 'cintura'> | null | undefined,
): string | null {
  const metrics = getAvaliacaoEvolutionMetrics(current, previous);
  if (metrics.length === 0) {
    return null;
  }

  const improved = metrics.filter((item) => item.tone === 'improved').map((item) => item.label.toLowerCase());
  const worsened = metrics.filter((item) => item.tone === 'worsened').map((item) => item.label.toLowerCase());

  if (improved.length > 0) {
    const best = improved.slice(0, 2).join(' e ');
    return `Sua evolucao mais recente mostrou melhora em ${best}.`;
  }

  if (worsened.length > 0) {
    const alert = worsened.slice(0, 2).join(' e ');
    return `Sua nova comparacao pede atencao em ${alert}.`;
  }

  return 'Sua comparacao corporal mais recente ficou estavel.';
}
