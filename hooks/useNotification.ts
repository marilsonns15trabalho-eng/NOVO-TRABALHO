'use client';
import { useState, useCallback, useRef } from 'react';
import { DEFAULTS } from '@/lib/constants';
import type { Notification } from '@/types/common';

export function useNotification() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /** Exibe uma notificação com auto-dismiss */
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setNotification({ message, type });

    timeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, DEFAULTS.NOTIFICATION_TIMEOUT_MS);
  }, []);

  /** Limpa a notificação manualmente */
  const clearNotification = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setNotification(null);
  }, []);

  return { notification, showNotification, clearNotification };
}
