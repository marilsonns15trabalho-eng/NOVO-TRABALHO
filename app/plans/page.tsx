'use client';

import React, { useState } from 'react';
import { Plus, Search, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanList } from '@/components/plans/PlanList';
import { PlanForm } from '@/components/plans/PlanForm';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// Mock initial data based on user requirements
const INITIAL_PLANS = [
  { id: '1', name: 'Plano 2x na Semana', frequency: 2, price: 100, active: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'Plano 3x na Semana', frequency: 3, price: 120, active: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'Plano 5x na Semana', frequency: 5, price: 150, active: true, createdAt: new Date().toISOString() },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  React.useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlan = async (data: any) => {
    try {
      const { error } = await supabase
        .from('plans')
        .insert([data]);

      if (error) throw error;
      
      toast.success('Plano criado com sucesso');
      fetchPlans();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano');
    }
  };

  const handleEditPlan = async (data: any) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update(data)
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast.success('Plano atualizado com sucesso');
      fetchPlans();
      setEditingPlan(null);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const handleDeletePlan = (id: string) => {
    setPlanToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      try {
        // Soft delete
        const { error } = await supabase
          .from('plans')
          .update({ active: false })
          .eq('id', planToDelete);

        if (error) throw error;

        toast.success('Plano excluído com sucesso');
        fetchPlans();
      } catch (error) {
        console.error('Erro ao excluir plano:', error);
        toast.error('Erro ao excluir plano');
      }
    }
    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  const filteredPlans = plans.filter(p => 
    p.active && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.frequency.toString().includes(searchTerm))
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Planos</h1>
              <p className="text-gray-400 mt-1">Configure as opções de mensalidades do estúdio.</p>
            </div>
            <button
              onClick={() => {
                setEditingPlan(null);
                setIsFormOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={20} />
              Novo Plano
            </button>
          </header>

          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar plano por nome ou frequência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1d25] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
            />
          </div>

          <PlanList 
            plans={filteredPlans} 
            onEdit={(plan) => {
              setEditingPlan(plan);
              setIsFormOpen(true);
            }}
            onDelete={handleDeletePlan}
          />
        </div>
      </main>

      <AnimatePresence>
        {isFormOpen && (
          <PlanForm
            plan={editingPlan}
            onSubmit={editingPlan ? handleEditPlan : handleAddPlan}
            onClose={() => {
              setIsFormOpen(false);
              setEditingPlan(null);
            }}
          />
        )}
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Excluir Plano"
          message="Tem certeza que deseja excluir este plano? Clientes atuais não serão afetados, mas o plano não estará mais disponível para novas matrículas."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      </AnimatePresence>
    </div>
  );
}
