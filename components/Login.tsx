'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoginProps {
  onSuccess: (isNewUser: boolean) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
      setError('Configuração do Supabase ausente. Por favor, configure as variáveis de ambiente.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      
      if (data.user) {
        const userId = data.user.id;
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        onSuccess(!userData);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao entrar.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#0c0a09]">
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative bg-[#1c1b1b] items-center justify-center p-12 lg:p-24 overflow-hidden border-r border-stone-800">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image 
            src="https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=2070&auto=format&fit=crop" 
            alt="Editorial Fitness" 
            fill
            sizes="50vw"
            className="object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 w-full max-w-xl">
          <p className="font-sans text-xs font-black tracking-[0.4em] text-[#ff5f1f] mb-6 uppercase">LIONESS FIT ATELIER</p>
          <h1 className="font-display text-7xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-8 italic uppercase">
            PODER<br/>ATRAVÉS DA<br/>PRECISÃO
          </h1>
          <div className="flex items-center gap-6">
            <div className="h-[2px] w-16 bg-[#ff5f1f]"></div>
            <p className="text-stone-400 text-xl lg:text-2xl font-light max-w-sm leading-relaxed">Curando sua performance com excelência em fitness editorial.</p>
          </div>
        </div>
      </section>

      <section className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 bg-[#0c0a09]">
        <div className="w-full max-w-md">
          <header className="mb-12">
            <div className="flex items-center justify-between mb-16">
              <span className="text-2xl font-black tracking-tighter text-[#ff5f1f] uppercase font-display italic">LIONESS FIT</span>
              <button 
                type="button"
                onClick={() => onSuccess(true)}
                className="font-sans text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-white transition-colors"
              >
                Criar Conta
              </button>
            </div>
            <h2 className="font-display text-4xl font-bold text-white tracking-tight mb-2 uppercase italic">Bem-vindo</h2>
            <p className="text-stone-500 text-base font-medium">Faça login no seu atelier de fitness privado.</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500 ml-1">E-mail</label>
              <input 
                className="w-full px-5 py-4 bg-stone-900/50 border border-stone-800 rounded-xl focus:ring-1 focus:ring-[#ff5f1f] text-white placeholder:text-stone-700 outline-none transition-all"
                placeholder="nome@exemplo.com" 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Senha</label>
                <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-[#ff5f1f] hover:text-white">Esqueceu?</button>
              </div>
              <div className="relative">
                <input 
                  className="w-full px-5 py-4 bg-stone-900/50 border border-stone-800 rounded-xl focus:ring-1 focus:ring-[#ff5f1f] text-white placeholder:text-stone-700 outline-none transition-all"
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-[#ff5f1f] text-white font-display font-black py-4 rounded-2xl shadow-xl shadow-orange-950/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase italic disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Entrar <ArrowRight size={20} /></>}
            </button>
          </form>

          <footer className="mt-16 text-center">
            <p className="text-stone-600 text-sm font-bold uppercase tracking-widest">
              Novo Atleta?
              <button type="button" onClick={() => onSuccess(true)} className="text-[#ff5f1f] hover:underline ml-2">Criar Conta</button>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
