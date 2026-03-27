'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Calendar, ClipboardList, Dumbbell, Loader2, LogOut, Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import AccountSecurityForm from '@/components/account/AccountSecurityForm';
import * as avaliacoesService from '@/services/avaliacoes.service';
import * as treinosService from '@/services/treinos.service';
import type { Avaliacao } from '@/types/avaliacao';
import type { Treino } from '@/types/treino';

interface StudentPlan {
  plan_name?: string;
  plan_price?: number;
}

export default function AlunoDashboard() {
  const { user, profile, signOut, isReady } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!isReady || !user) return;

      try {
        setLoading(true);

        const { data: studentRow } = await supabase
          .from('students')
          .select('id')
          .eq('linked_auth_user_id', user.id)
          .maybeSingle();

        const resolvedStudentId = studentRow?.id ?? null;
        setStudentId(resolvedStudentId);

        const [treinosData, avaliacoesData] = await Promise.all([
          treinosService.fetchTreinos(user.id),
          avaliacoesService.fetchAvaliacoes(user.id),
        ]);

        setTreinos(treinosData);
        setAvaliacoes(avaliacoesData);

        if (!resolvedStudentId) {
          setPlan(null);
          return;
        }

        const { data: assinaturaRows } = await supabase
          .from('assinaturas')
          .select('plan_name, plan_price')
          .eq('student_id', resolvedStudentId)
          .order('created_at', { ascending: false })
          .limit(1);

        const currentPlan = (assinaturaRows || [])[0] as StudentPlan | undefined;
        setPlan(currentPlan || null);
      } catch (error) {
        console.error('Erro ao carregar area do aluno:', error);
        setPlan(null);
        setTreinos([]);
        setAvaliacoes([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isReady, user]);

  const latestAvaliacao = useMemo(() => avaliacoes[0] ?? null, [avaliacoes]);
  const mustChangePassword = Boolean(profile?.must_change_password);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!isReady || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin text-orange-500" size={42} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="min-h-screen bg-black text-white"
    >
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Area do Aluno</p>
            <h1 className="text-2xl font-bold tracking-tight">
              {profile?.display_name || user?.email?.split('@')[0] || 'Aluno'}
            </h1>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <AccountSecurityForm required={mustChangePassword} />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Meu Plano</p>
                <h2 className="text-2xl font-bold">{plan?.plan_name || 'Sem plano ativo'}</h2>
              </div>
              <div className="rounded-2xl bg-zinc-800 p-3">
                <ClipboardList size={24} className="text-orange-500" />
              </div>
            </div>
            <p className="text-sm text-zinc-500">
              {plan?.plan_price ? `R$ ${Number(plan.plan_price).toFixed(2)} por mes` : 'Consulte a recepcao para detalhes do plano.'}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Treinos</p>
                <h2 className="text-2xl font-bold">{treinos.length}</h2>
              </div>
              <div className="rounded-2xl bg-zinc-800 p-3">
                <Dumbbell size={24} className="text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-zinc-500">
              {studentId ? 'Seus treinos disponiveis para consulta.' : 'Seu vinculo de aluno ainda nao foi encontrado.'}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Ultima Avaliacao</p>
                <h2 className="text-2xl font-bold">
                  {latestAvaliacao?.data ? new Date(latestAvaliacao.data).toLocaleDateString('pt-BR') : 'Sem registro'}
                </h2>
              </div>
              <div className="rounded-2xl bg-zinc-800 p-3">
                <Activity size={24} className="text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-zinc-500">
              {latestAvaliacao?.percentual_gordura != null
                ? `Percentual de gordura: ${latestAvaliacao.percentual_gordura}%`
                : 'Nenhuma avaliacao fisica disponivel.'}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Leitura</p>
              <h2 className="text-2xl font-bold">Meus Treinos</h2>
            </div>
            <Dumbbell size={22} className="text-blue-500" />
          </div>

          {treinos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
              Nenhum treino disponivel no momento.
            </p>
          ) : (
            <div className="space-y-4">
              {treinos.map((treino) => (
                <div
                  key={treino.id}
                  className="rounded-2xl border border-zinc-800 bg-black/30 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white">{treino.nome}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{treino.descricao || 'Sem descricao adicional.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <span className="rounded-full border border-zinc-800 px-3 py-1">
                        {treino.nivel || 'Sem nivel'}
                      </span>
                      <span className="rounded-full border border-zinc-800 px-3 py-1">
                        {treino.duracao_minutos || 0} min
                      </span>
                      <span className="rounded-full border border-zinc-800 px-3 py-1">
                        {treino.ativo === false ? 'Inativo' : 'Ativo'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} />
                      {treino.created_at
                        ? new Date(treino.created_at).toLocaleDateString('pt-BR')
                        : 'Sem data'}
                    </span>
                    <span>Objetivo: {treino.objetivo || 'Nao informado'}</span>
                    <span>Exercicios: {treino.exercicios?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Leitura</p>
              <h2 className="text-2xl font-bold">Minhas Avaliacoes</h2>
            </div>
            <Activity size={22} className="text-purple-500" />
          </div>

          {avaliacoes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-800 bg-black/20 px-5 py-6 text-sm text-zinc-500">
              Nenhuma avaliacao fisica disponivel no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {avaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="rounded-2xl border border-zinc-800 bg-black/30 p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {avaliacao.data
                          ? new Date(avaliacao.data).toLocaleDateString('pt-BR')
                          : 'Sem data'}
                      </p>
                      <p className="text-xs uppercase tracking-widest text-zinc-500">
                        Registro de composicao corporal
                      </p>
                    </div>
                    <div className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {avaliacao.protocolo || 'faulkner'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Peso</p>
                      <p className="font-bold text-white">{avaliacao.peso ?? '-'} kg</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">IMC</p>
                      <p className="font-bold text-white">{avaliacao.imc ?? '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Altura</p>
                      <p className="font-bold text-white">{avaliacao.altura ?? '-'} m</p>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        <Scale size={12} />
                        BF
                      </p>
                      <p className="font-bold text-white">
                        {avaliacao.percentual_gordura != null ? `${avaliacao.percentual_gordura}%` : '-'}
                      </p>
                    </div>
                  </div>

                  {avaliacao.observacoes && (
                    <p className="mt-4 text-sm text-zinc-500">{avaliacao.observacoes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {mustChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6 py-10 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <AccountSecurityForm required compact />
          </div>
        </div>
      )}
    </motion.div>
  );
}
