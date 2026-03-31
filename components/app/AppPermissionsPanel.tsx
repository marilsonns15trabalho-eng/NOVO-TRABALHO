'use client';

import { BellRing, Camera, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useNativePermissions } from '@/hooks/useNativePermissions';
import type { NativePermissionState } from '@/lib/native-app';

function permissionLabel(value: NativePermissionState) {
  switch (value) {
    case 'granted':
      return 'Permitido';
    case 'limited':
      return 'Limitado';
    case 'prompt':
    case 'prompt-with-rationale':
      return 'Pendente';
    case 'denied':
      return 'Negado';
    default:
      return 'Indisponivel';
  }
}

function permissionTone(value: NativePermissionState) {
  if (value === 'granted' || value === 'limited') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  }

  if (value === 'denied') {
    return 'border-rose-500/20 bg-rose-500/10 text-rose-200';
  }

  return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
}

interface AppPermissionsPanelProps {
  compact?: boolean;
}

export default function AppPermissionsPanel({ compact = false }: AppPermissionsPanelProps) {
  const {
    nativeApp,
    permissions,
    loading,
    busyKey,
    requestCameraPermission,
    requestNotificationPermission,
    sendTestNotification,
  } = useNativePermissions();

  if (!nativeApp) {
    return null;
  }

  return (
    <section className={`rounded-[28px] border border-zinc-800 bg-zinc-950/70 ${compact ? 'p-4' : 'p-5 md:p-6'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
            Permissoes do app
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Camera e notificacoes</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            O aplicativo pede acesso so ao que for necessario no celular: tirar fotos de avaliacao e mostrar avisos do app.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
          {loading ? 'Verificando' : 'Status do aparelho'}
        </div>
      </div>

      <div className={`mt-5 grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
        <div className={`rounded-[24px] border p-4 ${permissionTone(permissions.camera)}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Camera</p>
              <p className="mt-2 text-sm leading-6">
                Permite tirar fotos direto pelo aplicativo durante a avaliacao.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <Camera size={18} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
              {permissionLabel(permissions.camera)}
            </span>
            <button
              type="button"
              onClick={() => void requestCameraPermission()}
              disabled={busyKey === 'camera'}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyKey === 'camera' ? 'Solicitando...' : permissions.camera === 'granted' ? 'Revisar permissao' : 'Permitir camera'}
            </button>
          </div>
        </div>

        <div className={`rounded-[24px] border p-4 ${permissionTone(permissions.notifications)}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Notificacoes</p>
              <p className="mt-2 text-sm leading-6">
                Libera avisos locais do app para lembrar tarefas e confirmar que o aparelho esta pronto.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <BellRing size={18} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
              {permissionLabel(permissions.notifications)}
            </span>
            <button
              type="button"
              onClick={() => void requestNotificationPermission()}
              disabled={busyKey === 'notifications'}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-black/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyKey === 'notifications'
                ? 'Solicitando...'
                : permissions.notifications === 'granted'
                  ? 'Revisar permissao'
                  : 'Permitir notificacoes'}
            </button>
            <button
              type="button"
              onClick={() => void sendTestNotification()}
              disabled={permissions.notifications !== 'granted' || busyKey === 'test'}
              className={`rounded-2xl px-4 py-2 text-sm font-bold transition-all ${
                permissions.notifications === 'granted'
                  ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500 hover:text-black'
                  : 'cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {busyKey === 'test' ? 'Enviando...' : 'Testar aviso'}
            </button>
          </div>
        </div>
      </div>

      {permissions.camera === 'granted' && permissions.notifications === 'granted' ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
          <CheckCircle2 size={14} />
          Aparelho pronto para testes
        </div>
      ) : null}
    </section>
  );
}
