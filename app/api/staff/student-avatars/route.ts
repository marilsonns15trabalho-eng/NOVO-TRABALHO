import { NextRequest, NextResponse } from 'next/server';
import { STORAGE_BUCKETS } from '@/lib/constants';
import { ApiRouteError, requireAuthenticatedCaller } from '@/lib/server/admin-auth';

export const runtime = 'nodejs';

const SIGNED_URL_EXPIRES_IN = 60 * 60 * 24 * 7;

type AvatarRow = {
  id: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
};

async function buildSignedAvatarUrls(
  admin: Awaited<ReturnType<typeof requireAuthenticatedCaller>>['admin'],
  rows: AvatarRow[],
) {
  const validRows = rows.filter((row) => row.avatar_path);
  if (validRows.length === 0) {
    return [];
  }

  const paths = validRows.map((row) => row.avatar_path as string);

  try {
    const { data, error } = await admin.storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .createSignedUrls(paths, SIGNED_URL_EXPIRES_IN);

    if (error || !data) {
      throw error || new Error('Nao foi possivel gerar os acessos das fotos.');
    }

    return validRows.map((row, index) => ({
      user_id: row.id,
      avatar_url: data[index]?.signedUrl || null,
      avatar_path: row.avatar_path,
      avatar_updated_at: row.avatar_updated_at,
    }));
  } catch {
    const fallbackResults = await Promise.all(
      validRows.map(async (row) => {
        const { data, error } = await admin.storage
          .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
          .createSignedUrl(row.avatar_path as string, SIGNED_URL_EXPIRES_IN);

        if (error) {
          return {
            user_id: row.id,
            avatar_url: null,
            avatar_path: row.avatar_path,
            avatar_updated_at: row.avatar_updated_at,
          };
        }

        return {
          user_id: row.id,
          avatar_url: data.signedUrl,
          avatar_path: row.avatar_path,
          avatar_updated_at: row.avatar_updated_at,
        };
      }),
    );

    return fallbackResults;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, callerProfile } = await requireAuthenticatedCaller(request);

    if (
      callerProfile.role !== 'admin' &&
      callerProfile.role !== 'professor' &&
      !callerProfile.is_super_admin
    ) {
      throw new ApiRouteError(403, 'Acesso restrito a equipe.');
    }

    const body = (await request.json()) as { userIds?: string[] };
    const requestedIds = Array.isArray(body?.userIds)
      ? body.userIds.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean)
      : [];

    const uniqueIds = Array.from(new Set(requestedIds));

    if (uniqueIds.length === 0) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    const { data, error } = await admin
      .from('user_profiles')
      .select('id, avatar_path, avatar_updated_at')
      .in('id', uniqueIds)
      .not('avatar_path', 'is', null);

    if (error) {
      throw error;
    }

    const payload = await buildSignedAvatarUrls(
      admin,
      (data || []) as AvatarRow[],
    );

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao carregar avatares das alunas:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel carregar as fotos das alunas.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}
