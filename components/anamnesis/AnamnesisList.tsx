'use client';

import React from 'react';
import { type Anamnesis } from '@/lib/anamnesis-schema';
import { Search, Plus, MoreVertical, Edit2, Trash2, Eye, FileText, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnamnesisListProps {
  anamnesis: Anamnesis[];
  onAdd: () => void;
  onEdit: (anamnesis: Anamnesis) => void;
  onDelete: (id: string) => void;
  onView: (anamnesis: Anamnesis) => void;
}

export function AnamnesisList({ anamnesis, onAdd, onEdit, onDelete, onView }: AnamnesisListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  const filteredAnamnesis = anamnesis.filter(a => 
    a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.objective.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por aluna ou objetivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 transition-all shadow-lg"
          />
        </div>
        <button
          onClick={onAdd}
          className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus size={20} />
          Nova Anamnese
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAnamnesis.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1a1c23] border border-white/5 rounded-2xl p-5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold group-hover:text-orange-500 transition-colors">{item.studentName}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(item.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  <AnimatePresence>
                    {activeMenu === item.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 bg-[#252833] border border-white/10 rounded-xl shadow-2xl z-30 py-1 overflow-hidden"
                        >
                          <button 
                            onClick={() => { onView(item); setActiveMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Eye size={16} className="text-blue-400" /> Visualizar
                          </button>
                          <button 
                            onClick={() => { onEdit(item); setActiveMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Edit2 size={16} className="text-orange-400" /> Editar
                          </button>
                          <div className="h-px bg-white/5 my-1" />
                          <button 
                            onClick={() => { onDelete(item.id); setActiveMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={16} /> Excluir
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Objetivo</p>
                  <p className="text-white text-sm font-medium line-clamp-1">{item.objective}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Atividade</p>
                    <p className="text-white text-xs capitalize">
                      {item.physicalActivityLevel === 'sedentary' ? 'Sedentário' : 
                       item.physicalActivityLevel === 'light' ? 'Leve' :
                       item.physicalActivityLevel === 'moderate' ? 'Moderado' :
                       item.physicalActivityLevel === 'active' ? 'Ativo' : 'Muito Ativo'}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Sono</p>
                    <p className="text-white text-xs capitalize">
                      {item.sleepQuality === 'poor' ? 'Ruim' : 
                       item.sleepQuality === 'fair' ? 'Regular' :
                       item.sleepQuality === 'good' ? 'Boa' : 'Excelente'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <span>LPE Professional</span>
                <span className="text-orange-500/50">#ANAM-{item.id.slice(0, 4)}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAnamnesis.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-[#1a1c23] border border-dashed border-white/10 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-600" />
            </div>
            <p className="text-lg font-medium">Nenhuma anamnese encontrada</p>
            <p className="text-sm">Comece criando uma nova avaliação profissional.</p>
          </div>
        )}
      </div>
    </div>
  );
}
