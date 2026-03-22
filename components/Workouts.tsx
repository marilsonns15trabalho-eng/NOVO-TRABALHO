'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Bell, Zap, Play, CheckCircle2, Loader2, History, Calendar, Clock, Sparkles, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Exercise {
  id: number;
  name: string;
  reps: string;
  sets: number;
  difficulty: string;
  category: string;
  image_url?: string;
  completed?: boolean;
}

interface WorkoutHistory {
  id: number;
  created_at: string;
  duration_minutes: number;
}

export default function Workouts({ user }: { user: any }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [generating, setGenerating] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [priorityMuscles, setPriorityMuscles] = useState('');
  const [avoidExercises, setAvoidExercises] = useState('');
  const [injuries, setInjuries] = useState('');
  const [equipment, setEquipment] = useState('');
  const { showToast } = useToast();

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Workouts Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('History Error:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExercises();
    fetchHistory();
  }, [fetchExercises, fetchHistory]);

  const handleComplete = async (exerciseId: number) => {
    setCompleting(exerciseId);
    try {
      const { error } = await supabase
        .from('user_workouts')
        .insert({ user_id: user.id, exercise_id: exerciseId });
      
      if (error) throw error;
      
      setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, completed: true } : ex));
      showToast('Exercício concluído!', 'success');
    } catch (error) {
      showToast('Erro ao salvar progresso', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const handleCompleteWorkout = async () => {
    if (exercises.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .insert({ user_id: user.id, duration_minutes: 45 });
      
      if (error) throw error;

      setExercises(prev => prev.map(ex => ({ ...ex, completed: false })));
      fetchHistory();
      setActiveTab('history');
      showToast('Treino finalizado!', 'success');
    } catch (error) {
      showToast('Erro ao finalizar treino', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateAIWorkout = async () => {
    setGenerating(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Gere um treino de musculação feminino com 6 exercícios.
          Objetivo: ${profile?.goal || 'Hipertrofia'}. Nível: ${profile?.fitness_level || 'Iniciante'}.
          Prioridade: ${priorityMuscles}. Evitar: ${avoidExercises}. Lesões: ${injuries}. Equipamentos: ${equipment}.
          Retorne apenas um JSON array de objetos: name, reps, sets, difficulty, category. Sem markdown.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      const newExercises = JSON.parse(text).map((ex: any) => ({ ...ex, user_id: user.id }));
      
      const { error: delError } = await supabase.from('exercises').delete().eq('user_id', user.id);
      if (delError) throw delError;

      const { data: inserted, error: insError } = await supabase.from('exercises').insert(newExercises).select();
      if (insError) throw insError;

      setExercises(inserted || []);
      showToast('Treino atualizado com IA!', 'success');
    } catch (error) {
      showToast('Erro ao gerar treino', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-[#0c0a09] text-[#fcf9f8] min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-stone-950/70 backdrop-blur-xl flex justify-between items-center px-6 py-4 border-b border-stone-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-800 border-2 border-[#ab3600]/20 relative">
            <Image 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'A')}&background=ab3600&color=fff`} 
              alt="Perfil" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-orange-500 uppercase font-display">LIONESS FIT</span>
        </div>
        <Bell size={20} className="text-orange-500" />
      </nav>

      <main className="pt-24 pb-44 px-6 max-w-4xl mx-auto">
        <div className="flex gap-4 mb-8 bg-stone-900/50 p-1 rounded-2xl border border-stone-800/50 max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('active')}
            className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", activeTab === 'active' ? "bg-[#ab3600] text-white" : "text-stone-500")}
          >
            <Play size={14} className={activeTab === 'active' ? "fill-current" : ""} /> Treino
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", activeTab === 'history' ? "bg-[#ab3600] text-white" : "text-stone-500")}
          >
            <History size={14} /> Histórico
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'active' ? (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ab3600]">SESSÃO</span>
                  <h1 className="text-5xl font-black font-display text-white uppercase">TREINO</h1>
                </div>
                <button onClick={() => generateAIWorkout()} disabled={generating} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full hover:bg-white/10 transition-all">
                  {generating ? <Loader2 size={14} className="animate-spin text-orange-500" /> : <Sparkles size={14} className="text-orange-500" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">IA REFRESH</span>
                </button>
              </div>

              <div className="mb-8">
                <button onClick={() => setShowAiConfig(!showAiConfig)} className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-500">
                  <RefreshCw size={12} className={cn(showAiConfig && "rotate-180 transition-transform")} /> Preferências IA
                </button>
                {showAiConfig && (
                  <div className="bg-stone-900/40 border border-stone-800/50 rounded-2xl p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Prioridade" value={priorityMuscles} onChange={e => setPriorityMuscles(e.target.value)} className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs outline-none" />
                    <input type="text" placeholder="Evitar" value={avoidExercises} onChange={e => setAvoidExercises(e.target.value)} className="bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs outline-none" />
                  </div>
                )}
              </div>

              <div className="grid gap-6">
                {exercises.map((ex) => (
                  <div key={ex.id} className={cn("p-6 rounded-3xl bg-stone-900/40 border transition-all", ex.completed ? "border-emerald-500/50" : "border-stone-800/50")}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-2xl font-display uppercase tracking-tight">{ex.name}</h3>
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{ex.category} • {ex.difficulty}</p>
                      </div>
                      <button onClick={() => handleComplete(ex.id)} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", ex.completed ? "bg-emerald-500" : "bg-stone-800 text-orange-500")}>
                        {completing === ex.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={24} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-stone-950/50 p-4 rounded-xl text-center"><p className="text-[9px] font-black uppercase text-stone-600">Séries</p><p className="text-2xl font-black font-display">{ex.sets}</p></div>
                      <div className="bg-stone-950/50 p-4 rounded-xl text-center"><p className="text-[9px] font-black uppercase text-stone-600">Reps</p><p className="text-2xl font-black font-display">{ex.reps}</p></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md">
                <button onClick={handleCompleteWorkout} className="w-full bg-[#ab3600] py-5 rounded-2xl font-black uppercase font-display text-lg shadow-2xl">FINALIZAR TREINO</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {history.map(s => (
                <div key={s.id} className="bg-stone-900/40 p-5 rounded-2xl border border-stone-800/50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-orange-500" />
                    <div>
                      <p className="font-black uppercase font-display">{new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] font-bold text-stone-500 uppercase">{s.duration_minutes} MINUTOS</p>
                    </div>
                  </div>
                  <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">OK</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
