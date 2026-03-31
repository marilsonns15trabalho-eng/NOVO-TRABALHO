'use client';

import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { isNativeApp } from '@/lib/platform';

export async function openExternalUrl(url: string) {
  if (typeof window === 'undefined') {
    return;
  }

  if (isNativeApp()) {
    try {
      await Browser.open({ url });
      return;
    } catch {}
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function shareContent(options: {
  title?: string;
  text?: string;
  url?: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (isNativeApp()) {
    try {
      await Share.share(options);
      return;
    } catch {}
  }

  if (navigator.share) {
    try {
      await navigator.share(options);
      return;
    } catch {}
  }

  if (options.url) {
    window.open(options.url, '_blank', 'noopener,noreferrer');
  }
}
