import { authorizedApiJson } from '@/lib/api-client';
import type { ExerciseLibrarySearchResponse } from '@/types/exercise-library';

export async function searchOfficialExerciseLibrary(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], source: 'wger', powered_by: 'wger', searched_queries: [] } satisfies ExerciseLibrarySearchResponse;
  }

  return authorizedApiJson<ExerciseLibrarySearchResponse>(
    `/api/exercise-library/search?q=${encodeURIComponent(trimmed)}`,
    { method: 'GET' },
  );
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
