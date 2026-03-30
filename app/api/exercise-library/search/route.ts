import { NextRequest, NextResponse } from 'next/server';
import { ApiRouteError, requireAuthenticatedCaller } from '@/lib/server/admin-auth';
import {
  filterWgerExercises,
  getWgerApiBase,
  getWgerSearchLanguage,
  mapWgerExerciseLibraryItem,
} from '@/lib/exercise-library';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let wgerCache:
  | {
      loadedAt: number;
      exercises: Record<string, any>[];
    }
  | null = null;

const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const PAGE_SIZE = 100;

async function loadWgerExerciseCatalog() {
  if (wgerCache && Date.now() - wgerCache.loadedAt < CACHE_TTL_MS) {
    return wgerCache.exercises;
  }

  const apiBase = getWgerApiBase();
  const language = getWgerSearchLanguage();
  const collected: Record<string, any>[] = [];

  let nextUrl = `${apiBase}/exerciseinfo/?limit=${PAGE_SIZE}&language=${language}`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || !Array.isArray(payload.results)) {
      throw new ApiRouteError(
        response.status || 500,
        'Nao foi possivel consultar a biblioteca oficial gratuita de exercicios.',
      );
    }

    collected.push(...payload.results);
    nextUrl = typeof payload.next === 'string' && payload.next ? payload.next : '';
  }

  wgerCache = {
    loadedAt: Date.now(),
    exercises: collected,
  };

  return collected;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedCaller(request);

    const query = request.nextUrl.searchParams.get('q')?.trim() || '';
    if (!query) {
      throw new ApiRouteError(400, 'Informe o nome do exercicio que deseja buscar.');
    }

    const catalog = await loadWgerExerciseCatalog();
    const filtered = filterWgerExercises(catalog, query).map(mapWgerExerciseLibraryItem);

    return NextResponse.json({
      results: filtered,
      source: 'wger',
      powered_by: 'wger',
      searched_queries: [query],
    });
  } catch (error) {
    if (error instanceof ApiRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Erro ao buscar biblioteca oficial gratuita de exercicios:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : 'Nao foi possivel consultar a biblioteca oficial gratuita de exercicios.',
      },
      { status: 500 },
    );
  }
}
