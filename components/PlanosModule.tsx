'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ClipboardList, 
  Plus, 
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Plano {
  id: string;
  name: string;
  price: number;
  frequency: number;
  description: string;
  active: boolean;
  created_at: string;
}

export default function PlanosModule() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlano, setNewPlano] = useState({
    name: '',
    price: '',
    frequency: '',
    description: '',
    active: true
  });

  useEffect(() => {
    const fetchPlanos = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', JSON.stringify(error, null, 2));
      } else {
        setPlanos(data || []);
      }
      setLoading(false);
    };

    fetchPlanos();
  }, []);

  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const handleEdit = (plano: Plano) => {
    setEditingPlano(plano);
    setNewPlano({
      name: plano.name,
      price: plano.price.toString(),
      frequency: plano.frequency.toString(),
      description: plano.description,
      active: plano.active
    });
    setShowAddModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPlano) {
        const { error } = await supabase
          .from('plans')
          .update({
            name: newPlano.name,
            price: parseFloat(newPlano.price),
            frequency: parseInt(newPlano.frequency, 10),
            description: newPlano.description,
            active: newPlano.active
          })
          .eq('id', editingPlano.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([{
            ...newPlano,
            price: parseFloat(newPlano.price),
            frequency: parseInt(newPlano.frequency, 10),
          }]);
        if (error) throw error;
      }
      
      setShowAddModal(false);
      setEditingPlano(null);
      setNewPlano({ name: '', price: '', frequency: '', description: '', active: true });
      
      const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
      setPlanos(data || []);
    } catch (error) {
      console.error('Erro ao salvar plano:', JSON.stringify(error, null, 2));
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const plano = planos.find(p => p.id === deleteConfirmation);
    if (!plano) return;

    try {
      if (plano.active) {
        // Se está ativo, desativa
        const { error } = await supabase
          .from('plans')
          .update({ active: false })
          .eq('id', deleteConfirmation);
        if (error) throw error;
      } else {
        // Se já está desativado, exclui
        const { error } = await supabase
          .from('plans')
          .delete()
          .eq('id', deleteConfirmation);
        if (error) throw error;
      }
      
      const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
      setPlanos(data || []);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Erro ao processar exclusão/desativação do plano:', JSON.stringify(error, null, 2));
    }
  };

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Planos</h2>
          <p className="text-zinc-500">Crie e gerencie os pacotes de treinamento oferecidos.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="text-indigo-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-medium">Carregando planos...</p>
          </div>
        ) : planos.length > 0 ? (
          planos.map((plano) => (
            <div key={plano.id} className={`bg-zinc-900 border ${plano.active ? 'border-zinc-800 hover:border-indigo-500/50' : 'border-red-900/50 opacity-75'} rounded-3xl p-8 flex flex-col transition-colors group relative overflow-hidden`}>
              {!plano.active && (
                <div className="absolute top-4 right-4 bg-red-500/10 text-red-500 text-xs font-bold px-2 py-1 rounded-md">
                  Inativo
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors pr-16">{plano.name}</h3>
                <p className="text-zinc-500 text-sm mb-6 line-clamp-3">{plano.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold tracking-tight">R$ {plano.price.toFixed(2)}</span>
                  <span className="text-zinc-500">/ {plano.frequency} dias</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(plano)} className="flex-1 py-3 bg-zinc-800 hover:bg-indigo-500 hover:text-white rounded-xl text-sm font-bold transition-all">
                  Editar
                </button>
                <button onClick={() => handleDelete(plano.id)} className="px-4 py-3 bg-zinc-800 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-all">
                  Excluir
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full p-20 text-center space-y-4 bg-zinc-900 border border-zinc-800 rounded-3xl">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <ClipboardList className="text-zinc-600" size={32} />
            </div>
            <h3 className="text-xl font-bold">Nenhum plano cadastrado</h3>
            <p className="text-zinc-500">Crie seu primeiro pacote de serviços.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Novo Plano</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Plano</label>
                  <input required type="text" value={newPlano.name} onChange={(e) => setNewPlano({...newPlano, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" placeholder="Ex: Trimestral Premium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor Total (R$)</label>
                    <input required type="number" step="0.01" value={newPlano.price} onChange={(e) => setNewPlano({...newPlano, price: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Duração (Dias)</label>
                    <input required type="number" min="1" value={newPlano.frequency} onChange={(e) => setNewPlano({...newPlano, frequency: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descrição</label>
                  <textarea rows={3} value={newPlano.description} onChange={(e) => setNewPlano({...newPlano, description: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none" placeholder="Detalhes do que está incluso..." />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="ativo" 
                    checked={newPlano.active} 
                    onChange={(e) => setNewPlano({...newPlano, active: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-800 bg-black text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <label htmlFor="ativo" className="text-sm font-medium text-zinc-300 cursor-pointer">Plano Ativo</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20">Salvar Plano</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Confirmar Exclusão</h3>
              <p className="text-zinc-400 mb-6">Tem certeza que deseja excluir este plano? Se ele estiver ativo, será desativado. Se já estiver desativado, será excluído permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
