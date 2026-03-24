'use client';

// Componente LoadingSpinner reutilizável
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /** Mensagem exibida abaixo do spinner */
  message?: string;
  /** Cor do spinner (classe Tailwind, ex: 'text-orange-500') */
  color?: string;
  /** Tamanho do ícone (px) */
  size?: number;
  /** Se true, ocupa a altura total da tela */
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = 'Carregando...',
  color = 'text-orange-500',
  size = 40,
  fullScreen = true,
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${fullScreen ? 'p-8 min-h-screen bg-black' : 'p-20'}`}>
      <Loader2 className={`${color} animate-spin`} size={size} />
      {message && <p className="text-zinc-500 font-medium">{message}</p>}
    </div>
  );
}
