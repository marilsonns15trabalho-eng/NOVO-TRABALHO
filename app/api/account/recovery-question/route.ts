import { NextRequest, NextResponse } from 'next/server';
import { ApiRouteError } from '@/lib/server/admin-auth';
import { findAuthUserByEmail } from '@/lib/server/supabase-admin';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email) {
      throw new ApiRouteError(400, 'Informe o e-mail cadastrado.');
    }

    const authUser = await findAuthUserByEmail(email);
    if (!authUser) {
      throw new ApiRouteError(404, 'Nao existe recuperacao configurada para este e-mail.');
    }

    const { data: profile, error } = await getSupabaseAdmin()
      .from('user_profiles')
      .select('secret_question, password_recovery_enabled')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile?.password_recovery_enabled || !profile.secret_question) {
      throw new ApiRouteError(404, 'Nao existe recuperacao configurada para este e-mail.');
    }

    return NextResponse.json({
      question: profile.secret_question,
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao buscar pergunta secreta:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel buscar a pergunta secreta.' },
      { status: 500 }
    );
  }
}
