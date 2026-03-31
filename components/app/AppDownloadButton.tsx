'use client';

import { Download, Smartphone } from 'lucide-react';
import { useNativeApp } from '@/hooks/useNativeApp';

interface AppDownloadButtonProps {
  compact?: boolean;
}

export default function AppDownloadButton({ compact = false }: AppDownloadButtonProps) {
  const nativeApp = useNativeApp();

  if (nativeApp) {
    return null;
  }

  return (
    <a
      href="/download/app"
      className={`inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 text-white transition-all hover:border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-300 ${
        compact ? 'px-3 py-2 text-xs font-bold uppercase tracking-[0.18em]' : 'px-4 py-2.5 text-sm font-bold'
      }`}
      title="Baixar aplicativo Android"
    >
      {compact ? <Download size={14} /> : <Smartphone size={16} />}
      Baixar app
    </a>
  );
}
