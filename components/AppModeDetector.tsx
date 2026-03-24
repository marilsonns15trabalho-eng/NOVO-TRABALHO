'use client';

import { useEffect } from 'react';

/**
 * Detecta Capacitor e aplica classe app-mode no body.
 * Componente sem render visual — apenas side-effect.
 */
export default function AppModeDetector() {
  useEffect(() => {
    // Detectar Capacitor
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

    if (isCapacitor) {
      document.body.classList.add('app-mode');

      // Handler para botão voltar do Android
      const handleBackButton = (e: PopStateEvent) => {
        // Se há histórico de navegação, o browser já lida com popstate
        // Se não há, prevenimos o fechamento do app
        if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
          // Na raiz, não fecha o app — apenas ignora
          window.history.pushState(null, '', window.location.pathname);
        }
      };

      // Garantir que há sempre um state no histórico para interceptar
      window.history.pushState(null, '', window.location.pathname);
      window.addEventListener('popstate', handleBackButton);

      return () => {
        window.removeEventListener('popstate', handleBackButton);
      };
    }

    // Também ativar em telas pequenas (mobile browser)
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        document.body.classList.add('mobile-mode');
      } else {
        document.body.classList.remove('mobile-mode');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return null;
}
