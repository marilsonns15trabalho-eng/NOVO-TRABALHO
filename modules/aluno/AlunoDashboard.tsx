'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Activity, Dumbbell, ClipboardList, Loader2 } from 'lucide-react';

export default function AlunoDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<{ plan_name?: string; plan_price?: number } | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const navItems = useMemo(
    () => [
      { id: 'avaliacao', label: 'Minha Avaliação', icon: Activity },
      { id: 'treinos', label: 'Meu Treino', icon: Dumbbell },
    ],
    []
  );

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        setLoadingPlan(true);

        const { data: studentRow } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!studentRow?.id) {
          setPlan(null);
          return;
        }

        const { data } = await supabase
          .from('assinaturas')
          .select('plan_name, plan_price')
          .eq('student_id', studentRow.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const first = (data || [])[0] as any;
        setPlan(first ? { plan_name: first.plan_name, plan_price: Number(first.plan_price) } : null);
      } catch {
        setPlan(null);
      } finally {
        setLoadingPlan(false);
      }
    };

    void run();
  }, [user]);

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
            <h2 className="text-3xl font-bold tracking-tight">Área do Aluno</h2>
            <p className="text-zinc-500">Seus dados, seu treino e suas avaliações.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-orange-500/50 transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Acesso</p>
                    <h3 className="text-xl font-bold group-hover:text-orange-400 transition-colors">{item.label}</h3>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-2xl group-hover:bg-orange-500 transition-colors">
                    <Icon size={24} className="text-orange-500 group-hover:text-black transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Meu Plano</p>
                <h3 className="text-xl font-bold">{loadingPlan ? 'Carregando...' : plan?.plan_name || 'Sem plano ativo'}</h3>
                <p className="text-zinc-500 mt-2 text-sm">
                  {loadingPlan ? 'Buscando assinatura...' : plan?.plan_price ? `R$ ${plan.plan_price.toFixed(2)} / mês` : ''}
                </p>
              </div>
              <div className="p-3 bg-zinc-800 rounded-2xl">
                <ClipboardList size={24} className="text-orange-500" />
              </div>
            </div>
            {loadingPlan && (
              <div className="mt-4 flex items-center gap-2 text-zinc-500 text-sm">
                <Loader2 className="animate-spin" size={16} /> Aguarde
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

