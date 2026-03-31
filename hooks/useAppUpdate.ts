'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isNativeApp } from '@/lib/platform';

interface RemoteAppVersionPayload {
  versionCode: number;
  versionName: string;
  updatedAt: string;
  downloadUrl: string;
  apkFileName: string;
  releaseNotes?: {
    title: string;
    highlights: string[];
  } | null;
}

interface InstalledAppInfo {
  version: string;
  build: string;
}

const DISMISS_PREFIX = 'lioness-app-update-dismissed:';

function parseNumericVersionParts(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .replace(/[^0-9.]+/g, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function compareVersionNames(installedVersion: string, remoteVersion: string) {
  const installedParts = parseNumericVersionParts(installedVersion);
  const remoteParts = parseNumericVersionParts(remoteVersion);
  const totalParts = Math.max(installedParts.length, remoteParts.length);

  for (let index = 0; index < totalParts; index += 1) {
    const installedPart = installedParts[index] ?? 0;
    const remotePart = remoteParts[index] ?? 0;

    if (remotePart > installedPart) {
      return 1;
    }

    if (remotePart < installedPart) {
      return -1;
    }
  }

  return 0;
}

export function useAppUpdate() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [installed, setInstalled] = useState<InstalledAppInfo | null>(null);
  const [remote, setRemote] = useState<RemoteAppVersionPayload | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const loginSessionKey = useMemo(() => {
    const userId = session?.user?.id;
    if (!userId) {
      return null;
    }

    return `${userId}:${session.user.last_sign_in_at ?? 'login'}`;
  }, [session?.user?.id, session?.user?.last_sign_in_at]);

  useEffect(() => {
    if (!isNativeApp()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const [{ App }, response] = await Promise.all([
          import('@capacitor/app'),
          fetch('/api/app/version', { cache: 'no-store' }),
        ]);

        if (!response.ok) {
          throw new Error('Versao remota indisponivel.');
        }

        const [appInfo, remoteInfo] = await Promise.all([
          App.getInfo(),
          response.json() as Promise<RemoteAppVersionPayload>,
        ]);

        if (cancelled) {
          return;
        }

        const installedInfo = {
          version: appInfo.version,
          build: appInfo.build,
        };

        setInstalled(installedInfo);
        setRemote(remoteInfo);

      } catch {
        if (!cancelled) {
          setInstalled(null);
          setRemote(null);
          setDismissed(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!remote || !loginSessionKey) {
      setDismissed(false);
      return;
    }

    const dismissKey = `${DISMISS_PREFIX}${remote.versionCode}:${loginSessionKey}`;
    setDismissed(sessionStorage.getItem(dismissKey) === '1');
  }, [loginSessionKey, remote]);

  const updateAvailable = useMemo(() => {
    if (!installed || !remote) {
      return false;
    }

    const installedBuild = Number(installed.build || 0);
    if (Number.isFinite(installedBuild) && installedBuild > 0 && remote.versionCode > installedBuild) {
      return true;
    }

    return compareVersionNames(installed.version, remote.versionName) > 0;
  }, [installed, remote]);

  const dismiss = () => {
    if (!remote || !loginSessionKey) {
      return;
    }

    const dismissKey = `${DISMISS_PREFIX}${remote.versionCode}:${loginSessionKey}`;
    sessionStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  return {
    loading,
    installed,
    remote,
    updateAvailable,
    dismissed,
    dismiss,
  };
}
