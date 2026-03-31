'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { saveAccountSecurity } from '@/services/account.service';
import { useAuth } from '@/hooks/useAuth';
import { SECRET_QUESTIONS } from '@/lib/security-questions';
import { supabase } from '@/lib/supabase';

interface AccountSecurityFormProps {
  required?: boolean;
  compact?: boolean;
  onSuccess?: () => void;
}

export default function AccountSecurityForm({
  required = false,
  compact = false,
  onSuccess,
}: AccountSecurityFormProps) {
  const { patchProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const title = useMemo(
    () => (required ? 'Primeiro acesso protegido' : 'Senha e recuperacao'),
    [required]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: 'Senha',
        value: required ? 'Troca obrigatoria agora' : 'Atualize quando quiser',
        tone: required ? 'text-orange-300' : 'text-emerald-300',
      },
      {
        label: 'Recuperacao',
        value: '5 perguntas prontas com resposta unica',
        tone: 'text-sky-300',
      },
    ],
    [required]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (required && !newPassword) {
      setMessage({ type: 'error', text: 'Defina uma nova senha para continuar.' });
      return;
    }

    if (!newPassword && !secretQuestion && !secretAnswer) {
      setMessage({ type: 'error', text: 'Informe ao menos uma alteracao de seguranca.' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'A confirmacao da senha nao confere.' });
      return;
    }

    if ((secretQuestion && !secretAnswer) || (!secretQuestion && secretAnswer)) {
      setMessage({
        type: 'error',
        text: 'Selecione a pergunta e informe a resposta secreta juntas.',
      });
      return;
    }

    setLoading(true);

    try {
      let passwordWasUpdated = false;

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          throw new Error(passwordError.message);
        }

        passwordWasUpdated = true;
      }

      const result = await saveAccountSecurity({
        newPassword: passwordWasUpdated ? undefined : newPassword || undefined,
        passwordWasUpdated,
        secretQuestion: secretQuestion || undefined,
        secretAnswer: secretAnswer || undefined,
      });

      patchProfile({
        must_change_password: false,
        secret_question: result.password_recovery_enabled
          ? secretQuestion || undefined
          : null,
        password_recovery_enabled: result.password_recovery_enabled,
      });

      setMessage({
        type: 'success',
        text: result.message || 'Seguranca da conta atualizada com sucesso.',
      });
      setNewPassword('');
      setConfirmPassword('');
      setSecretQuestion('');
      setSecretAnswer('');
      onSuccess?.();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Nao foi possivel salvar as alteracoes.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div className="relative overflow-hidden rounded-[24px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(10,10,10,0.98))] p-4 shadow-[0_28px_90px_-48px_rgba(249,115,22,0.45)] sm:rounded-[30px] sm:p-6">
        <div className="absolute inset-y-0 right-0 hidden w-48 bg-gradient-to-l from-orange-500/5 to-transparent sm:block" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-2.5 text-orange-400 shadow-lg shadow-orange-500/10 sm:rounded-3xl sm:p-3">
                <ShieldCheck size={20} className="sm:h-[22px] sm:w-[22px]" />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-400/80">
                    Seguranca da conta
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">{title}</h3>
                </div>

                <p className="max-w-xl text-sm leading-6 text-zinc-400">
                  {required
                    ? 'Defina sua nova senha para liberar o acesso e escolha uma das perguntas prontas para recuperar a conta quando precisar.'
                    : 'Mantenha sua conta protegida com uma senha forte e uma pergunta secreta pronta para recuperacao.'}
                </p>

                {required && (
                  <div className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
                    Acao obrigatoria antes de usar o painel
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[380px]">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 backdrop-blur-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                  {card.label}
                </p>
                <p className={`mt-2 text-sm font-semibold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={`grid gap-4 sm:gap-5 ${compact ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[1.05fr_0.95fr]'}`}>
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/85 p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.9)] sm:rounded-[28px] sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Atualizar senha
              </p>
              <h4 className="mt-2 text-lg font-bold text-white sm:text-xl">Renove seu acesso</h4>
              <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                Use uma senha nova, com pelo menos 6 caracteres, para proteger seu acesso ao painel.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-zinc-300 sm:p-3">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Nova senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required={required}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40"
                placeholder="Minimo de 6 caracteres"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required={required}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40"
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/85 p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.9)] sm:rounded-[28px] sm:p-5">
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
              Recuperacao
            </p>
            <h4 className="mt-2 text-lg font-bold text-white sm:text-xl">Pergunta secreta pronta</h4>
            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
              Escolha uma das 5 perguntas oficiais do sistema e salve apenas a sua resposta.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Pergunta secreta
              </label>
              <select
                value={secretQuestion}
                onChange={(event) => setSecretQuestion(event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40"
              >
                <option value="">Selecione uma pergunta</option>
                {SECRET_QUESTIONS.map((question) => (
                  <option key={question} value={question}>
                    {question}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Resposta secreta
              </label>
              <input
                type="text"
                value={secretAnswer}
                onChange={(event) => setSecretAnswer(event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/40"
                placeholder="Digite somente a resposta"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[22px] border border-zinc-800 bg-zinc-950/80 p-4 sm:rounded-[26px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Finalize a protecao do seu acesso</p>
          <p className="mt-1 text-sm text-zinc-500">
            Sua senha e seus dados de recuperacao ficam vinculados ao seu perfil.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3.5 font-bold text-black shadow-lg shadow-orange-500/20 transition-all active:scale-[0.99] hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          Salvar seguranca da conta
        </button>
      </div>
    </form>
  );
}
