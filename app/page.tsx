'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Dumbbell,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';

export default function LandingPage() {
  const { user, role, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-2xl font-bold text-black">
              L
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">LIONESS</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-500">Prime</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-800"
          >
            Login
          </button>
        </div>
      </header>

      <section className="relative px-6 pb-20 pt-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-orange-500/5 blur-[120px]" />
          <div className="absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full bg-orange-600/3 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-500">
              <Zap size={14} />
              Plataforma SaaS para Personal Trainers
            </div>

            <h2 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Gestao completa para{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                personal trainers
              </span>{' '}
              e academias
            </h2>

            <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-zinc-400">
              Controle seus alunos, treinos, financas e avaliacoes em uma unica plataforma profissional.
              Simples, rapido e poderoso.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => router.push('/auth?mode=register')}
                className="group flex items-center gap-3 rounded-2xl bg-orange-500 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600"
              >
                Criar Conta Gratis
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-zinc-800"
              >
                Ja tenho conta
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h3 className="mb-4 text-center text-3xl font-bold">Tudo que voce precisa</h3>
            <p className="mx-auto mb-16 max-w-lg text-center text-zinc-500">
              Uma plataforma completa para gerenciar cada aspecto do seu negocio fitness.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, title: 'Gestao de Alunos', desc: 'Cadastro completo, historico e acompanhamento.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Dumbbell, title: 'Treinos', desc: 'Crie e gerencie programas de treinamento.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { icon: BarChart3, title: 'Financeiro', desc: 'Controle total de receitas, despesas e boletos.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Shield, title: 'Avaliacoes', desc: 'Avaliacao fisica e anamnese completas.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-8 transition-colors hover:border-zinc-700"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} ${feature.color}`}>
                  <feature.icon size={28} />
                </div>
                <h4 className="mb-2 text-xl font-bold transition-colors group-hover:text-orange-500">{feature.title}</h4>
                <p className="text-sm leading-relaxed text-zinc-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center">
        <p className="text-sm text-zinc-600">© {new Date().getFullYear()} Lioness Prime. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
