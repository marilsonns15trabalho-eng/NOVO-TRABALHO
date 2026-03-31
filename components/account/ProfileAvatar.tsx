'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';
import { getProfileInitials } from '@/lib/profile-avatar';

interface ProfileAvatarProps {
  displayName?: string | null;
  className?: string;
  textClassName?: string;
}

export default function ProfileAvatar({
  displayName,
  className = '',
  textClassName = '',
}: ProfileAvatarProps) {
  const { avatarUrl, loadingAvatar } = useProfileAvatar();
  const initials = getProfileInitials(displayName);

  if (avatarUrl) {
    return (
      <div className={`overflow-hidden bg-zinc-900 ${className}`}>
        <img src={avatarUrl} alt={displayName || 'Foto de perfil'} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-black ${className}`}
    >
      {loadingAvatar ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <span className={`font-black ${textClassName}`}>{initials}</span>
      )}
    </div>
  );
}
