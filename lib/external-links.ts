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

function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  if (file.type === 'image/png') {
    return 'png';
  }

  if (file.type === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
}

function toBase64Payload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nao foi possivel preparar o arquivo para compartilhamento.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, data = ''] = result.split(',');
      resolve(data);
    };
    reader.readAsDataURL(file);
  });
}

export async function downloadFile(file: File, fallbackName?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fallbackName || file.name || 'arquivo';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
  }
}

export async function shareFile(options: {
  file: File;
  title?: string;
  text?: string;
  dialogTitle?: string;
}) {
  if (typeof window === 'undefined') {
    return false;
  }

  if (isNativeApp()) {
    try {
      const { Directory, Filesystem } = await import('@capacitor/filesystem');
      const extension = getFileExtension(options.file);
      const path = `share/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
      const data = await toBase64Payload(options.file);

      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Cache,
        recursive: true,
      });

      const { uri } = await Filesystem.getUri({
        path,
        directory: Directory.Cache,
      });

      await Share.share({
        title: options.title,
        text: options.text,
        files: [uri],
        dialogTitle: options.dialogTitle,
      });

      try {
        await Filesystem.deleteFile({
          path,
          directory: Directory.Cache,
        });
      } catch {}

      return true;
    } catch {}
  }

  if (navigator.share) {
    try {
      const shareData = {
        title: options.title,
        text: options.text,
        files: [options.file],
      };

      if (
        typeof navigator.canShare !== 'function' ||
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        return true;
      }
    } catch {}
  }

  return false;
}
