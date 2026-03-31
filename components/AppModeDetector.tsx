'use client';

import { useEffect } from 'react';
import { ensureNotificationChannel } from '@/lib/native-app';

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
    let removeBackButtonListener: (() => void) | null = null;
    let removeNotificationListener: (() => void) | null = null;

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
    void (async () => {
      try {
        const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
          import('@capacitor/app'),
          import('@capacitor/status-bar'),
          import('@capacitor/splash-screen'),
        ]);
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#000000' });
        await SplashScreen.hide();
        await ensureNotificationChannel();
        const listener = await App.addListener('backButton', () => {
          const currentPath = window.location.pathname;

          if (currentPath === '/' || currentPath === '/dashboard' || currentPath === '/aluno' || currentPath === '/auth') {
            App.exitApp();
            return;
          }

          if (window.history.length > 1) {
            window.history.back();
          }
        });

        removeBackButtonListener = () => {
          void listener.remove();
        };

        const notificationListener = await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (event) => {
            const route = event.notification.extra?.route;

            if (typeof route === 'string' && route.startsWith('/')) {
              window.location.assign(route);
            }
          },
        );

        removeNotificationListener = () => {
          void notificationListener.remove();
        };
      } catch {}
    })();

    return () => {
      window.removeEventListener('resize', applyDeviceMode);
      if (removeBackButtonListener) {
        removeBackButtonListener();
      }
      if (removeNotificationListener) {
        removeNotificationListener();
      }
    };
  }, []);

  return null;
}
