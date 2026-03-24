'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/modules/dashboard/Dashboard';
import AlunosModule from '@/modules/alunos/AlunosModule';
import FinanceiroModule from '@/modules/financeiro/FinanceiroModule';
import PlanosModule from '@/modules/planos/PlanosModule';
import TreinosModule from '@/modules/treinos/TreinosModule';
import AvaliacaoModule from '@/modules/avaliacao/AvaliacaoModule';
import AnamneseModule from '@/modules/anamnese/AnamneseModule';
import RelatoriosModule from '@/modules/relatorios/RelatoriosModule';
import ConfiguracoesModule from '@/modules/configuracoes/ConfiguracoesModule';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="text-orange-500 animate-spin" size={48} />
      </div>
    );
  }

  if (!user) return null;

  const getTitle = () => {
    switch (activeTab) {
      case 'home': return 'Painel de Controle';
      case 'alunos': return 'Gestão de Alunos';
      case 'financeiro': return 'Gestão Financeira';
      case 'planos': return 'Gestão de Planos';
      case 'treinos': return 'Gestão de Treinos';
      case 'anamnese': return 'Anamnese Nutricional';
      case 'avaliacao': return 'Avaliação Física';
      case 'relatorios': return 'Relatórios e Estatísticas';
      case 'configuracoes': return 'Configurações do Sistema';
      default: return 'Painel de Controle';
    }
  };

  const role = profile?.role || 'aluno';

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-black">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={role} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={getTitle()} />
        
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              {activeTab === 'home' && <Dashboard setActiveTab={setActiveTab} />}
              {activeTab === 'alunos' && <AlunosModule />}
              {activeTab === 'financeiro' && <FinanceiroModule />}
              {activeTab === 'planos' && <PlanosModule />}
              {activeTab === 'treinos' && <TreinosModule />}
              {activeTab === 'avaliacao' && <AvaliacaoModule />}
              {activeTab === 'anamnese' && <AnamneseModule />}
              {activeTab === 'relatorios' && <RelatoriosModule />}
              {activeTab === 'configuracoes' && <ConfiguracoesModule />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
