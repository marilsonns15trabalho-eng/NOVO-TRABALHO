'use client';

export const APP_PUBLIC_URL = 'https://lioness-personal-estudio.vercel.app';

export function isNativeApp(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export const isApp = isNativeApp();

export function isMobileScreen(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 768;
}

export function isAppOrMobile(): boolean {
  return isNativeApp() || isMobileScreen();
}

export function getPublicAppUrl(path = '/'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, APP_PUBLIC_URL).toString();
}
