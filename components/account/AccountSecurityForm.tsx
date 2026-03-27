'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
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
    () => (required ? 'Troca obrigatoria de senha' : 'Senha e recuperacao'),
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
        text: 'Informe a pergunta secreta e a resposta secreta juntas.',
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-500">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-zinc-400">
            {required
              ? 'Para continuar usando o sistema, atualize sua senha agora. Aproveite e configure a recuperacao por pergunta secreta.'
              : 'Atualize sua senha quando quiser e cadastre uma pergunta secreta para recuperar o acesso.'}
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            message.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-500'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nova senha</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={6}
            required={required}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
            placeholder="Minimo de 6 caracteres"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required={required}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
            placeholder="Repita a nova senha"
          />
        </div>
      </div>

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pergunta secreta</label>
          <select
            value={secretQuestion}
            onChange={(event) => setSecretQuestion(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
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
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resposta secreta</label>
          <input
            type="text"
            value={secretAnswer}
            onChange={(event) => setSecretAnswer(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
            placeholder="Sua resposta"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 font-bold text-black shadow-lg shadow-orange-500/20 transition-all active:scale-95 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        Salvar seguranca da conta
      </button>
    </form>
  );
}
