'use client';

// Componente FormField reutilizável — Label + Input com estilos padronizados
import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  /** Ícone exibido antes do label */
  icon?: React.ReactNode;
  /** Ocupa a largura inteira (md:col-span-2) */
  fullWidth?: boolean;
  /** Variante de estilo do label */
  labelVariant?: 'uppercase' | 'normal';
}

/** Classes CSS padronizadas para inputs de formulário */
export const inputClassName =
  'w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all';

/** Classes CSS padronizadas para selects */
export const selectClassName =
  'w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all';

/** Classes CSS padronizadas para textareas */
export const textareaClassName =
  'w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none';

export default function FormField({
  label,
  required = false,
  children,
  icon,
  fullWidth = false,
  labelVariant = 'uppercase',
}: FormFieldProps) {
  const labelClass = labelVariant === 'uppercase'
    ? 'text-xs font-bold text-zinc-500 uppercase tracking-widest'
    : 'text-sm font-medium text-zinc-400';

  return (
    <div className={`space-y-1.5 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <label className={`${labelClass} flex items-center gap-1`}>
        {icon}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
