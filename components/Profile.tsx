'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { User, Mail, Calendar, Ruler, Weight, Target, Zap, LogOut, Loader2, Edit2, Camera, Trophy, CheckCircle2, History, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from './Toast';
import { cn } from '@/lib/utils';

export default function Profile({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    full_name: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    fitness_level: '',
    training_days: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          age: data.age || '',
          weight: data.weight || '',
          height: data.height || '',
          goal: data.goal || '',
          fitness_level: data.fitness_level || '',
          training_days: data.training_days || ''
        });
      }

      // Fetch recent workouts
      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      setRecentWorkouts(workouts || []);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          age: parseInt(editForm.age as string),
          weight: parseFloat(editForm.weight as string),
          height: parseFloat(editForm.height as string),
          goal: editForm.goal,
          fitness_level: editForm.fitness_level,
          training_days: parseInt(editForm.training_days as string)
        })
        .eq('id', user.id);

      if (error) throw error;
      
      showToast('Perfil atualizado!', 'success');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      // Nota: Para garantir alta qualidade, carregue arquivos originais.
      // O sistema não comprime as imagens para preservar a resolução.
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fitness-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('fitness-assets')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showToast('Foto atualizada!', 'success');
      fetchProfile();
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Erro ao carregar foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const achievements = [
    { id: 1, title: 'Iniciante', icon: Trophy, completed: true, desc: 'Criou sua conta na LIONESS FIT' },
    { id: 2, title: 'Frequência', icon: Zap, completed: (profile?.training_days || 0) >= 3, desc: 'Treina 3+ vezes por semana' },
    { id: 3, title: 'Consistente', icon: CheckCircle2, completed: recentWorkouts.length >= 3, desc: 'Completou 3 treinos' },
  ];

  if (loading && !profile) {
    return (
      <div className="bg-[#0c0a09] text-[#fcf9f8] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ab3600] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0c0a09] text-[#fcf9f8] min-h-screen pb-32">
      <main className="pt-8 sm:pt-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 sm:space-y-12">
        <header className="text-center space-y-6 sm:space-y-8">
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto group">
            <div className="w-full h-full rounded-[2.5rem] bg-stone-800 overflow-hidden ring-4 ring-[#ab3600]/20 relative shadow-2xl">
              <Image 
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'A')}&background=ab3600&color=fff`} 
                alt="Profile" 
                fill
                sizes="(max-width: 768px) 128px, 192px"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-[#ab3600] p-3 sm:p-4 rounded-2xl border-4 border-[#0c0a09] hover:bg-[#ff5f1f] transition-all shadow-xl active:scale-90 z-10"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
          
          <div className="space-y-2">
            {isEditing ? (
              <div className="max-w-xs mx-auto space-y-4">
                <input 
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-center text-xl font-black font-display text-white focus:ring-2 focus:ring-[#ab3600] outline-none"
                  placeholder="Seu Nome"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-[#ab3600] py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> Salvar
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-stone-800 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-4">
                  <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tighter text-white uppercase leading-none">
                    {profile?.full_name || 'Atleta LIONESS FIT'}
                  </h1>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-stone-900 rounded-lg text-stone-500 hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-8 bg-stone-800"></span>
                  <p className="text-stone-500 font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs">{profile?.fitness_level || 'Iniciante'}</p>
                  <span className="h-px w-8 bg-stone-800"></span>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Physical Data */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-stone-900/40 rounded-3xl p-6 sm:p-8 border border-stone-800/50">
              <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
                <h2 className="text-xs sm:text-sm font-black text-stone-500 uppercase tracking-widest">Dados Físicos</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-[10px] font-black uppercase tracking-widest text-[#ab3600]">Editar</button>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                {[
                  { icon: Calendar, label: 'Idade', value: profile?.age, key: 'age', unit: 'anos' },
                  { icon: Weight, label: 'Peso', value: profile?.weight, key: 'weight', unit: 'kg' },
                  { icon: Ruler, label: 'Altura', value: profile?.height, key: 'height', unit: 'cm' },
                  { icon: Target, label: 'Objetivo', value: profile?.goal, key: 'goal', unit: '' },
                  { icon: Zap, label: 'Treinos', value: profile?.training_days, key: 'training_days', unit: 'dias' },
                  { icon: User, label: 'Nível', value: profile?.fitness_level, key: 'fitness_level', unit: '' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2 text-orange-500">
                      <item.icon size={14} />
                      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{item.label}</p>
                    </div>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editForm[item.key as keyof typeof editForm]}
                        onChange={(e) => setEditForm({...editForm, [item.key]: e.target.value})}
                        className="w-full bg-stone-950/50 border border-stone-800/50 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    ) : (
                      <p className="font-black text-white text-base sm:text-lg font-display uppercase tracking-tight">
                        {item.value || '--'} <span className="text-[10px] text-stone-600 font-sans">{item.unit}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-stone-900/40 rounded-3xl p-6 sm:p-8 border border-stone-800/50">
              <h2 className="text-xs sm:text-sm font-black text-stone-500 uppercase tracking-widest mb-6 border-b border-stone-800 pb-4">Conquistas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className={cn(
                    "p-4 rounded-2xl border transition-all duration-500",
                    ach.completed ? "bg-orange-500/5 border-orange-500/20" : "bg-stone-950/20 border-stone-800/30 opacity-40"
                  )}>
                    <ach.icon size={24} className={ach.completed ? "text-orange-500" : "text-stone-700"} />
                    <h4 className="text-xs font-black text-white uppercase tracking-tight mt-3">{ach.title}</h4>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">{ach.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <section className="space-y-6">
            {/* Recent Workouts */}
            <div className="bg-stone-900/40 rounded-3xl p-6 border border-stone-800/50">
              <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={14} /> Treinos Recentes
              </h2>
              <div className="space-y-4">
                {recentWorkouts.length > 0 ? recentWorkouts.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-stone-950/40 rounded-2xl border border-stone-800/30">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">
                        {new Date(w.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-[8px] font-bold text-stone-600 uppercase tracking-widest">{w.duration_minutes} min</p>
                    </div>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                )) : (
                  <p className="text-[10px] text-stone-600 font-bold uppercase text-center py-4">Nenhum treino ainda</p>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-stone-900/40 rounded-3xl p-6 border border-stone-800/50 space-y-4">
              <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-2">Conta</h2>
              <div className="p-4 bg-stone-950/40 rounded-2xl border border-stone-800/30">
                <p className="text-[8px] font-black text-stone-600 uppercase tracking-widest mb-1">E-mail</p>
                <p className="text-[10px] text-stone-400 truncate font-bold">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl transition-colors group border border-red-500/20"
              >
                <LogOut className="text-red-500 w-4 h-4" />
                <span className="font-black text-red-500 uppercase text-[10px] tracking-widest">Sair da Conta</span>
              </button>
            </div>
          </section>
        </div>

        <footer className="text-center pt-10">
          <p className="text-stone-800 text-[10px] font-black uppercase tracking-[0.5em]">LIONESS FIT Fitness Atelier</p>
        </footer>
      </main>
    </div>
  );
}
