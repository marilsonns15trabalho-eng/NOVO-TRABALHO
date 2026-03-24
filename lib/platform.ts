'use client';

let _isNative = false;

try {
  // Detecta Capacitor em runtime (sem import estático para não quebrar SSR)
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    _isNative = (window as any).Capacitor.isNativePlatform();
  }
} catch {
  _isNative = false;
}

export const isApp = _isNative;

/**
 * Detecta se está rodando em ambiente mobile (app ou tela pequena)
 */
export function isMobileScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Detecta app OU mobile browser
 */
export function isAppOrMobile(): boolean {
  return isApp || isMobileScreen();
}
