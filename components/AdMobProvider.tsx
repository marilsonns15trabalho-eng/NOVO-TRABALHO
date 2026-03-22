'use client';

import React, { useEffect } from 'react';
import { initializeAdMob, showBannerAd, hideBannerAd } from '@/lib/admob';
import { isNativePlatform } from '@capacitor/core';

export const AdMobProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const setupAds = async () => {
      if (isNativePlatform()) {
        await initializeAdMob();
        // Mostrar banner globalmente ou em telas específicas
        // Para este app, mostraremos o banner na base, acima do menu
        await showBannerAd();
      }
    };

    setupAds();

    return () => {
      if (isNativePlatform()) {
        hideBannerAd();
      }
    };
  }, []);

  return <>{children}</>;
};
