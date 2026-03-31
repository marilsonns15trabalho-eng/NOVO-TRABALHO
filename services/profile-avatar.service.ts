import { authorizedApiFetch, authorizedApiJson } from '@/lib/api-client';

export interface ProfileAvatarPayload {
  avatar_url: string | null;
  avatar_path: string | null;
  avatar_updated_at: string | null;
}

export async function fetchMyProfileAvatar() {
  return authorizedApiJson<ProfileAvatarPayload>('/api/account/avatar');
}

export async function uploadMyProfileAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authorizedApiFetch('/api/account/avatar', {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as ProfileAvatarPayload & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Nao foi possivel enviar a foto de perfil.');
  }

  return payload;
}

export async function deleteMyProfileAvatar() {
  return authorizedApiJson<ProfileAvatarPayload>('/api/account/avatar', {
    method: 'DELETE',
  });
}
