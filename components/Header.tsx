'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, CheckCircle2, Dumbbell, Loader2, LogOut, Menu, ReceiptText, Sparkles } from 'lucide-react';
import AppDownloadButton from '@/components/app/AppDownloadButton';
import { useAuth } from '@/hooks/useAuth';
import { useNativeApp } from '@/hooks/useNativeApp';
import * as dashboardService from '@/services/dashboard.service';
import { formatDatePtBr } from '@/lib/date';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

function getRoleAccent(role: string | null) {
  if (role === 'admin') {
    return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
  }

  if (role === 'professor') {
    return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
  }

  return 'border-zinc-800 bg-zinc-900/80 text-zinc-300';
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const nativeApp = useNativeApp();
  const [notifications, setNotifications] = useState<dashboardService.HeaderNotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if ((role !== 'admin' && role !== 'professor') || !user?.id) {
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

    const unsubscribe = dashboardService.subscribeToHeaderNotifications(user.id, role, loadNotifications);
    return unsubscribe;
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

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuario';
  const firstName = displayName.split(' ')[0];
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [displayName]
  );

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }).format(new Date()),
    []
  );

  const notificationCount = notifications.length;

  const formatNotificationTime = (value: string) => {
    if (!value) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatDatePtBr(value);
    }

    const date = new Date(value);
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

    return 'border-sky-500/20 bg-sky-500/10 text-sky-300';
  };

  return (
    <header className={`sticky top-0 z-30 border-b border-zinc-800/80 bg-black/75 backdrop-blur-xl ${nativeApp ? 'px-4 py-3 md:px-6 md:py-4' : 'px-4 py-3 md:px-8 md:py-4'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 transition-colors hover:text-orange-400 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-bold tracking-tight text-white md:text-2xl">
                {title}
              </p>
              {!nativeApp ? <Sparkles size={14} className="hidden text-orange-400 sm:block" /> : null}
            </div>
            <div className={`mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500 ${nativeApp ? 'hidden sm:flex' : ''}`}>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={12} />
                {todayLabel}
              </span>
              <span className={`inline-flex rounded-full border px-2.5 py-1 font-bold uppercase tracking-[0.22em] ${getRoleAccent(role)}`}>
                {role || 'sem perfil'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
          <AppDownloadButton compact />

          {(role === 'admin' || role === 'professor') && (
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setIsNotificationsOpen((current) => !current)}
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-zinc-400 transition-colors hover:text-orange-400"
                title="Notificacoes"
                aria-label="Abrir notificacoes"
              >
                {loadingNotifications ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
                {notificationCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-2rem))] rounded-[28px] border border-zinc-800 bg-zinc-950/95 p-3 shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)] backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-3 pb-3">
                    <div>
                      <p className="text-sm font-bold text-white">Notificacoes</p>
                      <p className="text-xs text-zinc-500">
                        {role === 'admin'
                          ? 'Boletos, treinos concluidos e atualizacoes de fichas.'
                          : 'Treinos concluidos e atualizacoes de fichas.'}
                      </p>
                    </div>
                    <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                      {notificationCount}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between px-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">
                      Nao lidas
                    </p>
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
              )}
            </div>
          )}

          <div className="hidden items-center gap-3 rounded-[24px] border border-zinc-800 bg-zinc-950/85 px-3 py-2 lg:flex">
            <div className="text-right">
              <p className="text-sm font-bold text-white">Ola, {firstName}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-black text-black">
              {initials}
            </div>

            <button
              onClick={handleSignOut}
              className="rounded-xl p-2 text-zinc-500 transition-colors hover:text-red-400"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
