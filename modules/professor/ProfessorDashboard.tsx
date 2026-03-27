'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Calendar, Dumbbell, Loader2, Scale, Users, Utensils } from 'lucide-react';
import {
  fetchProfessorDashboardData,
  type ProfessorDashboardData,
} from '@/services/professorDashboard.service';

export default function ProfessorDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfessorDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchProfessorDashboardData();
        setData(result);
      } catch (err: any) {
        setData(null);
        setError(err?.message || 'Nao foi possivel carregar a visao do professor.');
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
      { id: 'avaliacao', label: 'Avaliacoes', icon: Activity },
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
      <div className="min-h-screen space-y-8 bg-black p-8 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Visao do Professor</h2>
            <p className="text-zinc-500">Acesso operacional para alunos, treinos, avaliacoes e anamneses.</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="animate-spin text-blue-500" size={42} />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-lg font-bold text-white">Falha ao carregar o painel do professor</p>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Total Alunos</p>
              <p className="text-3xl font-bold">{data.stats.totalAlunos}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ativos</p>
              <p className="text-3xl font-bold text-emerald-500">{data.stats.alunosAtivos}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Inativos</p>
              <p className="text-3xl font-bold text-rose-500">{data.stats.alunosInativos}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Treinos Ativos</p>
              <p className="text-3xl font-bold text-blue-500">{data.stats.treinosAtivos}</p>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Avaliacoes (30d)</p>
              <p className="text-3xl font-bold text-purple-500">{data.stats.avaliacoesRecentes30d}</p>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <Calendar size={20} className="text-blue-500" />
                Ultimas avaliacoes
              </h3>
              <button
                onClick={() => onNavigate('avaliacao')}
                className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-black transition-all active:scale-95 hover:bg-blue-600"
              >
                Abrir
              </button>
            </div>

            <div className="space-y-3">
              {data.ultimasAvaliacoes.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma avaliacao encontrada.</p>
              ) : (
                data.ultimasAvaliacoes.map((avaliacao) => (
                  <div
                    key={avaliacao.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black/30 p-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{avaliacao.students?.nome || 'Aluno'}</p>
                      <p className="text-xs text-zinc-500">
                        {avaliacao.data ? new Date(avaliacao.data).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Peso</p>
                        <p className="text-sm font-bold">
                          {typeof avaliacao.peso === 'number' ? `${avaliacao.peso} kg` : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">BF</p>
                        <div className="flex items-center justify-end gap-1">
                          <Scale size={14} className="text-purple-500" />
                          <p className="text-sm font-bold">
                            {typeof avaliacao.percentual_gordura === 'number'
                              ? `${avaliacao.percentual_gordura}%`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-left transition-all hover:border-blue-500/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Acesso</p>
                    <h3 className="text-xl font-bold transition-colors group-hover:text-blue-400">
                      {card.label}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-zinc-800 p-3 transition-colors group-hover:bg-blue-500">
                    <Icon size={24} className="text-blue-500 transition-colors group-hover:text-black" />
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
