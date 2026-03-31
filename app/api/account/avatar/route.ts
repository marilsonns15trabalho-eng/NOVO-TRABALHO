import { NextRequest, NextResponse } from 'next/server';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { ApiRouteError, requireAuthenticatedCaller } from '@/lib/server/admin-auth';

export const runtime = 'nodejs';

const MAX_PROFILE_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24 * 7;

async function loadCurrentAvatar(admin: Awaited<ReturnType<typeof requireAuthenticatedCaller>>['admin'], userId: string) {
  const { data, error } = await admin
    .from('user_profiles')
    .select('avatar_path, avatar_updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    avatarPath: data?.avatar_path || null,
    avatarUpdatedAt: data?.avatar_updated_at || null,
  };
}

async function buildAvatarPayload(
  admin: Awaited<ReturnType<typeof requireAuthenticatedCaller>>['admin'],
  avatarPath: string | null,
  avatarUpdatedAt: string | null,
) {
  if (!avatarPath) {
    return {
      avatar_url: null,
      avatar_path: null,
      avatar_updated_at: null,
    };
  }

  const { data, error } = await admin.storage
    .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
    .createSignedUrl(avatarPath, SIGNED_URL_EXPIRES_IN);

  if (error) {
    throw error;
  }

  return {
    avatar_url: data.signedUrl,
    avatar_path: avatarPath,
    avatar_updated_at: avatarUpdatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { admin, callerUserId } = await requireAuthenticatedCaller(request);
    const currentAvatar = await loadCurrentAvatar(admin, callerUserId);

    return NextResponse.json(
      await buildAvatarPayload(admin, currentAvatar.avatarPath, currentAvatar.avatarUpdatedAt),
    );
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao carregar avatar do perfil:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel carregar a foto de perfil.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, callerUserId } = await requireAuthenticatedCaller(request);
    const formData = await request.formData();
    const incomingFile = formData.get('file');

    if (!(incomingFile instanceof File)) {
      throw new ApiRouteError(400, 'Selecione uma imagem valida para o avatar.');
    }

    if (!ALLOWED_CONTENT_TYPES.has(incomingFile.type)) {
      throw new ApiRouteError(400, 'Envie apenas imagens JPG, PNG ou WEBP.');
    }

    if (incomingFile.size <= 0 || incomingFile.size > MAX_PROFILE_AVATAR_BYTES) {
      throw new ApiRouteError(400, 'A foto de perfil deve ter ate 5 MB.');
    }

    const previousAvatar = await loadCurrentAvatar(admin, callerUserId);
    const timestamp = new Date().toISOString();
    const avatarPath = `${callerUserId}/avatar-${Date.now()}.jpg`;
    const arrayBuffer = await incomingFile.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .upload(avatarPath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
        cacheControl: '31536000',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: updateError } = await admin
      .from('user_profiles')
      .update({
        avatar_path: avatarPath,
        avatar_updated_at: timestamp,
      })
      .eq('id', callerUserId);

    if (updateError) {
      await admin.storage.from(STORAGE_BUCKETS.PROFILE_PHOTOS).remove([avatarPath]);
      throw updateError;
    }

    if (previousAvatar.avatarPath && previousAvatar.avatarPath !== avatarPath) {
      await admin.storage.from(STORAGE_BUCKETS.PROFILE_PHOTOS).remove([previousAvatar.avatarPath]);
    }

    return NextResponse.json(await buildAvatarPayload(admin, avatarPath, timestamp));
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao atualizar avatar do perfil:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel atualizar a foto de perfil.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, callerUserId } = await requireAuthenticatedCaller(request);
    const currentAvatar = await loadCurrentAvatar(admin, callerUserId);

    if (currentAvatar.avatarPath) {
      await admin.storage.from(STORAGE_BUCKETS.PROFILE_PHOTOS).remove([currentAvatar.avatarPath]);
    }

    const { error } = await admin
      .from('user_profiles')
      .update({
        avatar_path: null,
        avatar_updated_at: null,
      })
      .eq('id', callerUserId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      avatar_url: null,
      avatar_path: null,
      avatar_updated_at: null,
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao remover avatar do perfil:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel remover a foto de perfil.' },
      { status: 500 },
    );
  }
}
