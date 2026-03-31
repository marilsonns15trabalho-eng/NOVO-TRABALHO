'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCachedNativeFileSrc, cacheNativeBlobFile } from '@/lib/native-file-cache';
import { useNativeApp } from '@/hooks/useNativeApp';
import { buildProfileAvatarCachePath } from '@/lib/profile-avatar';
import { fetchMyProfileAvatar } from '@/services/profile-avatar.service';

const memoryAvatarCache = new Map<string, string | null>();
const pendingLoads = new Map<string, Promise<string | null>>();

async function resolveAvatarUrl(params: {
  profileId: string;
  avatarPath: string;
  avatarUpdatedAt?: string | null;
  nativeApp: boolean;
}) {
  const versionKey = params.avatarUpdatedAt || 'avatar';
  const cacheKey = `${params.profileId}:${params.avatarPath}:${versionKey}:${params.nativeApp ? 'native' : 'web'}`;

  if (memoryAvatarCache.has(cacheKey)) {
    return memoryAvatarCache.get(cacheKey) ?? null;
  }

  const pending = pendingLoads.get(cacheKey);
  if (pending) {
    return pending;
  }

  const loader = (async () => {
    if (params.nativeApp) {
      const nativePath = buildProfileAvatarCachePath(params.profileId, params.avatarUpdatedAt);
      const cachedSrc = await getCachedNativeFileSrc(nativePath);

      if (cachedSrc) {
        memoryAvatarCache.set(cacheKey, cachedSrc);
        return cachedSrc;
      }

      const response = await fetchMyProfileAvatar();
      if (!response.avatar_url) {
        memoryAvatarCache.set(cacheKey, null);
        return null;
      }

      const imageResponse = await fetch(response.avatar_url, { cache: 'force-cache' });
      if (!imageResponse.ok) {
        memoryAvatarCache.set(cacheKey, response.avatar_url);
        return response.avatar_url;
      }

      const blob = await imageResponse.blob();
      const cachedFileSrc = await cacheNativeBlobFile(nativePath, blob);
      const finalUrl = cachedFileSrc || response.avatar_url;
      memoryAvatarCache.set(cacheKey, finalUrl);
      return finalUrl;
    }

    const response = await fetchMyProfileAvatar();
    const finalUrl = response.avatar_url || null;
    memoryAvatarCache.set(cacheKey, finalUrl);
    return finalUrl;
  })().finally(() => {
    pendingLoads.delete(cacheKey);
  });

  pendingLoads.set(cacheKey, loader);
  return loader;
}

export function useProfileAvatar() {
  const { profile } = useAuth();
  const nativeApp = useNativeApp();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const avatarKey = useMemo(
    () =>
      profile?.id && profile.avatar_path
        ? `${profile.id}:${profile.avatar_path}:${profile.avatar_updated_at || 'avatar'}`
        : null,
    [profile?.avatar_path, profile?.avatar_updated_at, profile?.id],
  );

  useEffect(() => {
    let cancelled = false;

    if (!profile?.id || !profile.avatar_path) {
      setAvatarUrl(null);
      setLoadingAvatar(false);
      return;
    }

    setLoadingAvatar(true);
    void resolveAvatarUrl({
      profileId: profile.id,
      avatarPath: profile.avatar_path,
      avatarUpdatedAt: profile.avatar_updated_at,
      nativeApp,
    })
      .then((resolvedUrl) => {
        if (!cancelled) {
          setAvatarUrl(resolvedUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvatarUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAvatar(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [avatarKey, nativeApp, profile?.avatar_path, profile?.avatar_updated_at, profile?.id]);

  return {
    avatarUrl,
    loadingAvatar,
  };
}
