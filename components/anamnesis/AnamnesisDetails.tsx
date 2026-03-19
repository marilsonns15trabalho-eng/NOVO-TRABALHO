'use client';

import React from 'react';
import { type Anamnesis } from '@/lib/anamnesis-schema';
import { X, FileText, Calendar, User, Activity, Heart, Zap, Moon, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnamnesisDetailsProps {
  anamnesis: Anamnesis;
  onClose: () => void;
}

export function AnamnesisDetails({ anamnesis, onClose }: AnamnesisDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#1a1c23] border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <FileText size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{anamnesis.studentName}</h2>
              <p className="text-gray-400 flex items-center gap-2 text-sm">
                <Calendar size={14} />
                Realizada em {format(new Date(anamnesis.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Section: Objetivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <Activity size={16} /> Objetivo Principal
              </h3>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                <p className="text-white text-lg font-medium leading-relaxed">{anamnesis.objective}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <Zap size={16} /> Nível de Atividade
              </h3>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-white font-bold text-xl capitalize">
                  {anamnesis.physicalActivityLevel === 'sedentary' ? 'Sedentário' : 
                   anamnesis.physicalActivityLevel === 'light' ? 'Leve' :
                   anamnesis.physicalActivityLevel === 'moderate' ? 'Moderado' :
                   anamnesis.physicalActivityLevel === 'active' ? 'Ativo' : 'Muito Ativo'}
                </span>
                <p className="text-gray-500 text-xs mt-2">Frequência Semanal</p>
              </div>
            </div>
          </div>

          {/* Section: Histórico Médico */}
          <div className="space-y-6">
            <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Heart size={16} /> Histórico de Saúde e Clínico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Histórico Médico</p>
                <p className="text-white leading-relaxed">{anamnesis.medicalHistory || 'Nenhum registro informado.'}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Medicamentos</p>
                <p className="text-white leading-relaxed">{anamnesis.medications || 'Nenhum registro informado.'}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-2">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Cirurgias</p>
                <p className="text-white leading-relaxed">{anamnesis.surgeries || 'Nenhum registro informado.'}</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-2 border-l-4 border-l-red-500/50">
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={12} /> Lesões / Dores
                </p>
                <p className="text-white leading-relaxed">{anamnesis.injuries || 'Nenhum registro informado.'}</p>
              </div>
            </div>
          </div>

          {/* Section: Estilo de Vida */}
          <div className="space-y-6">
            <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <Moon size={16} /> Estilo de Vida e Recuperação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                <p className="text-gray-400 text-sm">Qualidade do Sono</p>
                <span className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {anamnesis.sleepQuality === 'poor' ? 'Ruim' : 
                   anamnesis.sleepQuality === 'fair' ? 'Regular' :
                   anamnesis.sleepQuality === 'good' ? 'Boa' : 'Excelente'}
                </span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                <p className="text-gray-400 text-sm">Nível de Estresse</p>
                <span className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {anamnesis.stressLevel === 'low' ? 'Baixo' : 
                   anamnesis.stressLevel === 'moderate' ? 'Moderado' : 'Alto'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Observações */}
          <div className="space-y-4">
            <h3 className="text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <MessageSquare size={16} /> Observações Adicionais
            </h3>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
              <p className="text-white leading-relaxed whitespace-pre-wrap">
                {anamnesis.observations || 'Sem observações adicionais.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex justify-end bg-white/2">
          <button
            onClick={onClose}
            className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-2xl font-bold transition-all active:scale-95"
          >
            Fechar Visualização
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
