'use client';

import { useEffect, useState } from 'react';
import { BellRing, Camera, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import AppPermissionsPanel from '@/components/app/AppPermissionsPanel';
import { useNativePermissions } from '@/hooks/useNativePermissions';

const DISMISS_KEY = 'lioness_app_permissions_prompt_dismissed';

export default function AppPermissionsPrompt() {
  const pathname = usePathname();
  const { nativeApp, permissions } = useNativePermissions();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  if (!nativeApp || dismissed) {
    return null;
  }

  if (pathname === '/' || pathname.startsWith('/auth')) {
    return null;
  }

  const cameraPending = permissions.camera !== 'granted' && permissions.camera !== 'limited';
  const notificationsPending = permissions.notifications !== 'granted';
  const shouldShow = cameraPending || notificationsPending;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
      <div className="pointer-events-auto w-full max-w-2xl rounded-[30px] border border-zinc-800 bg-zinc-950/96 p-4 shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Preparar aparelho
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">Ative as permissoes do app</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {cameraPending && notificationsPending
                ? 'A camera e as notificacoes ajudam o aplicativo a funcionar melhor no celular.'
                : cameraPending
                  ? 'Permita a camera para tirar fotos direto no modulo de avaliacao.'
                  : 'Permita notificacoes para testar os avisos do app no aparelho.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(DISMISS_KEY, '1');
              setDismissed(true);
            }}
            className="rounded-2xl border border-zinc-800 bg-black/20 p-2 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
            aria-label="Fechar aviso de permissoes"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {cameraPending ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
              <Camera size={12} />
              Camera pendente
            </span>
          ) : null}
          {notificationsPending ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
              <BellRing size={12} />
              Notificacoes pendentes
            </span>
          ) : null}
        </div>

        <AppPermissionsPanel compact />
      </div>
    </div>
  );
}
