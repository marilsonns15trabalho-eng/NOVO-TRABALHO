'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Shield, 
  Dumbbell, 
  BarChart3, 
  Users, 
  Zap,
  ChevronRight 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Se já logado, redirecionar para dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-black font-bold text-2xl">
              🦁
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">LIONESS</h1>
              <p className="text-orange-500 text-[10px] font-semibold tracking-[0.3em] uppercase">Prime</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-xl transition-all text-sm"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-orange-600/3 rounded-full blur-[80px]" />
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              <Zap size={14} />
              Plataforma SaaS para Personal Trainers
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
              Gestão completa para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                personal trainers
              </span>{' '}
              e academias
            </h2>
            
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Controle seus alunos, treinos, finanças e avaliações em uma única
              plataforma profissional. Simples, rápido e poderoso.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/auth?mode=register')}
                className="group flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-black font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 text-lg"
              >
                Criar Conta Grátis
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold px-8 py-4 rounded-2xl transition-all text-lg"
              >
                Já tenho conta
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-center mb-4">Tudo que você precisa</h3>
            <p className="text-zinc-500 text-center mb-16 max-w-lg mx-auto">
              Uma plataforma completa para gerenciar cada aspecto do seu negócio fitness.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Gestão de Alunos', desc: 'Cadastro completo, histórico e acompanhamento.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Dumbbell, title: 'Treinos', desc: 'Crie e gerencie programas de treinamento.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { icon: BarChart3, title: 'Financeiro', desc: 'Controle total de receitas, despesas e boletos.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Shield, title: 'Avaliações', desc: 'Avaliação física e anamnese completas.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-zinc-700 transition-colors group"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center ${feature.color} mb-6`}>
                  <feature.icon size={28} />
                </div>
                <h4 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">{feature.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6 text-center">
        <p className="text-zinc-600 text-sm">
          © {new Date().getFullYear()} Lioness Prime. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
