'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Edit2, Trash2, Calendar, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  frequency: number;
  price: number;
  active: boolean;
  createdAt: string;
}

interface PlanListProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function PlanList({ plans, onEdit, onDelete }: PlanListProps) {
  if (plans.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-[#1a1d25] rounded-3xl border border-dashed border-white/10"
      >
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
          <CreditCard className="text-gray-600" size={40} />
        </div>
        <div className="max-w-xs">
          <h3 className="text-xl font-bold text-white">Nenhum plano encontrado</h3>
          <p className="text-gray-400 text-sm mt-2">Tente ajustar sua busca ou adicione um novo plano para começar.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan, index) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative bg-[#1a1d25] border border-white/5 rounded-3xl p-6 hover:border-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 overflow-hidden"
        >
          {/* Background Accent */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-orange-500/10 rounded-2xl">
              <CreditCard className="text-orange-500" size={24} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(plan)}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                title="Editar plano"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => onDelete(plan.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                title="Excluir plano"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={16} className="text-orange-500/70" />
                <span className="text-sm font-medium">{plan.frequency}x por semana</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <DollarSign size={16} className="text-orange-500/70" />
                <span className="text-sm font-bold text-white">R$ {plan.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="w-full bg-orange-500/10 text-orange-500 py-2 rounded-xl text-center text-sm font-semibold group-hover:bg-orange-500 group-hover:text-white transition-all cursor-default">
                Plano Ativo
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
