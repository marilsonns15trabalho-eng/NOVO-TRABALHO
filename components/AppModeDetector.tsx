'use client';

import { useEffect } from 'react';

function resolveDeviceMode() {
  const hasTouch = window.matchMedia('(pointer: coarse)').matches;
  const isMobileAgent = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
  const isTabletAgent = /iPad|Tablet/i.test(navigator.userAgent);

  if (isMobileAgent || (hasTouch && window.innerWidth < 820)) {
    return 'mobile';
  }

  if (isTabletAgent || (hasTouch && window.innerWidth < 1180)) {
    return 'tablet';
  }

  return 'desktop';
}

export default function AppModeDetector() {
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

    const applyDeviceMode = () => {
      const device = resolveDeviceMode();

      root.dataset.device = device;
      body.dataset.device = device;
      body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
      body.classList.add(`device-${device}`);
    };

    applyDeviceMode();
    window.addEventListener('resize', applyDeviceMode);

    if (!isCapacitor) {
      return () => window.removeEventListener('resize', applyDeviceMode);
    }

    body.classList.add('app-mode');

    const handleBackButton = () => {
      if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('resize', applyDeviceMode);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

  return null;
}
