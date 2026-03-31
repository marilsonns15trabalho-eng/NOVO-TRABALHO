'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import { getProfileInitials } from '@/lib/profile-avatar';

interface ProfileAvatarProps {
  displayName?: string | null;
  className?: string;
  textClassName?: string;
  avatarUrl?: string | null;
  loading?: boolean;
}

export default function ProfileAvatar({
  displayName,
  className = '',
  textClassName = '',
  avatarUrl: avatarUrlOverride,
  loading: loadingOverride,
}: ProfileAvatarProps) {
  const { avatarUrl, loadingAvatar } = useProfileAvatar();
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getProfileInitials(displayName);
  const resolvedAvatarUrl = avatarUrlOverride === undefined ? avatarUrl : avatarUrlOverride;
  const resolvedLoading = loadingOverride ?? (avatarUrlOverride === undefined ? loadingAvatar : false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedAvatarUrl]);

  if (resolvedAvatarUrl && !imageFailed) {
    return (
      <div className={`overflow-hidden bg-zinc-900 ${className}`}>
        <img
          src={resolvedAvatarUrl}
          alt={displayName || 'Foto de perfil'}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-black ${className}`}
    >
      {resolvedLoading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <span className={`font-black ${textClassName}`}>{initials}</span>
      )}
    </div>
  );
}
