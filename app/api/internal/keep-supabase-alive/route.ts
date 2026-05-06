import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json(
      { error: 'Nao autorizado.' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from('user_profiles').select('id').limit(1).maybeSingle();

    if (error) {
      return Response.json(
        {
          ok: false,
          error: error.message,
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        },
      );
    }

    return Response.json(
      {
        ok: true,
        touchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Falha inesperada no keep-alive.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}
