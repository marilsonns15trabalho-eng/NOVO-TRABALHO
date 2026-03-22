'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Crown,
  Dumbbell,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from './Toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  subscription_tier: string;
  is_active: boolean;
  created_at: string;
  goal?: string;
  fitness_level?: string;
  level?: string;
  training_days?: number;
}

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const generateUserWorkout = async (targetUser: UserProfile) => {
    if (generatingFor) return;
    setGeneratingFor(targetUser.id);
    showToast(`Gerando treino para ${targetUser.full_name?.split(' ')[0]}...`, 'loading');

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key ausente');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Gere um treino de musculação profissional FEMININO com 6 exercícios.
          Objetivo: ${targetUser.goal || 'Saúde'}.
          Nível: ${targetUser.fitness_level || targetUser.level || 'Iniciante'}.
          Frequência: ${targetUser.training_days || 3} dias.
          Retorne apenas um array JSON de objetos.
          Cada objeto: { "name": string, "reps": string, "sets": number, "difficulty": string, "category": string }.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const newExercises = JSON.parse(text).map((ex: any) => ({
        ...ex,
        user_id: targetUser.id
      }));

      // Limpar treinos antigos e salvar novo
      await supabase.from('exercises').delete().eq('user_id', targetUser.id);
      const { error: insertError } = await supabase.from('exercises').insert(newExercises);

      if (insertError) throw insertError;

      showToast('Treino gerado e atribuído com sucesso!', 'success');
    } catch (error) {
      console.error('Admin generate error:', error);
      showToast('Erro ao gerar treino para o usuário.', 'error');
    } finally {
      setGeneratingFor(null);
    }
  };

  const updateUserTier = async (userId: string, tier: string) => {
    const { error } = await supabase
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: tier } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, subscription_tier: tier });
      }
      showToast('Plano atualizado', 'success');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#fcf9f8] p-6 pb-32">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-stone-900 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Painel Admin</h1>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Gestão de Performance</p>
          </div>
        </div>
        <div className="bg-[#ff5f1f]/10 text-[#ff5f1f] px-4 py-2 rounded-xl border border-[#ff5f1f]/20 flex items-center gap-2">
          <Shield size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Acesso Master</span>
        </div>
      </header>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
          <input 
            type="text"
            placeholder="Buscar atleta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-900/50 border border-stone-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#ff5f1f] transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-stone-600">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Atletas...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-stone-600 font-bold uppercase text-xs">Nenhum atleta encontrado.</div>
        ) : (
          filteredUsers.map((u) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-stone-900/40 border border-stone-800/50 rounded-2xl p-5 hover:border-[#ff5f1f]/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center font-black text-stone-500">
                    {u.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase text-sm tracking-tight">{u.full_name || 'Atleta sem nome'}</h3>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateUserWorkout(u)}
                    disabled={generatingFor === u.id}
                    className="flex items-center gap-2 bg-[#ff5f1f]/10 text-[#ff5f1f] px-4 py-2 rounded-xl border border-[#ff5f1f]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff5f1f] hover:text-white transition-all disabled:opacity-50"
                  >
                    {generatingFor === u.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Gerar Treino
                  </button>
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="p-2 text-stone-600 hover:text-white transition-colors"
                  >
                    <Crown size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black uppercase tracking-tighter mb-2">{selectedUser.full_name}</h2>
              <p className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Gerenciar Plano</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {['free', 'pro', 'gym_member'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => updateUserTier(selectedUser.id, tier)}
                    className={cn(
                      "py-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all",
                      selectedUser.subscription_tier === tier
                        ? "bg-[#ff5f1f] text-white border-[#ff5f1f]"
                        : "bg-stone-800 border-stone-700 text-stone-500"
                    )}
                  >
                    {tier === 'gym_member' ? 'Academia' : tier}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-4 bg-stone-800 hover:bg-stone-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
