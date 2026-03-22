'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, User, Target, Zap, Calendar, Ruler, Weight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface OnboardingProps {
  onSuccess: () => void;
  onBack: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}

export default function Onboarding({ onSuccess, onBack, onOpenTerms, onOpenPrivacy }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    goal: '',
    fitness_level: '',
    training_days: '',
    age: '',
    weight: '',
    height: '',
    gender: 'masculino'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          ...formData,
          age: parseInt(formData.age),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          training_days: parseInt(formData.training_days)
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar seu perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-display text-white uppercase italic leading-none">Qual seu<br/>nome?</h2>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Começamos com o básico.</p>
            </div>
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-[#ff5f1f] transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-5 pl-12 pr-6 text-white text-lg focus:ring-2 focus:ring-[#ff5f1f] outline-none transition-all"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-display text-white uppercase italic leading-none">Qual seu<br/>objetivo?</h2>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Personalizaremos sua jornada.</p>
            </div>
            <div className="grid gap-3">
              {['Emagrecimento', 'Hipertrofia', 'Definição', 'Performance'].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setFormData({...formData, goal})}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group",
                    formData.goal === goal
                      ? "bg-[#ff5f1f] border-[#ff5f1f] text-white"
                      : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700"
                  )}
                >
                  <span className="font-display font-black uppercase italic tracking-tight text-xl">{goal}</span>
                  {formData.goal === goal && <Check size={24} />}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-display text-white uppercase italic leading-none">Dados<br/>Físicos</h2>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Precisão é a nossa regra.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Idade</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                  <input
                    type="number" placeholder="00"
                    className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-4 pl-12 text-white outline-none focus:ring-2 focus:ring-[#ff5f1f]"
                    value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Gênero</label>
                <select
                  className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-4 px-4 text-white outline-none focus:ring-2 focus:ring-[#ff5f1f] appearance-none"
                  value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="masculino">Masc</option>
                  <option value="feminino">Fem</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Peso (kg)</label>
                <div className="relative">
                  <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                  <input
                    type="number" placeholder="00.0"
                    className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-4 pl-12 text-white outline-none focus:ring-2 focus:ring-[#ff5f1f]"
                    value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-1">Altura (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                  <input
                    type="number" placeholder="000"
                    className="w-full bg-stone-900 border border-stone-800 rounded-2xl py-4 pl-12 text-white outline-none focus:ring-2 focus:ring-[#ff5f1f]"
                    value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-black font-display text-white uppercase italic leading-none">Nível &<br/>Frequência</h2>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Finalizando seu perfil.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Nível de Experiência</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Iniciante', 'Intermediário', 'Avançado'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFormData({...formData, fitness_level: lvl})}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.fitness_level === lvl
                          ? "bg-[#ff5f1f] border-[#ff5f1f] text-white"
                          : "bg-stone-900 border-stone-800 text-stone-500"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Dias de Treino por Semana</label>
                <div className="grid grid-cols-7 gap-1">
                  {[1,2,3,4,5,6,7].map((num) => (
                    <button
                      key={num}
                      onClick={() => setFormData({...formData, training_days: num.toString()})}
                      className={cn(
                        "aspect-square rounded-xl border font-black flex items-center justify-center transition-all",
                        formData.training_days === num.toString()
                          ? "bg-[#ff5f1f] border-[#ff5f1f] text-white"
                          : "bg-stone-900 border-stone-800 text-stone-500"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-stone-800">
                <p className="text-[10px] text-stone-600 text-center leading-relaxed">
                  Ao finalizar, você concorda com nossos <br/>
                  <button type="button" onClick={onOpenTerms} className="text-[#ff5f1f] hover:underline font-bold uppercase tracking-tighter">Termos de Uso</button> e <button type="button" onClick={onOpenPrivacy} className="text-[#ff5f1f] hover:underline font-bold uppercase tracking-tighter">Política de Privacidade</button>.
                </p>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#fcf9f8] flex flex-col p-6 sm:p-12 safe-area-pt safe-area-pb">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between">
        <header className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  s === step ? "w-8 bg-[#ff5f1f]" : s < step ? "w-4 bg-[#ff5f1f]/40" : "w-4 bg-stone-800"
                )}
              />
            ))}
          </div>
          {step > 1 && (
            <button onClick={prevStep} className="text-stone-500 hover:text-white transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
        </header>

        <main className="flex-1 flex items-center py-12">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>
        </main>

        <footer>
          <button
            onClick={step === 4 ? handleComplete : nextStep}
            disabled={loading || (step === 1 && !formData.full_name) || (step === 2 && !formData.goal)}
            className="w-full bg-[#ff5f1f] text-white py-5 rounded-3xl font-display font-black text-xl italic uppercase tracking-tighter shadow-2xl shadow-orange-950/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-6 h-6" /> : (
              <>
                {step === 4 ? 'Finalizar Atelier' : 'Próximo'}
                <ChevronRight size={24} />
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className="w-full mt-4 text-stone-600 hover:text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] transition-colors"
          >
            Voltar ao Login
          </button>
        </footer>
      </div>
    </div>
  );
}
