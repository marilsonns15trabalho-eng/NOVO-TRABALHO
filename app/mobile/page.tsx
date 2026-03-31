'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Activity, ArrowRight, Dumbbell, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { openExternalUrl } from '@/lib/external-links';
import { getDefaultRouteForRole } from '@/lib/navigation';

const WHATSAPP_URL =
  'https://wa.me/5571999856956?text=Ola%20gostaria%20de%20saber%20mais%20sobre%20o%20estudio';

const MOBILE_CARDS = [
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
] as const;

export default function MobileLandingPage() {
  const { user, role, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  return (
    <div className="min-h-screen overflow-hidden bg-black px-4 py-6 text-white md:px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[280px] w-[280px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl flex-col justify-between rounded-[34px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(135deg,rgba(20,20,24,0.96),rgba(8,8,8,0.98))] p-6 shadow-[0_36px_120px_-64px_rgba(249,115,22,0.45)] md:p-8"
      >
        <div>
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-orange-500 text-3xl font-black text-black">
            L
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              Acesso mobile
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-white">LIONESS</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Login direto para administracao, professor e aluno no mesmo ambiente do estudio.
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {MOBILE_CARDS.map((item) => (
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
            Entrar
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => void openExternalUrl(WHATSAPP_URL)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-6 py-4 text-sm font-bold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-900"
          >
            Falar no WhatsApp
          </button>
        </div>
      </motion.div>
    </div>
  );
}
