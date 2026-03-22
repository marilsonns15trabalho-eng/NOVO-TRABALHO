'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Bell, TrendingDown, Award, Zap, Info, Plus, Loader2, Maximize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ImageModal from './ImageModal';

interface ProgressEntry {
  id: number;
  weight: number;
  recorded_at: string;
}

export default function Progress({ user }: { user: any }) {
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [uploadingBase, setUploadingBase] = useState(false);
  const [modalImage, setModalImage] = useState<{ src: string, alt: string } | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Progress
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true });
      
      if (progressError) throw progressError;
      setProgress(progressData || []);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleUploadBase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingBase(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/base_photo_${Math.random()}.${fileExt}`;
      const filePath = `base_photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fitness-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('fitness-assets')
        .getPublicUrl(filePath);

      await supabase
        .from('users')
        .update({ base_photo_url: publicUrl })
        .eq('id', user.id);

      fetchProgress();
    } catch (error) {
      console.error('Error uploading base photo:', error);
    } finally {
      setUploadingBase(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;
    setIsLogging(true);

    try {
      const { error } = await supabase
        .from('progress')
        .insert({
          user_id: user.id,
          weight: parseFloat(newWeight),
        });
      
      if (error) throw error;

      // Sync to users table
      await supabase
        .from('users')
        .update({ weight: parseFloat(newWeight) })
        .eq('id', user.id);

      setNewWeight('');
      fetchProgress();
    } catch (error) {
      console.error('Error logging weight:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const currentWeight = progress.length > 0 ? progress[progress.length - 1].weight : 0;
  const initialWeight = progress.length > 0 ? progress[0].weight : 0;
  const weightChange = currentWeight - initialWeight;

  return (
    <div className="bg-[#0c0a09] text-[#fcf9f8] min-h-screen pb-32">
      {/* Top Bar */}
      <nav className="fixed top-0 w-full z-50 bg-stone-950/70 backdrop-blur-xl flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-800/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-800 overflow-hidden ring-2 ring-[#ab3600]/20 relative">
            <Image 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'A')}&background=ab3600&color=fff`} 
              alt="Profile" 
              fill
              sizes="40px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tighter text-orange-500 uppercase font-display">LIONESS FIT</span>
        </div>
        <Bell size={18} className="text-orange-500 sm:w-[20px] sm:h-[20px]" />
      </nav>

      <main className="pt-20 sm:pt-24 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 sm:space-y-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tighter text-white">PROGRESSO</h1>
            <p className="text-stone-400 font-sans tracking-widest text-[8px] sm:text-[10px] uppercase">Visualização da Jornada</p>
          </div>
          <form onSubmit={handleLogWeight} className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="number" 
              step="0.1"
              placeholder="Peso (kg)"
              className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm flex-1 sm:w-24 focus:ring-1 focus:ring-[#ab3600] outline-none"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
            <button 
              disabled={isLogging}
              className="bg-[#ab3600] p-2 rounded-lg hover:bg-[#ff5f1f] transition-colors disabled:opacity-50"
            >
              {isLogging ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </button>
          </form>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ab3600] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-stone-900/40 rounded-xl p-6 sm:p-8 border-l-4 border-[#ab3600]">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">Peso Atual</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white font-display">{currentWeight || '--'}</span>
                    <span className="text-[#ab3600] font-bold">kg</span>
                  </div>
                </div>
                {weightChange !== 0 && (
                  <div className="bg-[#ab3600]/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <TrendingDown size={14} className={cn("text-[#ab3600]", weightChange > 0 && "rotate-180")} />
                    <span className="text-[#ab3600] text-[10px] sm:text-xs font-bold">
                      {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg desde o início
                    </span>
                  </div>
                )}
              </div>
              
              <div className="h-48 flex items-end gap-1 sm:gap-2 px-1 sm:px-2">
                {progress.length > 0 ? (
                  progress.slice(-10).map((p, i) => {
                    const maxWeight = Math.max(...progress.map(x => x.weight));
                    const minWeight = Math.min(...progress.map(x => x.weight));
                    const range = maxWeight - minWeight || 1;
                    const height = ((p.weight - minWeight) / range) * 60 + 20; // Scale between 20% and 80%
                    
                    return (
                      <div key={p.id} className="flex-1 flex flex-col items-center gap-2 group">
                        <div 
                          className="w-full bg-[#ab3600] rounded-t-lg transition-all duration-500 opacity-60 group-hover:opacity-100" 
                          style={{ height: `${height}%` }} 
                        />
                        <span className="text-[6px] sm:text-[8px] font-bold text-stone-600 uppercase text-center">
                          {new Date(p.recorded_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-600 text-sm font-medium italic">
                    Nenhum dado de peso registrado ainda.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-stone-900 rounded-xl p-6 flex flex-col justify-between items-center lg:items-start text-center lg:text-left">
              <div className="w-full">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-6">Consistência</p>
                <div className="relative w-32 h-32 mx-auto lg:mx-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="#1c1917" strokeWidth="8" />
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="#ab3600" strokeWidth="8" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - (progress.length / 30))} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white font-display">{Math.min(100, Math.round((progress.length / 30) * 100))}%</span>
                    <span className="text-[8px] text-stone-500 font-bold uppercase">Meta Mensal</span>
                  </div>
                </div>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed mt-6">
                {progress.length >= 30 
                  ? "Você atingiu sua meta de consistência mensal! Incrível." 
                  : `Continue registrando seu peso. Faltam ${30 - progress.length} registros para a meta mensal.`}
              </p>
            </div>
          </div>
        )}

        {/* Visual Evolution */}
        <section className="space-y-6 sm:space-y-10">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ab3600]">GALERIA</span>
              <h2 className="text-3xl sm:text-5xl font-black font-display text-white tracking-tighter uppercase leading-[0.85]">EVOLUÇÃO VISUAL</h2>
            </div>
            <label className="cursor-pointer text-[#ab3600] font-black text-[10px] sm:text-xs uppercase tracking-widest border-b-2 border-[#ab3600] pb-1 hover:text-[#ff5f1f] hover:border-[#ff5f1f] transition-colors">
              Enviar Nova
              <input type="file" className="hidden" accept="image/*" onChange={handleUploadBase} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[2rem] bg-stone-900 h-80 sm:h-[32rem] border border-stone-800/50 flex items-center justify-center"
            >
              {profile?.base_photo_url ? (
                <div className="relative w-full h-full cursor-pointer group" onClick={() => setModalImage({ src: profile.base_photo_url, alt: 'Base' })}>
                  <Image 
                    src={profile.base_photo_url} 
                    alt="Base" 
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={16} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-4">Foto Base Não Enviada</p>
                  <label className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors">
                    {uploadingBase ? 'Enviando...' : 'Carregar Foto Inicial'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadBase} disabled={uploadingBase} />
                  </label>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/20 to-transparent">
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Base</p>
                <h3 className="text-2xl font-black text-white uppercase font-display tracking-tighter">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }).toUpperCase() : 'INÍCIO'}
                </h3>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[2rem] bg-stone-900 h-80 sm:h-[32rem] border-2 border-[#ab3600]/30 flex items-center justify-center"
            >
              {profile?.latest_assessment_photo ? (
                <div className="relative w-full h-full cursor-pointer group" onClick={() => setModalImage({ src: profile.latest_assessment_photo, alt: 'Atual' })}>
                  <Image 
                    src={profile.latest_assessment_photo} 
                    alt="Atual" 
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-110 transition-all duration-1000 ease-out" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={16} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-4">Aguardando Avaliação</p>
                  <p className="text-stone-600 text-[8px] font-bold uppercase tracking-widest">A foto da sua última avaliação aparecerá aqui</p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#ab3600]/80 via-transparent to-transparent">
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Estado Atual</p>
                <h3 className="text-2xl font-black text-white uppercase font-display tracking-tighter">HOJE</h3>
              </div>
            </motion.div>
          </div>
          <ImageModal 
            isOpen={!!modalImage} 
            onClose={() => setModalImage(null)} 
            src={modalImage?.src || ''} 
            alt={modalImage?.alt || ''} 
          />
        </section>

        {/* Milestones */}
        <section className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">CONQUISTAS</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: <Award className="w-[18px] h-[18px] sm:w-6 sm:h-6" /> , title: 'Power Lifter', sub: '100kg Deadlift atingido' },
              { icon: <Zap className="w-[18px] h-[18px] sm:w-6 sm:h-6" /> , title: 'Consistente', sub: '30 dias seguidos' },
              { icon: <Award className="w-[18px] h-[18px] sm:w-6 sm:h-6" /> , title: 'Sprinter', sub: 'Em progresso...', locked: true },
              { icon: <Award className="w-[18px] h-[18px] sm:w-6 sm:h-6" /> , title: 'Endurance', sub: 'Bloqueado', locked: true },
            ].map((m, i) => (
              <div key={i} className={`bg-stone-900 p-4 sm:p-6 rounded-xl space-y-2 sm:space-y-3 ${m.locked ? 'opacity-40' : ''}`}>
                <div className="text-orange-500">{m.icon}</div>
                <h4 className="font-bold text-white text-xs sm:text-sm uppercase">{m.title}</h4>
                <p className="text-stone-500 text-[8px] sm:text-[10px] uppercase font-bold">{m.sub}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
