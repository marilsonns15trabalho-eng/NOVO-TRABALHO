'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Dumbbell,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';

const WHATSAPP_URL =
  'https://wa.me/5571999856956?text=Ola%20gostaria%20de%20saber%20mais%20sobre%20o%20estudio';
const INSTAGRAM_URL =
  'https://www.instagram.com/accounts/login/?next=%2Flionesspersonalestudio%2F&source=omni_redirect';

const methodologySteps = [
  {
    title: 'Avaliacao inicial',
    description:
      'Leitura corporal, objetivos e ponto de partida para definir o direcionamento do treino.',
    icon: Activity,
  },
  {
    title: 'Treino orientado',
    description:
      'Prescricao organizada conforme frequencia semanal, nivel atual e resposta ao processo.',
    icon: Dumbbell,
  },
  {
    title: 'Acompanhamento',
    description:
      'Revisao da evolucao, ajustes de rotina e acompanhamento continuo da aluna.',
    icon: ShieldCheck,
  },
];

const studioHighlights = [
  'Centro de treinamento feminino com atendimento estruturado.',
  'Rotina com avaliacao fisica, treino e acompanhamento de evolucao.',
  'Contato direto para aula experimental e informacoes sobre disponibilidade.',
];

const planNotes = [
  'Frequencia semanal alinhada com a rotina da aluna.',
  'Organizacao de treino e progresso acompanhados de forma individual.',
  'Valores e formatos de atendimento apresentados diretamente no contato.',
];

const outlinedWordStyle: React.CSSProperties = {
  WebkitTextStroke: '1px #ff5a1f',
  color: 'transparent',
};

function LandingVisualPanel() {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,rgba(19,19,19,0.98),rgba(8,8,8,0.98))] shadow-[0_40px_120px_-70px_rgba(0,0,0,0.9)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,145,87,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,122,44,0.12),transparent_30%)]" />
      <div className="absolute inset-y-0 right-0 w-[42%] bg-[linear-gradient(180deg,rgba(52,52,52,0.68),rgba(15,15,15,0.98))]" />
      <div className="absolute -right-10 top-0 h-full w-[44%] rotate-[6deg] bg-[linear-gradient(180deg,rgba(48,48,48,0.92),rgba(20,20,20,0.98))]" />
      <div className="absolute left-[10%] top-[12%] h-5 w-[38%] rounded-full border border-white/10 bg-white/5" />
      <div className="absolute left-[22%] top-[20%] h-6 w-[22%] rounded-full border border-white/10" />
      <div className="absolute left-[18%] top-[26%] h-[2px] w-[42%] bg-white/10" />
      <div className="absolute left-[10%] top-[34%] h-[2px] w-[48%] bg-white/6" />
      <div className="absolute left-[6%] top-[18%] h-[58%] w-[58%] rounded-[28px] bg-[linear-gradient(180deg,rgba(0,0,0,0.26),rgba(0,0,0,0.72))]" />
      <div className="absolute bottom-[18%] left-[7%] h-[12px] w-[50%] rounded-full bg-black/35 blur-sm" />
      <div className="absolute bottom-[12%] left-[7%] h-[12px] w-[46%] rounded-full bg-black/25 blur-sm" />

      <div className="absolute bottom-6 left-6 right-6 grid gap-3">
        <div className="flex items-start gap-3 rounded-[24px] border border-white/8 bg-black/35 px-4 py-4 backdrop-blur-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-300">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Avaliacao e evolucao</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Historico fisico acompanhado em cada etapa do processo.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/8 bg-black/35 px-4 py-4 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Treino
            </p>
            <p className="mt-2 text-lg font-bold text-white">Prescricao orientada</p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-black/35 px-4 py-4 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Atendimento
            </p>
            <p className="mt-2 text-lg font-bold text-white">Rotina feminina estruturada</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
              {[
                {
                  icon: Activity,
                  title: 'Alunas e evolucao',
                  description: 'Historico, avaliacao fisica e leitura do progresso.',
                },
                {
                  icon: Dumbbell,
                  title: 'Treinos',
                  description: 'Execucao organizada, acompanhamento e conclusao.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Conta',
                  description: 'Acesso seguro para administracao, professor e aluno.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[24px] border border-zinc-800 bg-black/25 px-4 py-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
                    <item.icon size={20} />
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
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-4 text-sm font-bold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-6%] top-0 h-[420px] w-[420px] rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="absolute right-[-6%] top-[18%] h-[360px] w-[360px] rounded-full bg-orange-500/6 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <a href="/" className="text-left">
            <p className="text-2xl font-black uppercase tracking-[-0.04em] text-[#ff5a1f]">
              LIONESS
            </p>
          </a>

          <nav className="hidden items-center gap-10 text-sm font-medium text-zinc-400 lg:flex">
            <a href="#estudio" className="transition-colors hover:text-white">
              O Estudio
            </a>
            <a href="#metodologia" className="transition-colors hover:text-white">
              Metodologia
            </a>
            <a href="#planos" className="transition-colors hover:text-white">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/auth')}
              className="rounded-sm border border-white/12 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:border-white/20 hover:bg-white/5"
            >
              Fazer login
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm bg-[#ff5a1f] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black transition-all hover:bg-[#ff7a2c]"
            >
              Comecar agora
            </a>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <p className="text-[13px] font-black uppercase tracking-[0.42em] text-[#ff5a1f]">
              Centro de treinamento feminino
            </p>

            <div className="mt-6 space-y-1 leading-[0.86]">
              <div className="text-6xl font-black italic tracking-[-0.07em] text-white md:text-8xl">
                LIONESS
              </div>
              <div
                className="text-6xl font-black italic tracking-[-0.07em] md:text-8xl"
                style={outlinedWordStyle}
              >
                PERSONAL
              </div>
              <div
                className="text-6xl font-black italic tracking-[-0.07em] md:text-8xl"
                style={outlinedWordStyle}
              >
                ESTUDIO
              </div>
            </div>

            <p className="mt-10 max-w-2xl text-lg leading-8 text-zinc-400">
              Um espaco pensado para treino feminino com avaliacao fisica, acompanhamento de
              evolucao e rotina organizada em cada etapa do atendimento.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-sm bg-[#ff5a1f] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:bg-[#ff7a2c]"
              >
                Agendar aula experimental
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-sm border border-white/12 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:border-white/20 hover:bg-white/5"
              >
                Conhecer o estudio
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <LandingVisualPanel />
          </motion.div>
        </section>

        <section id="estudio" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff5a1f]">
                O estudio
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
                Estrutura de atendimento com foco em treino feminino
              </h2>
            </div>

            <div className="space-y-4">
              {studioHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] bg-[#131313] px-5 py-5 text-base leading-7 text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="metodologia" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff5a1f]">
                Metodologia
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
                Processo claro do inicio ao acompanhamento
              </h2>
            </div>

            <div className="space-y-4">
              {methodologySteps.map((step, index) => (
                <div
                  key={step.title}
                  className="grid gap-4 rounded-[24px] bg-[#131313] px-5 py-5 md:grid-cols-[72px_minmax(0,1fr)] md:items-start"
                >
                  <div className="flex items-center gap-3 md:block">
                    <p className="text-3xl font-black tracking-[-0.05em] text-[#ff5a1f]">
                      0{index + 1}
                    </p>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#20201f] text-[#ff9157] md:mt-4">
                      <step.icon size={18} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xl font-black uppercase tracking-[-0.03em] text-white">
                      {step.title}
                    </p>
                    <p className="mt-2 text-base leading-7 text-zinc-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff5a1f]">
                Planos
              </p>
              <h2 className="text-4xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
                Formatos ajustados a frequencia e ao objetivo
              </h2>
              <p className="max-w-2xl text-base leading-7 text-zinc-400">
                A definicao do plano considera rotina, frequencia semanal e momento atual da aluna.
                As orientacoes sobre disponibilidade e formato de atendimento sao passadas direto no
                contato.
              </p>
            </div>

            <div className="space-y-3">
              {planNotes.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[22px] bg-[#131313] px-5 py-4"
                >
                  <Sparkles size={18} className="mt-1 shrink-0 text-[#ff9157]" />
                  <p className="text-base leading-7 text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-6 md:px-6 md:pb-20">
          <div className="rounded-[34px] bg-[linear-gradient(135deg,rgba(255,145,87,0.14),rgba(19,19,19,0.96))] px-6 py-8 md:px-10 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff9157]">
                  Contato
                </p>
                <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
                  Quer saber mais sobre o estudio?
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
                  Fale direto no WhatsApp para aula experimental ou acesse o Instagram para conhecer
                  mais do estudio.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#ff5a1f] px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:bg-[#ff7a2c]"
                >
                  Chamar no WhatsApp
                  <ArrowRight size={16} />
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/12 px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:border-white/20 hover:bg-white/5"
                >
                  Abrir Instagram
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between">
          <p className="font-black uppercase tracking-[0.12em] text-zinc-500">
            Lioness Personal Estudio
          </p>
          <p>Atendimento e informacoes diretamente nos canais oficiais.</p>
        </div>
      </footer>
    </div>
  );
}
