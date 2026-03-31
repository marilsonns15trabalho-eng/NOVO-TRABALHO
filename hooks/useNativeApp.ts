'use client';

import { useEffect, useState } from 'react';
import { isNativeApp } from '@/lib/platform';

export function useNativeApp() {
  const [nativeApp, setNativeApp] = useState(false);

  useEffect(() => {
    setNativeApp(isNativeApp());
  }, []);

  return nativeApp;
}
