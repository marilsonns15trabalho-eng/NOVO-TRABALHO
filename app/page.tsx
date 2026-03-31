'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Activity, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNativeApp } from '@/hooks/useNativeApp';
import { openExternalUrl } from '@/lib/external-links';
import { getDefaultRouteForRole } from '@/lib/navigation';

const WHATSAPP_URL =
  'https://wa.me/5571999856956?text=Ola%20gostaria%20de%20saber%20mais%20sobre%20o%20estudio';
const INSTAGRAM_URL =
  'https://www.instagram.com/accounts/login/?next=%2Flionesspersonalestudio%2F&source=omni_redirect';

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
  const isNativeApp = useNativeApp();

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  const handleOpenWhatsApp = async () => {
    await openExternalUrl(WHATSAPP_URL);
  };

  const handleOpenInstagram = async () => {
    await openExternalUrl(INSTAGRAM_URL);
  };

  const handleOpenLogin = () => {
    if (isNativeApp && typeof window !== 'undefined') {
      window.location.assign('/auth');
      return;
    }

    router.push('/auth');
  };

  if (isNativeApp && !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-zinc-800 bg-zinc-950/90 px-6 py-8 shadow-[0_36px_120px_-70px_rgba(0,0,0,0.95)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-orange-500 text-2xl font-black text-black">
            L
          </div>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-300">Lioness</p>
            <p className="mt-2 text-sm text-zinc-400">Preparando o acesso do aplicativo...</p>
          </div>
          <Loader2 className="animate-spin text-orange-500" size={24} />
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <a href="/" className="text-left">
            <p className="text-2xl font-black uppercase tracking-[-0.04em] text-[#ff5a1f]">
              LIONESS
            </p>
          </a>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
            <button
              onClick={handleOpenLogin}
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
              Agendar aula experimental
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
              <button
                type="button"
                onClick={() => void handleOpenWhatsApp()}
                className="inline-flex items-center justify-center rounded-sm bg-[#ff5a1f] px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:bg-[#ff7a2c]"
              >
                Agendar aula experimental
              </button>
              <button
                type="button"
                onClick={() => void handleOpenInstagram()}
                className="inline-flex items-center justify-center rounded-sm border border-white/12 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:border-white/20 hover:bg-white/5"
              >
                Conhecer o estudio
              </button>
              {isNativeApp ? (
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="inline-flex items-center justify-center rounded-sm border border-orange-500/20 bg-orange-500/10 px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-orange-200 transition-all hover:bg-orange-500 hover:text-black sm:hidden"
                >
                  Fazer login
                </button>
              ) : null}
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
                <button
                  type="button"
                  onClick={() => void handleOpenWhatsApp()}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#ff5a1f] px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:bg-[#ff7a2c]"
                >
                  Chamar no WhatsApp
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleOpenInstagram()}
                  className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/12 px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-all hover:border-white/20 hover:bg-white/5"
                >
                  Abrir Instagram
                </button>
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
