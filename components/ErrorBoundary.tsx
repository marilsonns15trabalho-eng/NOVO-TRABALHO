'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1c1b1b] mb-2 uppercase font-display">
            Ops! Algo deu errado
          </h1>
          <p className="text-stone-500 max-w-md mb-8 font-medium">
            Ocorreu um erro inesperado no sistema. Nossa equipe técnica já foi notificada.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-[#ab3600] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-[#ff5f1f] transition-all active:scale-95"
          >
            <RefreshCcw size={16} />
            Recarregar Aplicativo
          </button>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 p-4 bg-stone-100 rounded-lg text-left overflow-auto max-w-full">
              <p className="text-[10px] font-mono text-stone-400 uppercase mb-2">Detalhes do Erro (Dev Only)</p>
              <pre className="text-xs text-red-800 font-mono">
                {this.state.error?.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
