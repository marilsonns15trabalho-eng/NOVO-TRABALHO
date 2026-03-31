'use client';

import { registerPlugin } from '@capacitor/core';
import { isNativeApp } from '@/lib/platform';

interface LionessUpdaterPlugin {
  downloadAndInstall(options: {
    url: string;
    fileName: string;
  }): Promise<{
    started: boolean;
    downloadId?: number;
    fileName?: string;
  }>;
}

const LionessUpdater = registerPlugin<LionessUpdaterPlugin>('LionessUpdater');

export async function startNativeAppUpdate(options: {
  url: string;
  fileName: string;
}) {
  if (!isNativeApp()) {
    return { started: false };
  }

  return LionessUpdater.downloadAndInstall({
    url: options.url,
    fileName: options.fileName,
  });
}
