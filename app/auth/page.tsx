'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User already registered')) return 'Este e-mail ja esta cadastrado.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  return message;
}

function AuthContent() {
  const { user, role, isReady, signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(translateError(result.error));
        }
      } else {
        if (!name.trim()) {
          setError('Nome e obrigatorio.');
          setSubmitting(false);
          return;
        }

        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setSubmitting(false);
          return;
        }

        const result = await signUp(email, password, name);
        if (result.error) {
          setError(translateError(result.error));
        } else {
          setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
        }
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2 text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-3xl font-bold text-black">
            L
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-white">LIONESS</h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-500">Prime</p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <h2 className="mb-2 text-2xl font-bold">
            {mode === 'login' ? 'Entrar na sua conta' : 'Criar nova conta'}
          </h2>
          <p className="mb-8 text-sm text-zinc-500">
            {mode === 'login'
              ? 'Acesse o painel de gestao do seu estudio.'
              : 'Crie sua conta e comece a gerenciar agora.'}
          </p>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-500">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-500">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">E-mail</label>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Senha</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 pr-12 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-lg font-bold text-black shadow-lg shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="animate-spin" size={20} />}
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              {mode === 'login' ? 'Nao tem conta?' : 'Ja tem conta?'}{' '}
              <button
                onClick={() => {
                  setMode((current) => (current === 'login' ? 'register' : 'login'));
                  setError('');
                  setSuccess('');
                }}
                className="font-bold text-orange-500 transition-colors hover:text-orange-400"
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

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <Loader2 className="animate-spin text-orange-500" size={48} />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
