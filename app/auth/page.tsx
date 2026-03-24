'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Se já logado, redirecionar para dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(translateError(result.error));
        } else {
          router.push('/dashboard');
        }
      } else {
        if (!name.trim()) {
          setError('Nome é obrigatório.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        const result = await signUp(email, password, name);
        if (result.error) {
          setError(translateError(result.error));
        } else {
          setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
        }
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const translateError = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
    return msg;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="text-orange-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-black font-bold text-3xl">
            🦁
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-tight">LIONESS</h1>
            <p className="text-orange-500 text-[10px] font-semibold tracking-[0.3em] uppercase">Prime</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">
            {mode === 'login'
              ? 'Acesse o painel de gestão do seu estúdio.'
              : 'Crie sua conta e comece a gerenciar agora.'}
          </p>

          {/* Errors / Success */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold p-4 rounded-xl mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold p-4 rounded-xl mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Nome Completo
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                E-mail
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-black border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Senha
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-3.5 px-4 pr-12 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 text-lg"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setSuccess('');
                }}
                className="text-orange-500 font-bold hover:text-orange-400 transition-colors"
              >
                {mode === 'login' ? 'Criar conta' : 'Entrar'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
