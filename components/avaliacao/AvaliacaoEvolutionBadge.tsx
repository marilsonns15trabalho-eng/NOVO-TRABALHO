'use client';

import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { AvaliacaoEvolutionTone } from '@/lib/avaliacao-evolution';

interface AvaliacaoEvolutionBadgeProps {
  tone: AvaliacaoEvolutionTone;
  label?: string;
}

const TONE_STYLES: Record<
  AvaliacaoEvolutionTone,
  {
    className: string;
    text: string;
    Icon: typeof ArrowRight;
  }
> = {
  improved: {
    className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    text: 'Melhorou',
    Icon: ArrowUpRight,
  },
  stable: {
    className: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    text: 'Estavel',
    Icon: ArrowRight,
  },
  worsened: {
    className: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    text: 'Piorou',
    Icon: ArrowDownRight,
  },
};

export default function AvaliacaoEvolutionBadge({
  tone,
  label,
}: AvaliacaoEvolutionBadgeProps) {
  const config = TONE_STYLES[tone];
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${config.className}`}
    >
      <Icon size={12} />
      {label || config.text}
    </span>
  );
}
