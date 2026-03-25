'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useUserRole } from '@/hooks/useUserRole';
import { Activity, Dumbbell, Users, Utensils, Loader2, Calendar, Scale } from 'lucide-react';
import { fetchProfessorDashboardData, type ProfessorDashboardData } from '@/services/professorDashboard.service';

export default function ProfessorDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { isReadOnly } = useUserRole();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfessorDashboardData | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetchProfessorDashboardData();
        setData(res);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const cards = useMemo(
    () => [
      { id: 'alunos', label: 'Alunos', icon: Users },
      { id: 'treinos', label: 'Treinos', icon: Dumbbell },
      { id: 'avaliacao', label: 'Avaliações', icon: Activity },
      { id: 'anamnese', label: 'Anamnese', icon: Utensils },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full"
    >
      <div className="p-8 space-y-8 bg-black min-h-screen text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Visão do Professor</h2>
            <p className="text-zinc-500">
              {isReadOnly ? 'Somente visualização nas telas de edição.' : ''}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-blue-500" size={42} />
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total Alunos</p>
              <p className="text-3xl font-bold">{data.stats.totalAlunos}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Ativos</p>
              <p className="text-3xl font-bold text-emerald-500">{data.stats.alunosAtivos}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Inativos</p>
              <p className="text-3xl font-bold text-rose-500">{data.stats.alunosInativos}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Treinos Ativos</p>
              <p className="text-3xl font-bold text-blue-500">{data.stats.treinosAtivos}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 md:col-span-1 lg:col-span-1">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Avaliações (30d)</p>
              <p className="text-3xl font-bold text-purple-500">{data.stats.avaliacoesRecentes30d}</p>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                Últimas avaliações
              </h3>
              <button
                onClick={() => onNavigate('avaliacao')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-xl transition-all active:scale-95"
              >
                Abrir
              </button>
            </div>

            <div className="space-y-3">
              {data.ultimasAvaliacoes.length === 0 ? (
                <p className="text-zinc-500 text-sm">Nenhuma avaliação encontrada.</p>
              ) : (
                data.ultimasAvaliacoes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-zinc-800 bg-black/30"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{a.students?.nome || 'Aluno'}</p>
                      <p className="text-xs text-zinc-500">
                        {a.data ? new Date(a.data).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Peso</p>
                        <p className="text-sm font-bold">{typeof a.peso === 'number' ? `${a.peso} kg` : '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">BF</p>
                        <div className="flex items-center justify-end gap-1">
                          <Scale size={14} className="text-purple-500" />
                          <p className="text-sm font-bold">{typeof a.percentual_gordura === 'number' ? `${a.percentual_gordura}%` : '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <button
                key={`${c.id}-${idx}`}
                onClick={() => onNavigate(c.id)}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Acesso</p>
                    <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{c.label}</h3>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-2xl group-hover:bg-blue-500 transition-colors">
                    <Icon size={24} className="text-blue-500 group-hover:text-black transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

