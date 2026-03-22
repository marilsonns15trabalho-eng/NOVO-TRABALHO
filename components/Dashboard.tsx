'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, Bell, Zap, Heart, Moon, Droplets, ChevronRight, AlertCircle, Sparkles, Info, Shield, Dumbbell, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const FITNESS_MYTHS = [
  { myth: "Musculação deixa a mulher com corpo de homem", fact: "Mulheres têm níveis muito mais baixos de testosterona, o que torna o ganho de massa muscular volumosa muito mais difícil." },
  { myth: "Suar muito significa que você está emagrecendo", fact: "O suor é apenas uma forma de regular a temperatura corporal, não indica queima de gordura." },
  { myth: "Fazer abdominais elimina a gordura da barriga", fact: "Não existe perda de gordura localizada. O exercício fortalece o músculo, mas a gordura é perdida no corpo todo." },
  { myth: "Comer carboidratos à noite engorda", fact: "O que importa é o balanço calórico total do dia, não o horário em que você consome os nutrientes." },
  { myth: "Quanto mais tempo na academia, melhor", fact: "A qualidade do treino e a intensidade são mais importantes do que a duração. Treinos longos podem aumentar o cortisol." }
];

export default function Dashboard({ user, onOpenAdmin }: { user: any, onOpenAdmin?: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inactivityDays, setInactivityDays] = useState<number | null>(null);
  const [mythIndex, setMythIndex] = useState(0);
  const [stats, setStats] = useState({
    workoutsCompleted: 0,
    lastWeight: 0,
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 200,
      targetFat: 60
    }
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "BOM DIA";
    if (hour >= 12 && hour < 18) return "BOA TARDE";
    return "BOA NOITE";
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMythIndex((prev) => (prev + 1) % FITNESS_MYTHS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profileData, error: errorUsers } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (errorUsers) throw errorUsers;
      setProfile(profileData);

      const { count: sessionCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: nutritionData } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', todayStart.toISOString());

      const dailyNutrition = (nutritionData || []).reduce((acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: acc.protein + (curr.protein || 0),
        carbs: acc.carbs + (curr.carbs || 0),
        fat: acc.fat + (curr.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const weight = profileData?.weight || 70;
      const targetCalories = profileData?.target_calories || (profileData?.goal === 'Emagrecimento' ? weight * 25 : weight * 35);
      const targetProtein = profileData?.target_protein || Math.round(weight * 2);
      const targetFat = profileData?.target_fat || Math.round((targetCalories * 0.25) / 9);
      const targetCarbs = profileData?.target_carbs || Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);

      const { data: lastAssessment } = await supabase
        .from('avaliacoes')
        .select('data')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .limit(1);

      if (lastAssessment?.[0]) {
        const lastDate = new Date(lastAssessment[0].data);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 7) setInactivityDays(diffDays);
      }

      setStats({
        workoutsCompleted: sessionCount || 0,
        lastWeight: weight,
        nutrition: {
          ...dailyNutrition,
          targetCalories: Math.round(targetCalories),
          targetProtein,
          targetCarbs,
          targetFat
        }
      });

    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toUpperCase();

  const getRecommendedWorkout = () => {
    const goal = profile?.goal || 'Saúde';
    if (goal === 'Hipertrofia') {
      return {
        title: 'Power & Hipertrofia',
        desc: 'Foco em carga progressiva e volume',
        img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
        time: '60 min'
      };
    }
    if (goal === 'Emagrecimento') {
      return {
        title: 'Metabolic Burn',
        desc: 'Alta intensidade para queima calórica',
        img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
        time: '40 min'
      };
    }
    return {
      title: 'Full Body Flow',
      desc: 'Mobilidade e força funcional',
      img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop',
      time: '50 min'
    };
  };

  const recommendation = getRecommendedWorkout();

  if (loading) return (
    <div className="bg-[#0c0a09] min-h-screen flex items-center justify-center">
      <Zap className="w-8 h-8 text-orange-500 animate-pulse" />
    </div>
  );

  return (
    <div className="bg-[#0c0a09] text-[#fcf9f8] min-h-screen p-6 space-y-8 pb-32 safe-area-pt">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-800 overflow-hidden border border-stone-700/50 relative">
            <Image 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'A')}&background=ab3600&color=fff`} 
              alt="Profile" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-[#ff5f1f] uppercase font-display">LIONESS FIT</span>
        </div>
        <div className="flex items-center gap-4">
          {profile?.role === 'admin' && (
            <button 
              onClick={onOpenAdmin}
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-all"
            >
              <Shield size={14} />
              Admin
            </button>
          )}
          <Search size={20} className="text-stone-400" />
          <div className="relative">
            <Bell size={20} className="text-[#ff5f1f]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-600 rounded-full"></span>
          </div>
        </div>
      </div>

      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">{formattedDate}</p>
          {profile?.plan === 'pro' && (
            <span className="flex items-center gap-1 text-amber-500 text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Crown size={10} /> Plano Pro
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tighter text-stone-50 leading-[0.9]">
          {greeting},<br/>
          <span className="bg-gradient-to-r from-[#ab3600] to-[#ff5f1f] bg-clip-text text-transparent uppercase italic">
            {profile?.full_name?.split(' ')[0] || 'ATLETA'}
          </span>
        </h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-stone-900/60 border border-stone-800/50 rounded-3xl p-6 relative overflow-hidden group"
      >
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600/20 rounded-full flex items-center justify-center text-orange-500">
              <Info size={16} />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Desmistificando o Fitness</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm sm:text-base font-bold text-white leading-relaxed italic">"{FITNESS_MYTHS[mythIndex].myth}"</p>
            <p className="text-sm font-medium text-stone-300">{FITNESS_MYTHS[mythIndex].fact}</p>
          </div>
        </div>
      </motion.section>

      {inactivityDays !== null && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-950/30 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 flex-shrink-0">
            <AlertCircle size={18} />
          </div>
          <div className="flex-1">
            <p className="text-orange-200 text-xs font-bold uppercase tracking-tight">Você não registra progresso há {inactivityDays} dias 👀</p>
            <p className="text-orange-500/70 text-[9px] font-bold uppercase tracking-widest">Mantenha a constância!</p>
          </div>
          <ChevronRight size={14} className="text-orange-500" />
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900/40 p-5 rounded-2xl border border-stone-800/50 flex flex-col items-center justify-center space-y-4">
          <Zap className="text-[#ff5f1f] w-6 h-6" fill="currentColor" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Treinos</p>
            <p className="text-xl font-black">{stats.workoutsCompleted}</p>
          </div>
        </div>

        <div className="bg-stone-900/40 p-5 rounded-2xl border border-stone-800/50 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Heart className="text-orange-500 w-5 h-5" fill="currentColor" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">PESO</span>
          </div>
          <h3 className="text-2xl font-display font-extrabold text-stone-50">{stats.lastWeight} <span className="text-sm font-normal text-stone-500">KG</span></h3>
        </div>

        <div className="bg-stone-900/40 p-5 rounded-2xl border border-stone-800/50 flex items-center gap-4">
          <Moon className="text-indigo-400 w-5 h-5" fill="currentColor" />
          <div>
            <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">NÍVEL</p>
            <h4 className="text-sm font-bold text-stone-100 uppercase">{profile?.fitness_level || 'Iniciante'}</h4>
          </div>
        </div>

        <div className="bg-stone-900/40 p-5 rounded-2xl border border-stone-800/50 flex items-center gap-4">
          <Droplets className="text-blue-400 w-5 h-5" fill="currentColor" />
          <div>
            <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">FOCO</p>
            <h4 className="text-sm font-bold text-stone-100 uppercase">{profile?.goal || 'Saúde'}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-sm font-display font-bold tracking-widest text-stone-400 uppercase">RECOMENDADO PARA VOCÊ</h2>
          <div className="bg-stone-900 rounded-2xl overflow-hidden relative h-64">
            <Image 
              src={recommendation.img} 
              alt={recommendation.title} 
              fill
              className="object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2 mb-2">
                <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Hoje</span>
                <span className="bg-stone-800/80 backdrop-blur text-stone-300 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">{recommendation.time}</span>
              </div>
              <h3 className="text-2xl font-display font-black text-stone-50 uppercase tracking-tighter">{recommendation.title}</h3>
              <p className="text-stone-400 text-xs mt-1">{recommendation.desc}</p>
            </div>
          </div>
        </section>

        <div className="bg-stone-900/40 p-8 rounded-3xl border border-stone-800/50 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">NUTRIÇÃO DIÁRIA</h2>
            <span className="text-orange-500 font-black text-base">{stats.nutrition.calories} <span className="text-stone-600 font-medium">/ {stats.nutrition.targetCalories} KCAL</span></span>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Proteína', val: `${stats.nutrition.protein}g / ${stats.nutrition.targetProtein}g`, p: Math.min(100, (stats.nutrition.protein / stats.nutrition.targetProtein) * 100), color: 'bg-orange-600' },
              { label: 'Carboidratos', val: `${stats.nutrition.carbs}g / ${stats.nutrition.targetCarbs}g`, p: Math.min(100, (stats.nutrition.carbs / stats.nutrition.targetCarbs) * 100), color: 'bg-orange-400' },
              { label: 'Gorduras', val: `${stats.nutrition.fat}g / ${stats.nutrition.targetFat}g`, p: Math.min(100, (stats.nutrition.fat / stats.nutrition.targetFat) * 100), color: 'bg-orange-300' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-stone-400">{item.label}</span>
                  <span className="text-stone-200">{item.val}</span>
                </div>
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.p || 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
