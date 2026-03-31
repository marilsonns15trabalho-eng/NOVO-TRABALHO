'use client';

import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { isNativeApp } from '@/lib/platform';

function openUrlWithAnchor(url: string, target: '_blank' | '_self' = '_blank') {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = target;
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function openExternalUrl(
  url: string,
  options?: {
    preferSystemBrowser?: boolean;
  },
) {
  if (typeof window === 'undefined') {
    return;
  }

  if (isNativeApp()) {
    if (options?.preferSystemBrowser) {
      try {
        openUrlWithAnchor(url);
        return;
      } catch {}
    }

    try {
      await Browser.open({ url });
      return;
    } catch {}
  }

  try {
    openUrlWithAnchor(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
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

function sanitizeExportFileName(fileName: string) {
  const normalized = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || `lioness-${Date.now()}`;
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
      const canShareResult = await Share.canShare().catch(() => ({ value: true }));
      if (!canShareResult.value) {
        return false;
      }

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

      try {
        await Share.share({
          title: options.title,
          text: options.text,
          url: uri,
          dialogTitle: options.dialogTitle,
        });
      } catch {
        await Share.share({
          title: options.title,
          text: options.text,
          files: [uri],
          dialogTitle: options.dialogTitle,
        });
      }

      window.setTimeout(() => {
        void Filesystem.deleteFile({
          path,
          directory: Directory.Cache,
        }).catch(() => undefined);
      }, 60000);

      return true;
    } catch (error) {
      console.error('Erro ao compartilhar arquivo no app:', error);
    }
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

export async function saveFileToDevice(options: {
  file: File;
  folderName?: string;
  preferredName?: string;
}) {
  if (typeof window === 'undefined' || !isNativeApp()) {
    return null;
  }

  try {
    const { Directory, Filesystem } = await import('@capacitor/filesystem');
    const currentPermissions = await Filesystem.checkPermissions().catch(() => ({ publicStorage: 'unavailable' }));
    if (currentPermissions.publicStorage !== 'granted') {
      const requested = await Filesystem.requestPermissions().catch(() => ({ publicStorage: 'unavailable' }));
      if (requested.publicStorage !== 'granted') {
        return null;
      }
    }

    const extension = getFileExtension(options.file);
    const preferredName =
      options.preferredName ||
      (options.file.name?.includes('.') ? options.file.name : `${options.file.name}.${extension}`);
    const fileName = sanitizeExportFileName(preferredName);
    const folderName = sanitizeExportFileName(options.folderName || 'Lioness');
    const path = `${folderName}/${fileName}`;
    const data = await toBase64Payload(options.file);

    const result = await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Documents,
      recursive: true,
    });

    return {
      fileName,
      path,
      uri: result.uri,
    };
  } catch (error) {
    console.error('Erro ao salvar arquivo no aparelho:', error);
    return null;
  }
}
