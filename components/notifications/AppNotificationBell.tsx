'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bell,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  Loader2,
  ReceiptText,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { pushRuntimeNotification } from '@/lib/native-app';
import { subscribeToPersistedNotifications } from '@/services/app-notifications.service';
import * as dashboardService from '@/services/dashboard.service';

interface AppNotificationBellProps {
  compact?: boolean;
}

export default function AppNotificationBell({ compact = false }: AppNotificationBellProps) {
  const { user, role } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<dashboardService.HeaderNotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.id || !role) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        setLoadingNotifications(true);
        const items = await dashboardService.fetchHeaderNotifications(user.id, role);
        setNotifications(items);
      } finally {
        setLoadingNotifications(false);
      }
    };

    void loadNotifications();

    const unsubscribeHeader = dashboardService.subscribeToHeaderNotifications(
      user.id,
      role,
      loadNotifications,
    );

    const unsubscribeRuntime = subscribeToPersistedNotifications(
      user.id,
      () => undefined,
      (item) => {
        void pushRuntimeNotification({
          title: item.title,
          body: item.description,
          route: item.route,
        });
      },
    );

    return () => {
      unsubscribeHeader();
      unsubscribeRuntime();
    };
  }, [role, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!notificationsRef.current) {
        return;
      }

      if (!notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const handleNotificationClick = async (notification: dashboardService.HeaderNotificationItem) => {
    if (!user?.id) {
      return;
    }

    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    setIsNotificationsOpen(false);

    try {
      await dashboardService.markHeaderNotificationsAsRead(user.id, [notification.id]);
    } catch (error) {
      console.error('Erro ao marcar notificacao como lida:', error);
    }

    router.push(notification.route);
  };

  const handleClearNotifications = async () => {
    if (!user?.id || notifications.length === 0 || clearingNotifications) {
      return;
    }

    const notificationIds = notifications.map((notification) => notification.id);
    setClearingNotifications(true);
    setNotifications([]);

    try {
      await dashboardService.markHeaderNotificationsAsRead(user.id, notificationIds);
    } catch (error) {
      console.error('Erro ao limpar notificacoes:', error);
    } finally {
      setClearingNotifications(false);
    }
  };

  const notificationCount = notifications.length;

  const formatNotificationTime = (value: string) => {
    if (!value) {
      return '';
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type: dashboardService.HeaderNotificationType) => {
    if (type === 'billing_due' || type === 'billing_late') {
      return <ReceiptText size={16} />;
    }

    if (type === 'workout_completion') {
      return <CheckCircle2 size={16} />;
    }

    if (type === 'new_anamnese') {
      return <ClipboardList size={16} />;
    }

    if (type === 'new_avaliacao' || type === 'avaliacao_evolution') {
      return <Activity size={16} />;
    }

    return <Dumbbell size={16} />;
  };

  const getNotificationAccent = (type: dashboardService.HeaderNotificationType) => {
    if (type === 'billing_late') {
      return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
    }

    if (type === 'billing_due') {
      return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
    }

    if (type === 'workout_completion') {
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    }

    if (type === 'avaliacao_evolution') {
      return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
    }

    if (type === 'new_anamnese') {
      return 'border-violet-500/20 bg-violet-500/10 text-violet-300';
    }

    if (type === 'new_avaliacao') {
      return 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300';
    }

    return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
  };

  const helperText = useMemo(() => {
    if (role === 'admin') {
      return 'Boletos, treinos, avaliacoes e avisos do sistema.';
    }

    if (role === 'professor') {
      return 'Treinos, avaliacoes e avisos do sistema.';
    }

    return 'Treinos, avaliacoes e avisos enviados pela equipe.';
  }, [role]);

  if (!user?.id || !role) {
    return null;
  }

  return (
    <div ref={notificationsRef} className="relative">
      <button
        onClick={() => setIsNotificationsOpen((current) => !current)}
        className={`relative rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 transition-colors hover:text-orange-400 ${
          compact ? 'p-2.5' : 'p-3'
        }`}
        title="Notificacoes"
        aria-label="Abrir notificacoes"
      >
        {loadingNotifications ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
        {notificationCount > 0 ? (
          <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        ) : null}
      </button>

      {isNotificationsOpen ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-2rem))] rounded-[28px] border border-zinc-800 bg-zinc-950/95 p-3 shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">Notificacoes</p>
                <Sparkles size={12} className="text-orange-400" />
              </div>
              <p className="text-xs text-zinc-500">{helperText}</p>
            </div>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              {notificationCount}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between px-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Nao lidas</p>
            <button
              type="button"
              onClick={() => void handleClearNotifications()}
              disabled={notifications.length === 0 || clearingNotifications}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 transition-all hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {clearingNotifications ? 'Limpando...' : 'Limpar notificacoes'}
            </button>
          </div>

          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-zinc-800 bg-black/20 px-4 py-6 text-sm text-zinc-500">
                Nenhuma notificacao relevante no momento.
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => void handleNotificationClick(notification)}
                  className="w-full rounded-[22px] border border-zinc-800 bg-black/20 px-4 py-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/70"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-2xl border p-3 ${getNotificationAccent(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-white">{notification.title}</p>
                        <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                          {formatNotificationTime(notification.occurred_at)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{notification.description}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
