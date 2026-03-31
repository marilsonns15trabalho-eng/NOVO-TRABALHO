import { authorizedApiJson } from '@/lib/api-client';

export interface StudentAvatarPayload {
  user_id: string;
  avatar_url: string | null;
  avatar_path: string | null;
  avatar_updated_at: string | null;
}

export interface StudentAvatarFields {
  avatar_url?: string | null;
  avatar_path?: string | null;
  avatar_updated_at?: string | null;
}

export function collectLinkedAuthUserIds(
  items: Array<{ linked_auth_user_id?: string | null } | null | undefined>,
) {
  return Array.from(
    new Set(
      items
        .map((item) => item?.linked_auth_user_id?.trim() || '')
        .filter(Boolean),
    ),
  );
}

export async function fetchStudentAvatarMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, StudentAvatarPayload>();
  }

  try {
    const payload = await authorizedApiJson<StudentAvatarPayload[]>('/api/staff/student-avatars', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });

    return new Map(payload.map((item) => [item.user_id, item]));
  } catch {
    return new Map<string, StudentAvatarPayload>();
  }
}

export function attachStudentAvatar<T extends { linked_auth_user_id?: string | null }>(
  item: T,
  avatarMap: Map<string, StudentAvatarPayload>,
): T & StudentAvatarFields {
  const linkedAuthUserId = item.linked_auth_user_id?.trim() || '';
  const avatar = linkedAuthUserId ? avatarMap.get(linkedAuthUserId) : null;

  return {
    ...item,
    avatar_url: avatar?.avatar_url ?? null,
    avatar_path: avatar?.avatar_path ?? null,
    avatar_updated_at: avatar?.avatar_updated_at ?? null,
  };
}
