'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProfileAvatarManager from '@/components/account/ProfileAvatarManager';

export default function DashboardAvatarPage() {
  const router = useRouter();

  return <ProfileAvatarManager standalone onClose={() => router.push('/dashboard')} />;
}
