'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDefaultRouteForRole } from '@/lib/navigation';
import {
  recoverPasswordWithSecretQuestion,
  requestRecoveryQuestion,
} from '@/services/account.service';

const AUTH_FLASH_MESSAGE_KEY = 'lioness-auth-flash-message';

const authNotes = [
  {
    title: 'Acesso criado pela administracao',
    description: 'O login do aluno, professor ou admin e liberado dentro do painel.',
    icon: UserRound,
  },
  {
    title: 'Primeiro login protegido',
    description: 'Novos acessos precisam trocar a senha antes de continuar.',
    icon: ShieldCheck,
  },
  {
    title: 'Recuperacao por pergunta secreta',
    description: 'A redefinicao usa a pergunta configurada no primeiro acesso.',
    icon: KeyRound,
  },
];

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
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    setIsNativeApp(Boolean((window as any).Capacitor?.isNativePlatform?.()));
  }, []);

  useEffect(() => {
    if (isReady && user && role) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [isReady, role, router, user]);

  useEffect(() => {
    const nextMode = searchParams.get('mode') === 'recover' ? 'recover' : 'login';
    setMode(nextMode);
  }, [searchParams]);

  useEffect(() => {
    try {
      const flashMessage = sessionStorage.getItem(AUTH_FLASH_MESSAGE_KEY);
      if (!flashMessage) return;

      setSuccess(flashMessage);
      sessionStorage.removeItem(AUTH_FLASH_MESSAGE_KEY);
    } catch {}
  }, []);

  const headerTitle = useMemo(
    () => (mode === 'login' ? 'Entrar na plataforma' : 'Recuperar acesso'),
    [mode]
  );

  const headerDescription = useMemo(
    () =>
      mode === 'login'
        ? 'Use o acesso criado pela administracao para entrar no painel.'
        : 'Recupere a conta usando a pergunta secreta configurada no sistema.',
    [mode]
  );

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
      setSuccess('Pergunta carregada. Informe a resposta e defina a nova senha.');
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
        <Loader2 className="animate-spin text-orange-500" size={44} />
      </div>
    );
  }

  if (user && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white md:px-6">
        <div className="w-full max-w-md rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 text-center shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)] md:p-8">
          <h2 className="mb-3 text-2xl font-bold">Sessao incompleta</h2>
          <p className="mb-6 text-sm leading-6 text-zinc-400">
            {authError || 'Nao foi possivel carregar seu perfil. Saia e tente novamente.'}
          </p>
          <button
            onClick={async () => {
              await signOut();
              router.replace('/auth');
            }}
            className="rounded-2xl bg-orange-500 px-6 py-3 font-bold text-black transition-all hover:bg-orange-400"
          >
            Sair e tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="absolute left-0 top-1/3 h-[320px] w-[320px] rounded-full bg-sky-500/8 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[0.98fr_1.02fr] lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col justify-between rounded-[30px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(135deg,rgba(20,20,24,0.96),rgba(8,8,8,0.98))] p-5 shadow-[0_40px_120px_-70px_rgba(249,115,22,0.45)] md:p-8"
        >
          <div>
            {!isNativeApp ? (
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 transition-all hover:border-zinc-700 hover:text-white"
              >
                <ArrowLeft size={14} />
                Voltar
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
                App do estudio
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black text-black">
                L
              </div>
              <div>
                <h1 className="text-base font-bold tracking-[0.2em] text-white">LIONESS</h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-orange-400">Prime</p>
              </div>
            </div>

            <div className="mt-8 max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange-300">
                {isNativeApp ? 'Acesso no app' : 'Acesso ao sistema'}
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight text-white md:text-5xl">
                Painel de trabalho para administracao, professor e aluno.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-300 md:text-base">
                O acesso e controlado dentro da plataforma. Cada perfil enxerga apenas as areas
                necessarias para sua rotina.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {authNotes.map((note) => (
                <div
                  key={note.title}
                  className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black/25 px-4 py-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
                    <note.icon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{note.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{note.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-zinc-400">
            Suporte de acesso e liberacao de contas pelo painel administrativo.
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="flex items-center"
        >
          <div className="w-full rounded-[30px] border border-zinc-800 bg-zinc-950/92 p-5 shadow-[0_36px_120px_-70px_rgba(0,0,0,0.95)] md:p-8">
            <div className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                {mode === 'login' ? 'Entrar' : 'Recuperacao'}
              </p>
              <h3 className="mt-3 text-3xl font-bold text-white">{headerTitle}</h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">{headerDescription}</p>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-300">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
                {success}
              </div>
            ) : null}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    E-mail
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Digite sua senha"
                      minLength={6}
                      className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 pr-12 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-black transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Entrar
                </button>
              </form>
            ) : recoveryStep === 'lookup' ? (
              <form onSubmit={handleRecoveryLookup} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    E-mail
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-black transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  Buscar pergunta secreta
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecoveryReset} className="space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Pergunta secreta
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">{recoveryQuestion}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Resposta
                  </label>
                  <input
                    required
                    type="text"
                    value={recoveryAnswer}
                    onChange={(event) => setRecoveryAnswer(event.target.value)}
                    placeholder="Digite sua resposta"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Nova senha
                  </label>
                  <input
                    required
                    type="password"
                    value={recoveryPassword}
                    onChange={(event) => setRecoveryPassword(event.target.value)}
                    minLength={6}
                    placeholder="Crie uma nova senha"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
                    Confirmar nova senha
                  </label>
                  <input
                    required
                    type="password"
                    value={recoveryPasswordConfirm}
                    onChange={(event) => setRecoveryPasswordConfirm(event.target.value)}
                    minLength={6}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryQuestion('');
                      setRecoveryStep('lookup');
                      resetFeedback();
                    }}
                    className="rounded-2xl border border-zinc-800 bg-black/30 py-3.5 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-black transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                    Redefinir senha
                  </button>
                </div>
              </form>
            )}

            <div className="mt-7 border-t border-zinc-800 pt-5 text-center">
              {mode === 'login' ? (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-zinc-500">
                    O acesso e liberado pela administracao. Se voce ja tem conta, use o e-mail e a
                    senha recebidos.
                  </p>
                  <button
                    onClick={() => switchMode('recover')}
                    className="font-bold text-orange-400 transition-colors hover:text-orange-300"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => switchMode('login')}
                  className="font-bold text-orange-400 transition-colors hover:text-orange-300"
                >
                  Voltar para o login
                </button>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <Loader2 className="animate-spin text-orange-500" size={44} />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
