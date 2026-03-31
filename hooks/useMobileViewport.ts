'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 767;

export function useMobileViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  return isMobileViewport;
}
