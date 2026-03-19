'use client';

import React, { useState } from 'react';
import { Plus, Search, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanList } from '@/components/plans/PlanList';
import { PlanForm } from '@/components/plans/PlanForm';

// Mock initial data based on user requirements
const INITIAL_PLANS = [
  { id: '1', name: 'Plano 2x na Semana', frequency: 2, price: 100, active: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'Plano 3x na Semana', frequency: 3, price: 120, active: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'Plano 5x na Semana', frequency: 5, price: 150, active: true, createdAt: new Date().toISOString() },
];

export default function PlansPage() {
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddPlan = (data: any) => {
    const newPlan = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      active: true,
      createdAt: new Date().toISOString(),
    };
    setPlans([newPlan, ...plans]);
    setIsFormOpen(false);
  };

  const handleEditPlan = (data: any) => {
    setPlans(plans.map(p => p.id === editingPlan.id ? { ...p, ...data } : p));
    setEditingPlan(null);
    setIsFormOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    // Soft delete to not affect existing clients
    setPlans(plans.map(p => p.id === id ? { ...p, active: false } : p));
  };

  const filteredPlans = plans.filter(p => 
    p.active && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.frequency.toString().includes(searchTerm))
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
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
      </AnimatePresence>
    </div>
  );
}
