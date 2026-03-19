import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'paid' | 'pending' | 'overdue' | 'completed' | 'income' | 'expense';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const getStatusStyles = (type: StatusType) => {
    switch (type) {
      case 'paid':
      case 'completed':
      case 'income':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'overdue':
      case 'expense':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getLabel = (type: StatusType) => {
    if (label) return label;
    switch (type) {
      case 'paid': return 'Pago';
      case 'completed': return 'Concluído';
      case 'income': return 'Entrada';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      case 'expense': return 'Saída';
      default: return type;
    }
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      getStatusStyles(status),
      className
    )}>
      {getLabel(status)}
    </span>
  );
}
