'use client';

import { Download, RefreshCcw, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { openExternalUrl } from '@/lib/external-links';
import { isNativeApp } from '@/lib/platform';

export default function AppUpdatePrompt() {
  const pathname = usePathname();
  const { loading, installed, remote, updateAvailable, dismissed, dismiss } = useAppUpdate();

  if (!isNativeApp() || loading || !installed || !remote || !updateAvailable || dismissed) {
    return null;
  }

  if (pathname === '/' || pathname === '/mobile' || pathname.startsWith('/auth')) {
    return null;
  }

  const handleUpdate = async () => {
    const origin = window.location.origin;
    await openExternalUrl(`${origin}${remote.downloadUrl}`);
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[90] rounded-[24px] border border-orange-500/20 bg-zinc-950/96 p-4 shadow-[0_30px_90px_-52px_rgba(0,0,0,0.96)] backdrop-blur-xl md:inset-x-auto md:right-6 md:top-[calc(env(safe-area-inset-top)+1rem)] md:bottom-auto md:w-[380px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-400">
            Atualizacao disponivel
          </p>
          <h3 className="mt-2 text-lg font-bold text-white">
            Versao {remote.versionName} pronta para instalar
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Seu app esta na versao {installed.version}. Toque em atualizar para baixar o APK novo.
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-500 transition-all hover:border-zinc-700 hover:text-white"
          aria-label="Fechar aviso de atualizacao"
        >
          <X size={16} />
        </button>
      </div>

      {remote.releaseNotes?.highlights?.length ? (
        <div className="mt-4 rounded-[20px] border border-zinc-800 bg-black/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-300">
            {remote.releaseNotes.title}
          </p>
          <div className="mt-3 space-y-2">
            {remote.releaseNotes.highlights.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm leading-5 text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleUpdate()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-orange-400"
        >
          <Download size={16} />
          Atualizar app
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:text-white"
        >
          <RefreshCcw size={16} />
          Depois
        </button>
      </div>
    </div>
  );
}
