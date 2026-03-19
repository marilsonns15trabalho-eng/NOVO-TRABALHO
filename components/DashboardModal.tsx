'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, AlertCircle, DollarSign, Calendar, User } from 'lucide-react';
import { motion } from 'motion/react';

const dashboardItemSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  date: z.string().min(1, 'A data é obrigatória'),
  amount: z.string().optional(),
  status: z.enum(['atrasado', 'pendente', 'concluido']).optional(),
  type: z.enum(['reminder', 'expiration', 'signup']),
});

type DashboardItemValues = z.infer<typeof dashboardItemSchema>;

interface DashboardModalProps {
  item?: any;
  type: 'reminder' | 'expiration' | 'signup';
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function DashboardModal({ item, type, onSubmit, onClose }: DashboardModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DashboardItemValues>({
    resolver: zodResolver(dashboardItemSchema),
    defaultValues: item ? {
      name: item.name,
      date: item.date.replace('Vence ', '').replace('Expira: ', '').replace('Entrou: ', ''),
      amount: item.amount?.replace('R$ ', ''),
      status: item.status || 'pendente',
      type: type,
    } : {
      name: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'pendente',
      type: type,
    },
  });

  const getTitle = () => {
    const action = item ? 'Editar' : 'Novo';
    if (type === 'reminder') return `${action} Lembrete de Pagamento`;
    if (type === 'expiration') return `${action} Alerta de Vencimento`;
    return `${action} Registro de Novo Aluno`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#1a1d25] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl text-white">
              {type === 'reminder' ? <DollarSign size={20} /> : type === 'expiration' ? <Calendar size={20} /> : <User size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
              <p className="text-xs text-gray-400">Preencha os detalhes abaixo.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome do Aluno</label>
              <input
                {...register('name')}
                className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all"
                placeholder="Nome completo"
              />
              {errors.name && <p className="text-red-500 text-[10px] ml-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Data</label>
                <input
                  {...register('date')}
                  type="text"
                  placeholder="Ex: 25 Mai, 2024"
                  className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all"
                />
                {errors.date && <p className="text-red-500 text-[10px] ml-1">{errors.date.message}</p>}
              </div>

              {type === 'reminder' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input
                    {...register('amount')}
                    placeholder="0,00"
                    className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {type === 'reminder' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full bg-[#0f1117] border border-white/5 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none"
                >
                  <option value="pendente">Pendente</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>
            )}
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
              {item ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
