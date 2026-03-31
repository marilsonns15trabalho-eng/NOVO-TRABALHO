'use client';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNativeApp } from '@/lib/platform';

export type NativePermissionState =
  | 'granted'
  | 'prompt'
  | 'prompt-with-rationale'
  | 'denied'
  | 'limited'
  | 'unavailable';

export interface NativePermissionSnapshot {
  camera: NativePermissionState;
  notifications: NativePermissionState;
}

export const LIONESS_NOTIFICATION_CHANNEL_ID = 'lioness-general';

function normalizePermissionState(value: string | undefined | null): NativePermissionState {
  if (!value) {
    return 'unavailable';
  }

  switch (value) {
    case 'granted':
    case 'prompt':
    case 'prompt-with-rationale':
    case 'denied':
    case 'limited':
      return value;
    default:
      return 'unavailable';
  }
}

export async function ensureNotificationChannel() {
  if (!isNativeApp()) {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: LIONESS_NOTIFICATION_CHANNEL_ID,
      name: 'Avisos do app',
      description: 'Lembretes e avisos do Lioness Personal Estudio',
      importance: 4,
      visibility: 1,
      sound: undefined,
      vibration: true,
      lights: true,
    });
  } catch {}
}

export async function checkNativePermissions(): Promise<NativePermissionSnapshot> {
  if (!isNativeApp()) {
    return {
      camera: 'unavailable',
      notifications: 'unavailable',
    };
  }

  try {
    const [cameraPermissions, notificationPermissions] = await Promise.all([
      Camera.checkPermissions(),
      LocalNotifications.checkPermissions(),
    ]);

    return {
      camera: normalizePermissionState(cameraPermissions.camera),
      notifications: normalizePermissionState(notificationPermissions.display),
    };
  } catch {
    return {
      camera: 'unavailable',
      notifications: 'unavailable',
    };
  }
}

export async function requestCameraAccess(): Promise<NativePermissionState> {
  if (!isNativeApp()) {
    return 'unavailable';
  }

  const result = await Camera.requestPermissions({ permissions: ['camera'] });
  return normalizePermissionState(result.camera);
}

export async function requestNotificationAccess(): Promise<NativePermissionState> {
  if (!isNativeApp()) {
    return 'unavailable';
  }

  const result = await LocalNotifications.requestPermissions();
  const status = normalizePermissionState(result.display);

  if (status === 'granted') {
    await ensureNotificationChannel();
  }

  return status;
}

export async function sendNotificationPreview() {
  if (!isNativeApp()) {
    return;
  }

  await ensureNotificationChannel();

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now() % 2147483000,
        title: 'Lioness Personal Estudio',
        body: 'As notificacoes do aplicativo estao ativas neste aparelho.',
        channelId: LIONESS_NOTIFICATION_CHANNEL_ID,
        schedule: {
          at: new Date(Date.now() + 2500),
        },
        extra: {
          route: '/dashboard',
        },
      },
    ],
  });
}

export async function captureAssessmentPhotoFile(position: string): Promise<File> {
  if (!isNativeApp()) {
    throw new Error('A captura pela camera esta disponivel apenas no aplicativo.');
  }

  const permission = await requestCameraAccess();
  if (permission !== 'granted' && permission !== 'limited') {
    throw new Error('Permita o uso da camera para tirar fotos da avaliacao.');
  }

  const photo = await Camera.getPhoto({
    source: CameraSource.Camera,
    resultType: CameraResultType.Uri,
    quality: 92,
    correctOrientation: true,
    saveToGallery: false,
    presentationStyle: 'fullscreen',
  });

  if (!photo.webPath) {
    throw new Error('Nao foi possivel ler a foto capturada.');
  }

  const response = await fetch(photo.webPath);
  const blob = await response.blob();
  const normalizedFormat = photo.format === 'png' || photo.format === 'webp' ? photo.format : 'jpeg';
  const extension = normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat;
  const mimeType = blob.type || `image/${normalizedFormat}`;

  return new File([blob], `avaliacao-${position}-${Date.now()}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
