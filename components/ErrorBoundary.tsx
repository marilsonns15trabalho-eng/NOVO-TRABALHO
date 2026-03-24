'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 max-w-lg w-full text-center space-y-6 shadow-2xl shadow-orange-500/10">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
              <AlertTriangle className="text-orange-500" size={40} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Ops! Algo deu errado</h2>
              <p className="text-zinc-500">
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/50 rounded-2xl p-4 border border-zinc-800 text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-zinc-400 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RefreshCcw size={20} />
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
