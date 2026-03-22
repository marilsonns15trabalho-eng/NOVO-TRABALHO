'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Ruler, Weight, Calendar, ChevronRight, Plus, Loader2, History, TrendingUp, User, Info, CheckCircle2, AlertCircle, Camera, ArrowUpRight, ArrowDownRight, Minus, Sparkles, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeAdMob, showRewardedAd } from '@/lib/admob';

interface Assessment {
  id: number;
  peso: number;
  altura: number;
  idade: number;
  sexo: string;
  peito: number;
  cintura: number;
  quadril: number;
  braco: number;
  perna: number;
  gordura?: number;
  observacoes?: string;
  data: string;
  foto_url?: string;
}

export default function Assessments({ user }: { user: any }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'new' | 'charts'>('history');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hasUnlocked, setHasUnlocked] = useState(false);

  useEffect(() => {
    initializeAdMob();
  }, []);

  const handleUnlockAssessment = async () => {
    // Check if user is on a free plan (assuming 'gratis' or similar, default to free if not set)
    const isFreePlan = !user?.plan || user.plan === 'gratis' || user.plan === 'free';

    if (!isFreePlan) {
      setHasUnlocked(true);
      setActiveTab('new');
      return;
    }

    const unlocked = await showRewardedAd();
    if (unlocked) {
      setHasUnlocked(true);
      setActiveTab('new');
    } else {
      alert('Não foi possível carregar o vídeo ou você não terminou de assistir. Tente novamente mais tarde.');
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    peso: '',
    altura: '',
    idade: '',
    sexo: 'Masculino',
    peito: '',
    cintura: '',
    quadril: '',
    braco: '',
    perna: '',
    gordura: '',
    observacoes: ''
  });

  const fetchAssessments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });
      
      if (error) throw error;
      setAssessments(data || []);

      // Fetch user profile for defaults
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          peso: profile.weight?.toString() || '',
          altura: profile.height?.toString() || '',
          idade: profile.age?.toString() || '',
          sexo: profile.gender === 'masculino' ? 'Masculino' : profile.gender === 'feminino' ? 'Feminino' : 'Outro'
        }));
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const generateAiFeedback = async (current: any, previous: any) => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) return;

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Você é um coach de fitness profissional e motivador.
        Analise a evolução física do aluno:
        
        Peso anterior: ${previous?.peso || 'N/A'} kg
        Peso atual: ${current.peso} kg
        Cintura anterior: ${previous?.cintura || 'N/A'} cm
        Cintura atual: ${current.cintura} cm
        Braço anterior: ${previous?.braco || 'N/A'} cm
        Braço atual: ${current.braco} cm
        
        Dê um feedback curto (máximo 3 frases), motivador e profissional sobre esses resultados.
        Foque na mudança e encoraje a continuidade do trabalho.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiFeedback(response.text() || "");
    } catch (error) {
      console.error('Error generating AI feedback:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('A foto é muito grande. O limite é 5MB.');
      return;
    }

    setUploadingPhoto(true);
    console.log('Starting photo upload...', { fileName: file.name, fileSize: file.size });

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (uploadingPhoto) {
        console.error('Upload timed out');
        setUploadingPhoto(false);
        alert('O upload demorou muito tempo. Verifique sua conexão ou tente uma imagem menor.');
      }
    }, 30000); // 30 seconds timeout

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `assessments/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { data, error: uploadError } = await supabase.storage
        .from('fitness-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, getting public URL...', data);

      const { data: { publicUrl } } = supabase.storage
        .from('fitness-assets')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);
      setPhotoUrl(publicUrl);
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Error uploading photo:', error);
      let message = 'Erro ao fazer upload da foto.';
      
      if (error.message?.includes('violates row-level security policy')) {
        message += '\n\nErro de Permissão (RLS): Você precisa configurar as políticas de segurança no Supabase para o bucket "fitness-assets". Certifique-se de ter rodado o script SQL que forneci.';
      } else if (error.message?.includes('bucket not found')) {
        message += '\n\nO bucket "fitness-assets" não foi encontrado. Você precisa criá-lo no painel do Supabase.';
      } else {
        message += `\n\nDetalhes: ${error.message || 'Erro desconhecido'}`;
      }
      alert(message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAiFeedback(null);
    
    const currentData = {
      user_id: user.id,
      peso: parseFloat(formData.peso),
      altura: parseFloat(formData.altura),
      idade: parseInt(formData.idade),
      sexo: formData.sexo,
      peito: parseFloat(formData.peito),
      cintura: parseFloat(formData.cintura),
      quadril: parseFloat(formData.quadril),
      braco: parseFloat(formData.braco),
      perna: parseFloat(formData.perna),
      gordura: formData.gordura ? parseFloat(formData.gordura) : null,
      observacoes: formData.observacoes || null,
      foto_url: photoUrl
    };

    try {
      const { error } = await supabase
        .from('avaliacoes')
        .insert(currentData);
      
      if (error) throw error;

      // Sync to users table
      const updateData: any = { 
        weight: currentData.peso,
        height: currentData.altura,
        age: currentData.idade
      };

      if (photoUrl) {
        updateData.latest_assessment_photo = photoUrl;
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      // Generate AI feedback if there's a previous assessment
      if (assessments.length > 0) {
        await generateAiFeedback(currentData, assessments[0]);
      }

      // Success
      setFormData({
        peso: '',
        altura: '',
        idade: '',
        sexo: 'Masculino',
        peito: '',
        cintura: '',
        quadril: '',
        braco: '',
        perna: '',
        gordura: '',
        observacoes: ''
      });
      setPhotoUrl(null);
      setHasUnlocked(false); // Reset unlock state
      fetchAssessments();
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert('Erro ao salvar avaliação. Verifique os campos.');
    } finally {
      setSaving(false);
    }
  };

  const getInactivityAlert = () => {
    if (assessments.length === 0) return null;
    const lastDate = new Date(assessments[0].data);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-950/30 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-4 mb-6"
        >
          <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-orange-200 text-sm font-bold uppercase tracking-tight">Você não registra progresso há {diffDays} dias 👀</p>
            <p className="text-orange-500/70 text-[10px] font-bold uppercase tracking-widest">Mantenha a constância para ver resultados!</p>
          </div>
          <button 
            onClick={() => {
              const isFreePlan = !user?.plan || user.plan === 'gratis' || user.plan === 'free';
              if (!isFreePlan || hasUnlocked) {
                setActiveTab('new');
              } else {
                handleUnlockAssessment();
              }
            }}
            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
          >
            Avaliar Agora
          </button>
        </motion.div>
      );
    }
    return null;
  };

  const calculateDiff = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    const diff = current - previous;
    const isPositive = diff > 0;
    const isZero = diff === 0;

    return (
      <div className={cn(
        "flex items-center gap-0.5 text-[10px] font-black uppercase tracking-widest",
        isZero ? "text-stone-500" : isPositive ? "text-red-500" : "text-emerald-500"
      )}>
        {isZero ? <Minus size={10} /> : isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {Math.abs(diff).toFixed(1)}
      </div>
    );
  };

  const renderCharts = () => {
    const chartData = [...assessments].reverse().map(a => ({
      date: new Date(a.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: a.peso,
      cintura: a.cintura,
      gordura: a.gordura || 0
    }));

    return (
      <div className="space-y-6 sm:space-y-8 pb-20">
        <header>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white uppercase">EVOLUÇÃO VISUAL</h2>
          <p className="text-stone-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">Seu progresso em gráficos</p>
        </header>

        <div className="space-y-4 sm:space-y-6">
          {/* Weight Chart */}
          <div className="bg-stone-900/40 border border-stone-800/50 rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-stone-400">Evolução de Peso (kg)</h3>
              <TrendingUp className="text-[#ab3600] w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ab3600" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ab3600" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="peso" stroke="#ab3600" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Waist Chart */}
          <div className="bg-stone-900/40 border border-stone-800/50 rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-stone-400">Evolução de Cintura (cm)</h3>
              <Ruler className="text-emerald-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCintura" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="cintura" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCintura)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-6">
      {getInactivityAlert()}

      {assessments.length === 0 ? (
        <div className="bg-stone-900/40 rounded-2xl p-10 border border-dashed border-stone-800 text-center space-y-4">
          <History size={40} className="mx-auto text-stone-700" />
          <p className="text-stone-500 font-medium">Nenhuma avaliação registrada ainda.</p>
          <button 
            onClick={() => {
              const isFreePlan = !user?.plan || user.plan === 'gratis' || user.plan === 'free';
              if (!isFreePlan || hasUnlocked) {
                setActiveTab('new');
              } else {
                handleUnlockAssessment();
              }
            }}
            className="text-[#ab3600] font-black text-xs uppercase tracking-widest border-b border-[#ab3600] pb-1"
          >
            Fazer primeira avaliação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assessments.map((item, index) => {
            const previous = assessments[index + 1];
            return (
              <div key={item.id} className="bg-stone-900/40 border border-stone-800/50 rounded-2xl p-5 space-y-4 group hover:border-[#ab3600]/30 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ab3600]/10 rounded-xl flex items-center justify-center text-[#ab3600]">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-black font-display uppercase tracking-tight">
                        {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </h4>
                      <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Avaliação Física</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#ab3600] bg-[#ab3600]/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-1">
                      {item.peso} KG
                    </div>
                    {calculateDiff(item.peso, previous?.peso)}
                  </div>
                </div>

                {item.foto_url && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-stone-800">
                    <Image 
                      src={item.foto_url} 
                      alt="Progresso" 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-stone-950/50 p-2 rounded-lg border border-stone-800/30 text-center">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mb-0.5">Peito</p>
                    <p className="text-sm font-black text-white">{item.peito}cm</p>
                    {calculateDiff(item.peito, previous?.peito)}
                  </div>
                  <div className="bg-stone-950/50 p-2 rounded-lg border border-stone-800/30 text-center">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mb-0.5">Cintura</p>
                    <p className="text-sm font-black text-white">{item.cintura}cm</p>
                    {calculateDiff(item.cintura, previous?.cintura)}
                  </div>
                  <div className="bg-stone-950/50 p-2 rounded-lg border border-stone-800/30 text-center">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-stone-500 mb-0.5">Braço</p>
                    <p className="text-sm font-black text-white">{item.braco}cm</p>
                    {calculateDiff(item.braco, previous?.braco)}
                  </div>
                </div>

                {item.observacoes && (
                  <div className="pt-2 border-t border-stone-800/50">
                    <p className="text-[10px] text-stone-500 italic">&quot;{item.observacoes}&quot;</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderNew = () => (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <AnimatePresence>
        {aiFeedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 space-y-4 max-w-xl mx-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] sm:text-xs">Feedback do Coach</h3>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm italic leading-relaxed">&quot;{aiFeedback}&quot;</p>
            <button 
              onClick={() => {
                setAiFeedback(null);
                setActiveTab('history');
              }}
              className="w-full bg-emerald-500 text-white py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px]"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
        <header>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white uppercase">NOVA AVALIAÇÃO</h2>
          <p className="text-stone-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">Insira suas medidas atuais</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Photo Upload */}
            <div className="space-y-3 sm:space-y-4">
              <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Foto de Progresso</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="hidden" 
                  id="photo-upload"
                />
                <label 
                  htmlFor="photo-upload"
                  className={cn(
                    "w-full h-48 sm:h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer transition-all",
                    photoUrl ? "border-emerald-500/50 bg-emerald-950/10" : "border-stone-800 bg-stone-900/50 hover:border-[#ab3600]/50"
                  )}
                >
                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#ab3600] w-8 h-8" />
                      <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Enviando...</span>
                    </div>
                  ) : photoUrl ? (
                    <>
                      <Image 
                        src={photoUrl} 
                        alt="Preview" 
                        fill 
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover opacity-100 rounded-2xl"
                        referrerPolicy="no-referrer"
                        onLoadingComplete={() => console.log('Image preview loaded successfully')}
                        onError={(e) => console.error('Image preview failed to load', e)}
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-8 h-8" />
                        <span className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">Foto Carregada</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setPhotoUrl(null);
                          }}
                          className="mt-2 text-[8px] font-bold uppercase tracking-widest text-white/60 hover:text-white border-b border-white/20"
                        >
                          Remover e trocar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="text-stone-700 group-hover:text-[#ab3600] transition-colors w-6 h-6 sm:w-8 sm:h-8" />
                      <span className="text-stone-500 font-black uppercase tracking-widest text-[8px] sm:text-[10px]">Clique para subir foto</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <section className="space-y-4 sm:space-y-6">
              <h3 className="text-xs sm:text-sm font-bold text-[#ab3600] uppercase tracking-widest border-b border-stone-800 pb-2">Dados Básicos</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Peso (kg)</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.peso} onChange={e => setFormData({...formData, peso: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Altura (cm)</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Idade</label>
                  <input 
                    type="number" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.idade} onChange={e => setFormData({...formData, idade: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Sexo</label>
                  <select 
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <section className="space-y-4 sm:space-y-6">
              <h3 className="text-xs sm:text-sm font-bold text-[#ab3600] uppercase tracking-widest border-b border-stone-800 pb-2">Medidas (cm)</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Peito</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.peito} onChange={e => setFormData({...formData, peito: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Cintura</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.cintura} onChange={e => setFormData({...formData, cintura: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Quadril</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.quadril} onChange={e => setFormData({...formData, quadril: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Braço</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.braco} onChange={e => setFormData({...formData, braco: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Perna</label>
                  <input 
                    type="number" step="0.1" required
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.perna} onChange={e => setFormData({...formData, perna: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">% Gordura</label>
                  <input 
                    type="number" step="0.1"
                    className="w-full bg-stone-900 border-none rounded-xl h-10 sm:h-12 px-3 sm:px-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600]"
                    value={formData.gordura} onChange={e => setFormData({...formData, gordura: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <label className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-500">Observações</label>
              <textarea 
                className="w-full bg-stone-900 border-none rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-white focus:ring-2 focus:ring-[#ab3600] h-24 sm:h-32 lg:h-40 resize-none"
                placeholder="Como você se sente hoje?"
                value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})}
              />
            </section>
          </div>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="w-full bg-[#ab3600] hover:bg-[#ff5f1f] py-4 sm:py-5 rounded-2xl shadow-2xl shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3"
        >
          {saving ? <Loader2 className="animate-spin" /> : (
            <>
              <CheckCircle2 className="text-white w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
              <span className="text-white font-black tracking-widest uppercase font-display text-base sm:text-lg">Salvar Avaliação</span>
            </>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="bg-[#0c0a09] text-[#fcf9f8] min-h-screen">
      <main className="pt-8 sm:pt-12 pb-32 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 sm:space-y-10">
        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 bg-stone-900/50 p-1 rounded-2xl border border-stone-800/50 overflow-x-auto no-scrollbar max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 min-w-[90px] sm:min-w-[100px] py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2",
              activeTab === 'history' ? "bg-[#ab3600] text-white shadow-lg" : "text-stone-500 hover:text-stone-300"
            )}
          >
            <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Histórico
          </button>
          <button 
            onClick={() => setActiveTab('charts')}
            className={cn(
              "flex-1 min-w-[90px] sm:min-w-[100px] py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2",
              activeTab === 'charts' ? "bg-[#ab3600] text-white shadow-lg" : "text-stone-500 hover:text-stone-300"
            )}
          >
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Gráficos
          </button>
          <button 
            onClick={() => {
              const isFreePlan = !user?.plan || user.plan === 'gratis' || user.plan === 'free';
              if (!isFreePlan || hasUnlocked) {
                setActiveTab('new');
              } else {
                handleUnlockAssessment();
              }
            }}
            className={cn(
              "flex-1 min-w-[90px] sm:min-w-[100px] py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2",
              activeTab === 'new' ? "bg-[#ab3600] text-white shadow-lg" : "text-stone-500 hover:text-stone-300"
            )}
          >
            {(!user?.plan || user?.plan === 'gratis' || user?.plan === 'free') && !hasUnlocked ? <PlayCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {(!user?.plan || user?.plan === 'gratis' || user?.plan === 'free') && !hasUnlocked ? 'Liberar' : 'Novo'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#ab3600] animate-spin" />
                </div>
              ) : renderHistory()}
            </motion.div>
          ) : activeTab === 'charts' ? (
            <motion.div
              key="charts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-[#ab3600] animate-spin" />
                </div>
              ) : renderCharts()}
            </motion.div>
          ) : (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderNew()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
