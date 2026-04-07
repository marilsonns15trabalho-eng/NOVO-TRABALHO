'use client';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { optimizeAssessmentPhotoFile } from '@/lib/assessmentPhotos';
import { isNativeApp } from '@/lib/platform';
import { optimizeProfileAvatarFile } from '@/lib/profile-avatar';

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
  storage: NativePermissionState;
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
      storage: 'unavailable',
    };
  }

  try {
    const [cameraPermissions, notificationPermissions, filesystemPermissions] = await Promise.all([
      Camera.checkPermissions(),
      LocalNotifications.checkPermissions(),
      Filesystem.checkPermissions().catch(() => ({ publicStorage: 'unavailable' })),
    ]);

    return {
      camera: normalizePermissionState(cameraPermissions.camera),
      notifications: normalizePermissionState(notificationPermissions.display),
      storage: normalizePermissionState(filesystemPermissions.publicStorage),
    };
  } catch {
    return {
      camera: 'unavailable',
      notifications: 'unavailable',
      storage: 'unavailable',
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

export async function requestStorageAccess(): Promise<NativePermissionState> {
  if (!isNativeApp()) {
    return 'unavailable';
  }

  const result = await Filesystem.requestPermissions().catch(() => ({ publicStorage: 'unavailable' }));
  return normalizePermissionState(result.publicStorage);
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

export async function pushRuntimeNotification(params: {
  title: string;
  body: string;
  route?: string;
}) {
  if (!isNativeApp()) {
    return;
  }

  const permissions = await LocalNotifications.checkPermissions();
  const status = normalizePermissionState(permissions.display);
  if (status !== 'granted') {
    return;
  }

  await ensureNotificationChannel();

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now() % 2147483000,
        title: params.title,
        body: params.body,
        channelId: LIONESS_NOTIFICATION_CHANNEL_ID,
        schedule: {
          at: new Date(Date.now() + 300),
        },
        extra: {
          route: params.route || '/dashboard',
        },
      },
    ],
  });
}

async function captureCameraFile(fileNamePrefix: string): Promise<File> {
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
  const normalizedFormat =
    photo.format === 'png' || photo.format === 'webp' || photo.format === 'gif'
      ? photo.format
      : 'jpeg';
  const extension = normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat;
  const mimeType = blob.type || `image/${normalizedFormat}`;

  return new File([blob], `${fileNamePrefix}-${Date.now()}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
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

  const rawFile = await captureCameraFile(`avaliacao-${position}`);
  return optimizeAssessmentPhotoFile(rawFile);
}

export async function captureWorkoutSharePhotoFile(): Promise<File> {
  if (!isNativeApp()) {
    throw new Error('A captura pela camera esta disponivel apenas no aplicativo.');
  }

  const permission = await requestCameraAccess();
  if (permission !== 'granted' && permission !== 'limited') {
    throw new Error('Permita o uso da camera para tirar a foto do compartilhamento.');
  }

  const rawFile = await captureCameraFile('treino-compartilhar');
  return optimizeAssessmentPhotoFile(rawFile);
}

export async function captureProfileAvatarFile(): Promise<File> {
  if (!isNativeApp()) {
    throw new Error('A captura pela camera esta disponivel apenas no aplicativo.');
  }

  const permission = await requestCameraAccess();
  if (permission !== 'granted' && permission !== 'limited') {
    throw new Error('Permita o uso da camera para tirar a foto de perfil.');
  }

  const rawFile = await captureCameraFile('avatar');
  return optimizeProfileAvatarFile(rawFile);
}
