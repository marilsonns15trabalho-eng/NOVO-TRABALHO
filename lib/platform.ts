'use client';

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
