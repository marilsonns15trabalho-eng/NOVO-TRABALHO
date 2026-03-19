'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { anamnesisSchema, type AnamnesisData } from '@/lib/anamnesis-schema';
import { X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnamnesisFormProps {
  onClose: () => void;
  onSubmit: (data: AnamnesisData) => void;
  initialData?: Partial<AnamnesisData>;
  students: { id: string; name: string }[];
}

export function AnamnesisForm({ onClose, onSubmit, initialData, students }: AnamnesisFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnamnesisData>({
    resolver: zodResolver(anamnesisSchema),
    defaultValues: {
      physicalActivityLevel: 'sedentary',
      sleepQuality: 'good',
      stressLevel: 'moderate',
      ...initialData,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl my-8"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1a1c23] rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Anamnese Profissional</h2>
            <p className="text-gray-400 text-sm">Preencha o histórico de saúde e objetivos da aluna</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Section: Identificação */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              Identificação e Objetivo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Aluna</label>
                <select
                  {...register('studentId')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="" className="bg-[#1a1c23]">Selecione uma aluna</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id} className="bg-[#1a1c23]">
                      {student.name}
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.studentId.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Objetivo Principal</label>
                <input
                  {...register('objective')}
                  placeholder="Ex: Emagrecimento, Hipertrofia..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
                {errors.objective && (
                  <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> {errors.objective.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Histórico de Saúde */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              Histórico de Saúde
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Histórico Médico</label>
                <textarea
                  {...register('medicalHistory')}
                  rows={3}
                  placeholder="Doenças pré-existentes, histórico familiar..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Medicamentos</label>
                <textarea
                  {...register('medications')}
                  rows={3}
                  placeholder="Uso contínuo ou esporádico..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cirurgias</label>
                <textarea
                  {...register('surgeries')}
                  rows={3}
                  placeholder="Procedimentos realizados e datas..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Lesões / Dores</label>
                <textarea
                  {...register('injuries')}
                  rows={3}
                  placeholder="Dores articulares, lesões antigas..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Estilo de Vida */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              Estilo de Vida
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nível de Atividade</label>
                <select
                  {...register('physicalActivityLevel')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="sedentary" className="bg-[#1a1c23]">Sedentário</option>
                  <option value="light" className="bg-[#1a1c23]">Leve</option>
                  <option value="moderate" className="bg-[#1a1c23]">Moderado</option>
                  <option value="active" className="bg-[#1a1c23]">Ativo</option>
                  <option value="very_active" className="bg-[#1a1c23]">Muito Ativo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Qualidade do Sono</label>
                <select
                  {...register('sleepQuality')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="poor" className="bg-[#1a1c23]">Ruim</option>
                  <option value="fair" className="bg-[#1a1c23]">Regular</option>
                  <option value="good" className="bg-[#1a1c23]">Boa</option>
                  <option value="excellent" className="bg-[#1a1c23]">Excelente</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nível de Estresse</label>
                <select
                  {...register('stressLevel')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="low" className="bg-[#1a1c23]">Baixo</option>
                  <option value="moderate" className="bg-[#1a1c23]">Moderado</option>
                  <option value="high" className="bg-[#1a1c23]">Alto</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Observações Gerais</label>
              <textarea
                {...register('observations')}
                rows={4}
                placeholder="Qualquer outra informação relevante..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                Salvar Anamnese
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
