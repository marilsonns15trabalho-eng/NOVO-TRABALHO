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

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black p-8">
          <div className="w-full max-w-lg space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-10 text-center shadow-2xl shadow-orange-500/10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10">
              <AlertTriangle className="text-orange-500" size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Ops! Algo deu errado</h2>
              <p className="text-zinc-500">
                Ocorreu um erro inesperado nesta tela. Tente abrir novamente.
              </p>
            </div>

            {this.state.error ? (
              <div className="max-h-40 overflow-auto rounded-2xl border border-zinc-800 bg-black/50 p-4 text-left">
                <p className="break-words font-mono text-xs text-zinc-400">{this.state.error.toString()}</p>
              </div>
            ) : null}

            <button
              onClick={this.handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-bold text-black transition-all hover:bg-orange-600 active:scale-95"
            >
              <RefreshCcw size={20} />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
