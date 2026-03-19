'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { RevenueChart } from '@/components/RevenueChart';
import { DashboardModal } from '@/components/DashboardModal';
import { STATS, PAYMENT_REMINDERS, UPCOMING_EXPIRATIONS, RECENT_SIGNUPS } from '@/lib/constants';
import { ChevronRight, AlertCircle, CheckCircle2, Clock, Plus, Edit2, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function Dashboard() {
  const [reminders, setReminders] = useState(PAYMENT_REMINDERS);
  const [expirations, setExpirations] = useState(UPCOMING_EXPIRATIONS);
  const [signups, setSignups] = useState(RECENT_SIGNUPS);
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'reminder' | 'expiration' | 'signup';
    item: any | null;
  }>({
    isOpen: false,
    type: 'reminder',
    item: null,
  });

  const handleOpenModal = (type: 'reminder' | 'expiration' | 'signup', item: any = null) => {
    setModalConfig({ isOpen: true, type, item });
  };

  const handleCloseModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleSave = (data: any) => {
    const { type, ...itemData } = data;
    const isEditing = !!modalConfig.item;
    
    if (type === 'reminder') {
      const formattedData = {
        ...itemData,
        amount: itemData.amount.startsWith('R$') ? itemData.amount : `R$ ${itemData.amount}`,
        date: itemData.date.startsWith('Vence') ? itemData.date : `Vence ${itemData.date}`,
      };
      if (isEditing) {
        setReminders(reminders.map(r => r.name === modalConfig.item.name ? formattedData : r));
      } else {
        setReminders([formattedData, ...reminders]);
      }
    } else if (type === 'expiration') {
      const formattedData = {
        ...itemData,
        date: itemData.date.startsWith('Expira') ? itemData.date : `Expira: ${itemData.date}`,
      };
      if (isEditing) {
        setExpirations(expirations.map(e => e.name === modalConfig.item.name ? formattedData : e));
      } else {
        setExpirations([formattedData, ...expirations]);
      }
    } else if (type === 'signup') {
      const formattedData = {
        ...itemData,
        date: itemData.date.startsWith('Entrou') ? itemData.date : `Entrou: ${itemData.date}`,
      };
      if (isEditing) {
        setSignups(signups.map(s => s.name === modalConfig.item.name ? formattedData : s));
      } else {
        setSignups([formattedData, ...signups]);
      }
    }
    handleCloseModal();
  };

  const handleDelete = (type: 'reminder' | 'expiration' | 'signup', name: string) => {
    if (confirm(`Deseja realmente excluir o registro de ${name}?`)) {
      if (type === 'reminder') setReminders(reminders.filter(r => r.name !== name));
      if (type === 'expiration') setExpirations(expirations.filter(e => e.name !== name));
      if (type === 'signup') setSignups(signups.filter(s => s.name !== name));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {STATS.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>

            {/* Payment Reminders */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Lembretes de Pagamento</h3>
                <button 
                  onClick={() => handleOpenModal('reminder')}
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {reminders.map((payment, idx) => (
                    <motion.div
                      key={payment.name}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={payment.status === 'atrasado' ? 'text-red-500' : 'text-orange-500'}>
                          {payment.status === 'atrasado' ? <AlertCircle size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{payment.name}</p>
                          <p className="text-xs text-gray-500">{payment.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right group-hover:opacity-0 transition-opacity">
                          <p className="text-sm font-bold text-white">{payment.amount}</p>
                          <p className={cn(
                            "text-[10px] uppercase font-bold tracking-wider",
                            payment.status === 'atrasado' ? 'text-red-500' : 'text-orange-500'
                          )}>
                            {payment.status}
                          </p>
                        </div>
                        
                        {/* Action Buttons on Hover */}
                        <div className="absolute right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleOpenModal('reminder', payment)}
                            className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete('reminder', payment.name)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upcoming Expirations */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Vencimentos Próximos</h3>
                <button 
                  onClick={() => handleOpenModal('expiration')}
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {expirations.map((item) => (
                    <motion.div 
                      key={item.name}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                          <User size={16} />
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 group-hover:opacity-0 transition-opacity">{item.date}</span>
                        <div className="absolute right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleOpenModal('expiration', item)} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete('expiration', item.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Novos Alunos</h3>
                <button 
                  onClick={() => handleOpenModal('signup')}
                  className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {signups.map((item) => (
                    <motion.div 
                      key={item.name}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 group-hover:opacity-0 transition-opacity">{item.date}</span>
                        <div className="absolute right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleOpenModal('signup', item)} className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete('signup', item.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <DashboardModal
            type={modalConfig.type}
            item={modalConfig.item}
            onClose={handleCloseModal}
            onSubmit={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
