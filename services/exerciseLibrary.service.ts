import { authorizedApiJson } from '@/lib/api-client';
import type { ExerciseLibraryItem } from '@/types/exercise-library';
import type { ExerciseLibrarySearchResponse } from '@/types/exercise-library';

const officialExercisePreviewCache = new Map<string, ExerciseLibraryItem | null>();

export async function searchOfficialExerciseLibrary(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], source: 'wger', powered_by: 'wger', searched_queries: [] } satisfies ExerciseLibrarySearchResponse;
  }

  const response = await authorizedApiJson<ExerciseLibrarySearchResponse>(
    `/api/exercise-library/search?q=${encodeURIComponent(trimmed)}`,
    { method: 'GET' },
  );

  rememberOfficialExerciseItems(response.results || []);
  return response;
}

function normalizeLookupTerm(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function pickBestOfficialExerciseMatch(
  results: ExerciseLibrarySearchResponse['results'],
  query: string,
) {
  const normalizedQuery = normalizeLookupTerm(query);
  if (!normalizedQuery || results.length === 0) {
    return results[0] || null;
  }

  return (
    results.find((item) => normalizeLookupTerm(item.display_name) === normalizedQuery) ||
    results.find((item) => normalizeLookupTerm(item.original_name) === normalizedQuery) ||
    results.find((item) => normalizeLookupTerm(item.display_name).includes(normalizedQuery)) ||
    results[0] ||
    null
  );
}

export function rememberOfficialExerciseItems(items: ExerciseLibraryItem[]) {
  items.forEach((item) => {
    const keys = [item.display_name, item.original_name]
      .map((value) => normalizeLookupTerm(value))
      .filter(Boolean);

    keys.forEach((key) => {
      officialExercisePreviewCache.set(key, item);
    });
  });
}

export async function resolveOfficialExercisePreview(
  query: string,
  preferredReference?: string | null,
) {
  const candidates = [preferredReference || '', query]
    .map((value) => value.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const cached = officialExercisePreviewCache.get(normalizeLookupTerm(candidate));
    if (cached) {
      return cached;
    }
  }

  for (const candidate of candidates) {
    const response = await searchOfficialExerciseLibrary(candidate);
    const bestMatch = pickBestOfficialExerciseMatch(response.results || [], candidate);
    if (bestMatch) {
      rememberOfficialExerciseItems([bestMatch]);
      return bestMatch;
    }
    officialExercisePreviewCache.set(normalizeLookupTerm(candidate), null);
  }

  return null;
}
