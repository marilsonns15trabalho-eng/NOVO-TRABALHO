'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';
import {
  recoverPasswordWithSecretQuestion,
  requestRecoveryQuestion,
} from '@/services/account.service';

const AUTH_FLASH_MESSAGE_KEY = 'lioness-auth-flash-message';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  return message;
}

function AuthContent() {
  const { user, role, isReady, authError, signIn, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'recover'>(
    searchParams.get('mode') === 'recover' ? 'recover' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'lookup' | 'reset'>('lookup');

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  useEffect(() => {
    try {
      const flashMessage = sessionStorage.getItem(AUTH_FLASH_MESSAGE_KEY);
      if (!flashMessage) return;

      setSuccess(flashMessage);
      sessionStorage.removeItem(AUTH_FLASH_MESSAGE_KEY);
    } catch {}
  }, []);

  const resetFeedback = () => {
    setError('');
    setSuccess('');
  };

  const switchMode = (nextMode: 'login' | 'recover') => {
    setMode(nextMode);
    resetFeedback();
    setRecoveryQuestion('');
    setRecoveryAnswer('');
    setRecoveryPassword('');
    setRecoveryPasswordConfirm('');
    setRecoveryStep('lookup');
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(translateError(result.error));
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoveryLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    try {
      const result = await requestRecoveryQuestion(email);
      setRecoveryQuestion(result.question);
      setRecoveryStep('reset');
      setSuccess('Pergunta secreta carregada. Informe a resposta e defina a nova senha.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel iniciar a recuperacao.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoveryReset = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (recoveryPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (recoveryPassword !== recoveryPasswordConfirm) {
      setError('A confirmacao da nova senha nao confere.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await recoverPasswordWithSecretQuestion(
        email,
        recoveryAnswer,
        recoveryPassword
      );
      setSuccess(result.message || 'Senha atualizada com sucesso.');
      setPassword('');
      setRecoveryQuestion('');
      setRecoveryAnswer('');
      setRecoveryPassword('');
      setRecoveryPasswordConfirm('');
      setRecoveryStep('lookup');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel redefinir a senha.');
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

  if (user && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold">Sessao incompleta</h2>
          <p className="mb-6 text-sm text-zinc-400">
            {authError || 'Nao foi possivel carregar seu perfil de acesso. Saia e tente novamente.'}
          </p>
          <button
            onClick={async () => {
              await signOut();
              router.replace('/auth');
            }}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-bold text-black transition-all hover:bg-orange-600"
          >
            Sair e tentar novamente
          </button>
        </div>
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
            {mode === 'login' ? 'Entrar na sua conta' : 'Recuperar acesso'}
          </h2>
          <p className="mb-8 text-sm text-zinc-500">
            {mode === 'login'
              ? 'Acesse o painel da academia com o acesso criado pela administracao.'
              : 'Recupere sua senha usando a pergunta secreta configurada no painel.'}
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

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                Entrar
              </button>
            </form>
          ) : recoveryStep === 'lookup' ? (
            <form onSubmit={handleRecoveryLookup} className="space-y-5">
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

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-lg font-bold text-black shadow-lg shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="animate-spin" size={20} />}
                Buscar pergunta secreta
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecoveryReset} className="space-y-5">
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Pergunta secreta
                </p>
                <p className="mt-2 text-sm text-white">{recoveryQuestion}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resposta secreta</label>
                <input
                  required
                  type="text"
                  value={recoveryAnswer}
                  onChange={(event) => setRecoveryAnswer(event.target.value)}
                  placeholder="Sua resposta"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nova senha</label>
                <input
                  required
                  type="password"
                  value={recoveryPassword}
                  onChange={(event) => setRecoveryPassword(event.target.value)}
                  minLength={6}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Confirmar nova senha</label>
                <input
                  required
                  type="password"
                  value={recoveryPasswordConfirm}
                  onChange={(event) => setRecoveryPasswordConfirm(event.target.value)}
                  minLength={6}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryQuestion('');
                    setRecoveryStep('lookup');
                    resetFeedback();
                  }}
                  className="flex-1 rounded-2xl border border-zinc-800 bg-black/30 py-4 font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-bold text-black shadow-lg shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <Loader2 className="animate-spin" size={20} />}
                  Redefinir senha
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500">
                  Seu acesso e criado pela administracao. Se ainda nao tiver credenciais, fale com o painel admin.
                </p>
                <button
                  onClick={() => switchMode('recover')}
                  className="font-bold text-orange-500 transition-colors hover:text-orange-400"
                >
                  Esqueci minha senha
                </button>
              </div>
            ) : (
              <button
                onClick={() => switchMode('login')}
                className="font-bold text-orange-500 transition-colors hover:text-orange-400"
              >
                Voltar para o login
              </button>
            )}
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
