'use client';

import React from 'react';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AlertCircle, CheckCircle2, RefreshCw, Database, ShieldAlert } from 'lucide-react';

export default function DebugPage() {
  const [results, setResults] = React.useState<any[]>([]);
  const [isTesting, setIsTesting] = React.useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    setResults([]);
    
    const tests = [
      { name: 'Conexão Supabase', table: 'students', operation: 'select' },
      { name: 'Tabela Transações', table: 'transactions', operation: 'select' },
      { name: 'Tabela Pagamentos', table: 'memberships', operation: 'select' },
      { name: 'Tabela Avaliações', table: 'assessments', operation: 'select' },
      { name: 'Tabela Treinos', table: 'workouts', operation: 'select' },
    ];

    for (const test of tests) {
      try {
        const { data, error, status, statusText } = await supabase
          .from(test.table)
          .select('*')
          .limit(1);

        setResults(prev => [...prev, {
          ...test,
          success: !error,
          error: error ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            status,
            statusText
          } : null,
          count: data?.length || 0
        }]);
      } catch (err: any) {
        setResults(prev => [...prev, {
          ...test,
          success: false,
          error: { message: err.message || 'Erro de exceção' }
        }]);
      }
    }
    setIsTesting(false);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diagnóstico do Sistema</h1>
            <p className="text-gray-500 text-sm">Verifique a saúde da conexão com o banco de dados e permissões.</p>
          </div>

          <button 
            onClick={testConnection}
            disabled={isTesting}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            {isTesting ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
            {isTesting ? 'Testando...' : 'Executar Testes de Conexão'}
          </button>

          <div className="grid grid-cols-1 gap-4">
            {results.map((res, i) => (
              <div key={i} className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {res.success ? (
                      <CheckCircle2 className="text-emerald-500" size={24} />
                    ) : (
                      <ShieldAlert className="text-red-500" size={24} />
                    )}
                    <h3 className="font-bold text-lg">{res.name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${res.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {res.success ? 'OK' : 'FALHA'}
                  </span>
                </div>

                {!res.success && res.error && (
                  <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-2">
                    <p className="text-red-400 text-sm font-bold">Erro: {res.error.message}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-500">
                      <p>Código: {res.error.code}</p>
                      <p>Status: {res.error.status} ({res.error.statusText})</p>
                      <p className="col-span-2">Detalhes: {res.error.details || 'Nenhum'}</p>
                      <p className="col-span-2">Dica: {res.error.hint || 'Nenhuma'}</p>
                    </div>
                  </div>
                )}

                {res.success && (
                  <p className="text-emerald-500/60 text-xs">
                    Conexão estabelecida com sucesso. Registros encontrados: {res.count}
                  </p>
                )}
              </div>
            ))}
          </div>

          {results.length === 0 && !isTesting && (
            <div className="bg-[#1a1d26] p-12 rounded-3xl border border-white/5 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 mx-auto">
                <AlertCircle size={32} />
              </div>
              <p className="text-gray-500 text-sm">Clique no botão acima para iniciar os testes de diagnóstico.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
