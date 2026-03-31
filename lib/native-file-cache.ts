'use client';

import { Capacitor } from '@capacitor/core';
import { isNativeApp } from '@/lib/platform';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nao foi possivel preparar o arquivo em cache.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, data = ''] = result.split(',');
      resolve(data);
    };
    reader.readAsDataURL(blob);
  });
}

export async function getCachedNativeFileSrc(path: string) {
  if (!isNativeApp()) {
    return null;
  }

  try {
    const { Directory, Filesystem } = await import('@capacitor/filesystem');
    await Filesystem.stat({
      path,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    });

    return Capacitor.convertFileSrc(uri);
  } catch {
    return null;
  }
}

export async function cacheNativeBlobFile(path: string, blob: Blob) {
  if (!isNativeApp()) {
    return null;
  }

  const { Directory, Filesystem } = await import('@capacitor/filesystem');
  const data = await blobToBase64(blob);

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

  return Capacitor.convertFileSrc(uri);
}

export async function removeCachedNativeFile(path: string) {
  if (!isNativeApp()) {
    return;
  }

  try {
    const { Directory, Filesystem } = await import('@capacitor/filesystem');
    await Filesystem.deleteFile({
      path,
      directory: Directory.Cache,
    });
  } catch {}
}
