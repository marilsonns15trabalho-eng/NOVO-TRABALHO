import { normalizeImageFile } from '@/lib/image-processing';

export function getProfileInitials(value?: string | null) {
  const base = value?.trim() || 'Usuario';
  return base
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildProfileAvatarCachePath(
  profileId: string,
  avatarUpdatedAt?: string | null,
) {
  const versionKey = (avatarUpdatedAt || 'avatar').replace(/[^a-zA-Z0-9-_]/g, '-');
  return `profile-photos/${profileId}-${versionKey}.jpg`;
}

export async function optimizeProfileAvatarFile(file: File): Promise<File> {
  return normalizeImageFile(file, {
    fileNamePrefix: `avatar-${Date.now()}`,
    cropSquare: true,
    targetSize: 1200,
    quality: 0.9,
  });
}
