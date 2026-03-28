'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarRange,
  CreditCard,
  Dumbbell,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';

const featureCards = [
  {
    icon: Users,
    title: 'Alunos',
    description: 'Cadastro, plano ativo, acesso e historico individual.',
    accent: 'text-sky-300',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Dumbbell,
    title: 'Treinos',
    description: 'Planos semanais, execucao e progresso mensal por aluno.',
    accent: 'text-orange-300',
    bg: 'bg-orange-500/10',
  },
  {
    icon: CreditCard,
    title: 'Financeiro',
    description: 'Vencimentos, boletos e acompanhamento de recebimento.',
    accent: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Activity,
    title: 'Avaliacoes',
    description: 'Historico corporal, comparacao e PDF de evolucao.',
    accent: 'text-fuchsia-300',
    bg: 'bg-fuchsia-500/10',
  },
];

const roleCards = [
  {
    title: 'Administracao',
    description: 'Controla cadastros, acessos, planos, cobrancas e configuracoes.',
  },
  {
    title: 'Professor',
    description: 'Acompanha alunos, treinos, anamneses e avaliacoes da carteira.',
  },
  {
    title: 'Aluno',
    description: 'Consulta treino, progresso, avaliacoes e dados pessoais.',
  },
];

export default function LandingPage() {
  const { user, role, isReady } = useAuth();
  const router = useRouter();
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    setIsNativeApp(Boolean((window as any).Capacitor?.isNativePlatform?.()));
  }, []);

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  if (isNativeApp) {
    return (
      <div className="min-h-screen overflow-hidden bg-black px-4 py-6 text-white md:px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[280px] w-[280px] rounded-full bg-sky-500/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col justify-between rounded-[34px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(135deg,rgba(20,20,24,0.96),rgba(8,8,8,0.98))] p-6 shadow-[0_36px_120px_-64px_rgba(249,115,22,0.45)] md:p-8">
          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-orange-500 text-3xl font-black text-black">
              L
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
                App do estudio
              </p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-white">
                Lioness Prime
              </h1>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                Acesso rapido para administracao, professor e aluno com treino, avaliacoes,
                financeiro e acompanhamento do estudio no mesmo app.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {featureCards.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[24px] border border-zinc-800 bg-black/25 px-4 py-4"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}>
                    <item.icon size={20} className={item.accent} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push('/auth')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-bold text-black transition-all hover:bg-orange-400"
            >
              Entrar no app
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => router.push('/auth?mode=recover')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-4 text-sm font-bold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              Recuperar acesso
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[340px] w-[340px] rounded-full bg-sky-500/8 blur-[120px]" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800/60 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-xl font-black text-black">
              L
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.2em] text-white md:text-base">LIONESS</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400">Personal Studio</p>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => router.push('/auth?mode=recover')}
              className="rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 transition-all hover:border-zinc-700 hover:text-white md:px-5"
            >
              Recuperar senha
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-orange-400 md:px-5"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      <main className="relative px-4 pb-16 pt-28 md:px-6 md:pb-20 md:pt-32">
        <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[30px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(135deg,rgba(20,20,24,0.96),rgba(8,8,8,0.98))] p-5 shadow-[0_40px_120px_-70px_rgba(249,115,22,0.45)] md:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-300">
              <BriefcaseBusiness size={14} />
              Painel do estudio
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-white md:text-6xl">
              Cadastro, treinos, avaliacoes, anamnese e financeiro no mesmo sistema.
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
              O painel concentra a rotina do estudio: cadastro de alunos, acesso individual,
              prescricao de treino, acompanhamento corporal, historico nutricional e cobranca.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push('/auth')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-orange-400"
              >
                Acessar plataforma
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => router.push('/auth?mode=recover')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-3 text-sm font-bold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                Recuperar acesso
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Cadastro
                </p>
                <p className="mt-3 text-lg font-bold text-white">Alunos, acessos e planos</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Treino
                </p>
                <p className="mt-3 text-lg font-bold text-white">Execucao, progresso e historico</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                  Financeiro
                </p>
                <p className="mt-3 text-lg font-bold text-white">Vencimentos e recebimentos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="grid gap-6"
          >
            <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/90 p-5 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)] md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                    Dentro da plataforma
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">Modulos principais</h3>
                </div>
                <ShieldCheck className="text-orange-400" size={20} />
              </div>

              <div className="mt-5 grid gap-3">
                {featureCards.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black/25 px-4 py-4"
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}>
                      <item.icon size={20} className={item.accent} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-5 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)] md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                    <CalendarRange size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Atendimento
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">Da ficha ao acompanhamento</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Cadastro, anamnese, avaliacao, treino e consulta do historico do aluno em um fluxo unico.
                </p>
              </div>

              <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-5 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)] md:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                      Permissoes
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">Leitura separada por perfil</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Administracao, professor e aluno acessam apenas as areas que fazem parte da propria rotina.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto mt-8 max-w-7xl">
          <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/80 p-5 shadow-[0_28px_90px_-60px_rgba(0,0,0,0.9)] md:p-6">
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                Niveis de acesso
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">Cada perfil enxerga o que precisa</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {roleCards.map((roleCard) => (
                <div
                  key={roleCard.title}
                  className="rounded-2xl border border-zinc-800 bg-black/25 p-5"
                >
                  <p className="text-lg font-bold text-white">{roleCard.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{roleCard.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/70 px-4 py-6 text-center md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
          {new Date().getFullYear()} Lioness Personal Studio
        </p>
      </footer>
    </div>
  );
}
