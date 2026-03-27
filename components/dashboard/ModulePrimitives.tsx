'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

type AccentTone = 'orange' | 'amber' | 'sky' | 'emerald' | 'indigo' | 'rose';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const ACCENT_STYLES: Record<
  AccentTone,
  {
    hero: string;
    chip: string;
    statGlow: string;
    icon: string;
    button: string;
    subtleButton: string;
  }
> = {
  orange: {
    hero:
      'border-orange-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))]',
    chip: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
    statGlow: 'from-orange-500/12 via-orange-500/0 to-transparent',
    icon: 'bg-orange-500/12 text-orange-300',
    button: 'bg-orange-500 text-black hover:bg-orange-400',
    subtleButton: 'border-orange-500/20 text-orange-200 hover:bg-orange-500/10',
  },
  amber: {
    hero:
      'border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))]',
    chip: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    statGlow: 'from-amber-500/12 via-amber-500/0 to-transparent',
    icon: 'bg-amber-500/12 text-amber-300',
    button: 'bg-amber-500 text-black hover:bg-amber-400',
    subtleButton: 'border-amber-500/20 text-amber-200 hover:bg-amber-500/10',
  },
  sky: {
    hero:
      'border-sky-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))]',
    chip: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    statGlow: 'from-sky-500/12 via-sky-500/0 to-transparent',
    icon: 'bg-sky-500/12 text-sky-300',
    button: 'bg-sky-500 text-black hover:bg-sky-400',
    subtleButton: 'border-sky-500/20 text-sky-200 hover:bg-sky-500/10',
  },
  emerald: {
    hero:
      'border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))]',
    chip: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    statGlow: 'from-emerald-500/12 via-emerald-500/0 to-transparent',
    icon: 'bg-emerald-500/12 text-emerald-300',
    button: 'bg-emerald-500 text-black hover:bg-emerald-400',
    subtleButton: 'border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/10',
  },
  indigo: {
    hero:
      'border-indigo-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))]',
    chip: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-200',
    statGlow: 'from-indigo-500/12 via-indigo-500/0 to-transparent',
    icon: 'bg-indigo-500/12 text-indigo-300',
    button: 'bg-indigo-500 text-white hover:bg-indigo-400',
    subtleButton: 'border-indigo-500/20 text-indigo-200 hover:bg-indigo-500/10',
  },
  rose: {
    hero:
      'border-rose-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.16),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))]',
    chip: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
    statGlow: 'from-rose-500/12 via-rose-500/0 to-transparent',
    icon: 'bg-rose-500/12 text-rose-300',
    button: 'bg-rose-500 text-white hover:bg-rose-400',
    subtleButton: 'border-rose-500/20 text-rose-200 hover:bg-rose-500/10',
  },
};

interface ModuleShellProps {
  children: React.ReactNode;
}

export function ModuleShell({ children }: ModuleShellProps) {
  return (
    <div data-lioness-shell className="min-h-screen space-y-6 bg-transparent p-4 text-white md:space-y-8 md:p-8">
      {children}
    </div>
  );
}

interface HeroChip {
  label: string;
  value: string;
}

interface ModuleHeroProps {
  badge: string;
  title: string;
  description: string;
  accent?: AccentTone;
  chips?: HeroChip[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function ModuleHero({
  badge,
  title,
  description,
  accent = 'orange',
  chips = [],
  actions,
  children,
}: ModuleHeroProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <section
      data-lioness-hero
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_36px_120px_-60px_rgba(0,0,0,0.75)] md:rounded-[34px] md:p-8 ${styles.hero}`}
    >
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] ${styles.chip}`}
          >
            {badge}
          </div>

          <h2 data-lioness-hero-title className="mt-4 text-2xl font-bold leading-tight text-white md:text-4xl xl:text-5xl">
            {title}
          </h2>
          <p data-lioness-hero-description className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base md:leading-7">
            {description}
          </p>

          {chips.length > 0 && (
            <div data-lioness-chip-list className="mt-5 flex flex-wrap gap-2.5">
              {chips.map((chip) => (
                <div
                  key={`${chip.label}-${chip.value}`}
                  className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 md:px-4 md:text-sm"
                >
                  <span className="font-bold text-white">{chip.label}:</span> {chip.value}
                </div>
              ))}
            </div>
          )}
        </div>

        {actions ? <div data-lioness-hero-actions className="grid gap-3 sm:grid-cols-2 xl:w-[400px]">{actions}</div> : null}
      </div>

      {children}
    </section>
  );
}

interface ModuleHeroActionProps {
  label: string;
  subtitle: string;
  icon: IconComponent;
  accent?: AccentTone;
  onClick?: () => void;
  filled?: boolean;
  disabled?: boolean;
}

export function ModuleHeroAction({
  label,
  subtitle,
  icon: Icon,
  accent = 'orange',
  onClick,
  filled = false,
  disabled = false,
}: ModuleHeroActionProps) {
  const styles = ACCENT_STYLES[accent];
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      {...(onClick ? { onClick } : {})}
      data-lioness-action
      className={`group rounded-[20px] border p-3.5 text-left transition-all md:rounded-[24px] md:p-4 ${
        filled
          ? `${styles.button}`
          : `bg-zinc-950/80 text-white border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 ${disabled ? 'opacity-60' : ''}`
      }`}
      disabled={disabled}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-bold ${filled ? 'text-current' : 'text-white'}`}>{label}</p>
          <p className={`mt-1 text-xs leading-5 ${filled ? 'text-current/70' : 'text-zinc-500'}`}>
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 ${
            filled ? 'bg-black/10 text-current' : `${styles.icon} group-hover:bg-zinc-800`
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </Comp>
  );
}

interface ModuleStatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: IconComponent;
  accent?: AccentTone;
}

export function ModuleStatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = 'orange',
}: ModuleStatCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div data-lioness-stat className="relative overflow-hidden rounded-[22px] border border-zinc-800 bg-zinc-950/90 p-4 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)] md:rounded-[28px] md:p-5">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.statGlow}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">{label}</p>
          <p data-lioness-stat-value className="mt-3 text-[1.85rem] font-bold tracking-tight text-white md:mt-4 md:text-3xl">{value}</p>
        </div>

        <div className={`rounded-2xl border border-white/6 p-3 ${styles.icon}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-500 md:mt-6">{detail}</p>
    </div>
  );
}

interface ModuleSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function ModuleSurface({ children, className = '' }: ModuleSurfaceProps) {
  return (
    <div
      data-lioness-surface
      className={`rounded-[24px] border border-zinc-800 bg-zinc-950/90 p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.9)] md:rounded-[30px] md:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

interface ModuleSectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export function ModuleSectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  onActionClick,
}: ModuleSectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">{title}</h3>
        {description ? <p className="mt-2 text-sm text-zinc-500">{description}</p> : null}
      </div>

      {actionLabel && onActionClick ? (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 transition-all hover:border-zinc-700 hover:text-white"
        >
          {actionLabel}
          <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

interface ModuleEmptyStateProps {
  icon: IconComponent;
  title: string;
  description: string;
}

export function ModuleEmptyState({
  icon: Icon,
  title,
  description,
}: ModuleEmptyStateProps) {
  return (
    <div data-lioness-empty className="rounded-[26px] border border-dashed border-zinc-800 bg-zinc-950/80 px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
        <Icon size={24} />
      </div>
      <h4 className="mt-4 text-lg font-bold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}
