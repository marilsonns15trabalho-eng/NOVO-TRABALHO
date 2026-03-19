'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, CreditCard, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const planSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  frequency: z.number().min(1, 'A frequência deve ser pelo menos 1x na semana').max(7, 'A frequência máxima é 7x na semana'),
  price: z.number().min(1, 'O preço deve ser maior que zero'),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  plan?: any;
  onSubmit: (data: PlanFormValues) => void;
  onClose: () => void;
}

export function PlanForm({ plan, onSubmit, onClose }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: plan ? {
      name: plan.name,
      frequency: plan.frequency,
      price: plan.price,
    } : {
      name: '',
      frequency: 2,
      price: 100,
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1d25] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl">
              <CreditCard className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{plan ? 'Editar Plano' : 'Novo Plano'}</h2>
              <p className="text-xs text-gray-400">Preencha as informações do plano.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Nome do Plano */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Nome do Plano</label>
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input
                  {...register('name')}
                  placeholder="Ex: Plano 2x na Semana"
                  className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1 ml-1">
                  <AlertCircle size={12} /> {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequência */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Frequência (x/semana)</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input
                    type="number"
                    {...register('frequency', { valueAsNumber: true })}
                    placeholder="Ex: 2"
                    className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                </div>
                {errors.frequency && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1 ml-1">
                    <AlertCircle size={12} /> {errors.frequency.message}
                  </p>
                )}
              </div>

              {/* Preço */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Preço (R$)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                    placeholder="Ex: 100.00"
                    className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1 ml-1">
                    <AlertCircle size={12} /> {errors.price.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-orange-500 shrink-0" size={20} />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-orange-500">Nota:</strong> Alterar ou excluir um plano não afetará as matrículas existentes. Novos alunos usarão as configurações atualizadas.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl bg-white/5 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {plan ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
